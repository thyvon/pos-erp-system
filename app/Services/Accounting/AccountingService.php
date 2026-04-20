<?php

namespace App\Services\Accounting;

use App\Exceptions\Domain\DomainException;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Journal;
use App\Models\User;
use App\Repositories\Accounting\JournalRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    public function __construct(
        protected JournalRepository $journals,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->journals->paginateFiltered($filters);
    }

    public function summary(): array
    {
        return $this->journals->summary();
    }

    public function postJournal(string $businessId, array $data, ?User $actor = null): Journal
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Journal {
            $entries = collect($data['entries'] ?? []);
            $fiscalYear = $this->resolveFiscalYear($businessId, $data['fiscal_year_id'] ?? null);

            if ($entries->isEmpty()) {
                throw new DomainException('A journal requires at least one entry line.', 422);
            }

            $this->validateBalance($entries);
            $this->resolveAccounts($businessId, $entries);

            /** @var Journal $journal */
            $journal = $this->journals->create([
                'business_id' => $businessId,
                'fiscal_year_id' => $fiscalYear?->id,
                'journal_number' => $this->generateJournalNumber($businessId),
                'type' => $data['type'] ?? 'manual',
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'description' => $data['description'],
                'total_amount' => $entries->where('type', 'debit')->sum('amount'),
                'posted_at' => $data['posted_at'] ?? now(),
                'posted_by' => $actor?->id,
            ]);

            foreach ($entries as $entry) {
                $journal->entries()->create([
                    'account_id' => $entry['account_id'],
                    'type' => $entry['type'],
                    'amount' => round((float) $entry['amount'], 2),
                    'description' => $entry['description'] ?? null,
                ]);
            }

            $journal = $this->loadJournal($journal);

            $this->auditLogger->log(
                'journal_posted',
                Journal::class,
                $journal->id,
                $actor,
                $businessId,
                null,
                [
                    'journal_number' => $journal->journal_number,
                    'type' => $journal->type,
                    'total' => (string) $journal->total_amount,
                ]
            );

            return $journal;
        });
    }

    public function reverseJournal(string $businessId, Journal $journal, string $reason, ?User $actor = null): Journal
    {
        return DB::transaction(function () use ($businessId, $journal, $reason, $actor): Journal {
            /** @var Journal $lockedJournal */
            $lockedJournal = Journal::withoutGlobalScopes()
                ->with(['entries'])
                ->where('business_id', $businessId)
                ->whereKey($journal->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedJournal->reversed_by_id !== null) {
                throw new DomainException('This journal has already been reversed.', 422);
            }

            /** @var Journal $reversal */
            $reversal = $this->journals->create([
                'business_id' => $businessId,
                'fiscal_year_id' => $lockedJournal->fiscal_year_id,
                'journal_number' => $this->generateJournalNumber($businessId),
                'type' => 'reversal',
                'reference_type' => Journal::class,
                'reference_id' => $lockedJournal->id,
                'description' => 'Reversal of '.$lockedJournal->journal_number.': '.$reason,
                'total_amount' => $lockedJournal->total_amount,
                'posted_at' => now(),
                'posted_by' => $actor?->id,
            ]);

            foreach ($lockedJournal->entries as $entry) {
                $reversal->entries()->create([
                    'account_id' => $entry->account_id,
                    'type' => $entry->type === 'debit' ? 'credit' : 'debit',
                    'amount' => $entry->amount,
                    'description' => $reason,
                ]);
            }

            $lockedJournal->reversed_by_id = $reversal->id;
            $lockedJournal->save();

            $reversal = $this->loadJournal($reversal);

            $this->auditLogger->log(
                'journal_reversed',
                Journal::class,
                $lockedJournal->id,
                $actor,
                $businessId,
                ['original_journal_id' => $lockedJournal->id],
                ['reversal_journal_id' => $reversal->id, 'reason' => $reason]
            );

            return $reversal;
        });
    }

    protected function validateBalance(Collection $entries): void
    {
        $debit = round((float) $entries->where('type', 'debit')->sum('amount'), 2);
        $credit = round((float) $entries->where('type', 'credit')->sum('amount'), 2);

        if ($debit <= 0 || $credit <= 0 || $debit !== $credit) {
            throw new DomainException('Journal entries must be balanced before posting.', 422);
        }
    }

    protected function resolveAccounts(string $businessId, Collection $entries): void
    {
        $accounts = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereIn('id', $entries->pluck('account_id')->all())
            ->withCount('children')
            ->get()
            ->keyBy('id');

        foreach ($entries as $entry) {
            /** @var ChartOfAccount|null $account */
            $account = $accounts->get($entry['account_id']);

            if (! $account) {
                throw new DomainException('One or more journal accounts are invalid for this business.', 422);
            }

            if (! $account->is_active) {
                throw new DomainException("Account {$account->code} is inactive.", 422);
            }

            if ($account->children_count > 0) {
                throw new DomainException("Account {$account->code} is a parent account and cannot receive journal lines.", 422);
            }
        }
    }

    protected function resolveFiscalYear(string $businessId, ?string $fiscalYearId): ?FiscalYear
    {
        if (! filled($fiscalYearId)) {
            return null;
        }

        /** @var FiscalYear|null $fiscalYear */
        $fiscalYear = FiscalYear::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($fiscalYearId);

        if (! $fiscalYear) {
            throw new DomainException('Selected fiscal year is invalid for this business.', 422);
        }

        if ($fiscalYear->status !== 'active') {
            throw new DomainException('Only active fiscal years can receive new journal postings.', 422);
        }

        return $fiscalYear;
    }

    protected function generateJournalNumber(string $businessId): string
    {
        $prefix = 'JRN-'.now()->format('Y').'-';

        $lastNumber = Journal::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('journal_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('journal_number')
            ->value('journal_number');

        $next = $lastNumber === null
            ? 1
            : ((int) substr($lastNumber, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $next);
    }

    protected function loadJournal(Journal $journal): Journal
    {
        return $journal->load(['poster', 'reversedBy', 'entries.account'])->loadCount('entries');
    }
}
