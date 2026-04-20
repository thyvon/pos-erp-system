<?php

namespace App\Services\Accounting;

use App\Exceptions\Domain\DomainException;
use App\Models\AccountTransaction;
use App\Models\ChartOfAccount;
use App\Models\Journal;
use App\Models\PaymentAccount;
use App\Models\User;
use App\Repositories\Accounting\PaymentAccountRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PaymentAccountService
{
    public function __construct(
        protected PaymentAccountRepository $paymentAccounts,
        protected AccountingService $accountingService,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->paymentAccounts->paginateFiltered($filters);
    }

    public function summary(): array
    {
        return $this->paymentAccounts->summary();
    }

    public function create(string $businessId, array $data): PaymentAccount
    {
        return DB::transaction(function () use ($businessId, $data): PaymentAccount {
            $coaAccount = $this->resolveCoaAccount($businessId, $data['coa_account_id'] ?? null);

            /** @var PaymentAccount $account */
            $account = $this->paymentAccounts->create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'account_type' => $data['account_type'],
                'account_number' => $data['account_number'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'opening_balance' => round((float) ($data['opening_balance'] ?? 0), 2),
                'coa_account_id' => $coaAccount?->id,
                'is_active' => $data['is_active'] ?? true,
                'note' => $data['note'] ?? null,
            ]);

            return $this->loadPaymentAccount($account);
        });
    }

    public function update(string $businessId, PaymentAccount $account, array $data): PaymentAccount
    {
        return DB::transaction(function () use ($businessId, $account, $data): PaymentAccount {
            $this->ensureBelongsToBusiness($businessId, $account);
            $coaAccount = array_key_exists('coa_account_id', $data)
                ? $this->resolveCoaAccount($businessId, $data['coa_account_id'])
                : $account->chartOfAccount;

            /** @var PaymentAccount $updated */
            $updated = $this->paymentAccounts->update($account, [
                'name' => $data['name'] ?? $account->name,
                'account_type' => $data['account_type'] ?? $account->account_type,
                'account_number' => array_key_exists('account_number', $data) ? $data['account_number'] : $account->account_number,
                'bank_name' => array_key_exists('bank_name', $data) ? $data['bank_name'] : $account->bank_name,
                'opening_balance' => array_key_exists('opening_balance', $data) ? round((float) $data['opening_balance'], 2) : $account->opening_balance,
                'coa_account_id' => $coaAccount?->id,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $account->is_active,
                'note' => array_key_exists('note', $data) ? $data['note'] : $account->note,
            ]);

            return $this->loadPaymentAccount($updated);
        });
    }

    public function delete(string $businessId, PaymentAccount $account): void
    {
        $this->ensureBelongsToBusiness($businessId, $account);

        if ($account->transactions()->exists()) {
            throw new DomainException('Payment accounts with transaction history cannot be deleted.', 422);
        }

        $this->paymentAccounts->delete($account);
    }

    public function transfer(string $businessId, array $data, ?User $actor = null): array
    {
        return DB::transaction(function () use ($businessId, $data, $actor): array {
            $fromAccount = $this->resolvePaymentAccount($businessId, $data['from_payment_account_id']);
            $toAccount = $this->resolvePaymentAccount($businessId, $data['to_payment_account_id']);
            $amount = round((float) $data['amount'], 2);

            if ($fromAccount->id === $toAccount->id) {
                throw new DomainException('Transfer source and destination payment accounts must be different.', 422);
            }

            if (! $fromAccount->is_active || ! $toAccount->is_active) {
                throw new DomainException('Only active payment accounts can be used for transfers.', 422);
            }

            if ($amount <= 0) {
                throw new DomainException('Transfer amount must be greater than zero.', 422);
            }

            if ($this->currentBalance($fromAccount) < $amount) {
                throw new DomainException('Source payment account does not have enough balance.', 422);
            }

            if (! $fromAccount->coa_account_id || ! $toAccount->coa_account_id) {
                throw new DomainException('Both payment accounts must be linked to chart of account records.', 422);
            }

            /** @var AccountTransaction $debit */
            $debit = $fromAccount->transactions()->create([
                'business_id' => $businessId,
                'type' => 'debit',
                'amount' => $amount,
                'transaction_date' => $data['transaction_date'],
                'note' => $data['note'] ?? null,
            ]);

            /** @var AccountTransaction $credit */
            $credit = $toAccount->transactions()->create([
                'business_id' => $businessId,
                'type' => 'credit',
                'amount' => $amount,
                'transaction_date' => $data['transaction_date'],
                'note' => $data['note'] ?? null,
            ]);

            $journal = $this->accountingService->postJournal($businessId, [
                'type' => 'manual',
                'description' => 'Transfer between payment accounts: '.$fromAccount->name.' to '.$toAccount->name,
                'posted_at' => $data['transaction_date'],
                'entries' => [
                    ['account_id' => $toAccount->coa_account_id, 'type' => 'debit', 'amount' => $amount, 'description' => $data['note'] ?? null],
                    ['account_id' => $fromAccount->coa_account_id, 'type' => 'credit', 'amount' => $amount, 'description' => $data['note'] ?? null],
                ],
            ], $actor);

            $debit->reference_type = Journal::class;
            $debit->reference_id = $journal->id;
            $debit->save();

            $credit->reference_type = Journal::class;
            $credit->reference_id = $journal->id;
            $credit->save();

            $this->auditLogger->log(
                'payment_account_transfer',
                PaymentAccount::class,
                $fromAccount->id,
                $actor,
                $businessId,
                null,
                [
                    'from' => $fromAccount->name,
                    'to' => $toAccount->name,
                    'amount' => (string) $amount,
                    'journal_id' => $journal->id,
                ]
            );

            return [
                'journal' => $journal,
                'from_account' => $this->loadPaymentAccount($fromAccount->refresh()),
                'to_account' => $this->loadPaymentAccount($toAccount->refresh()),
            ];
        });
    }

    protected function resolveCoaAccount(string $businessId, ?string $coaAccountId): ?ChartOfAccount
    {
        if (! filled($coaAccountId)) {
            return null;
        }

        /** @var ChartOfAccount|null $account */
        $account = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($coaAccountId);

        if (! $account) {
            throw new DomainException('Selected chart of account is invalid for this business.', 422);
        }

        return $account;
    }

    protected function resolvePaymentAccount(string $businessId, string $paymentAccountId): PaymentAccount
    {
        /** @var PaymentAccount|null $account */
        $account = PaymentAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($paymentAccountId);

        if (! $account) {
            throw new DomainException('Selected payment account is invalid for this business.', 422);
        }

        return $account;
    }

    protected function ensureBelongsToBusiness(string $businessId, PaymentAccount $account): void
    {
        if ((string) $account->business_id !== $businessId) {
            throw new DomainException('Selected payment account does not belong to this business.', 422);
        }
    }

    protected function currentBalance(PaymentAccount $account): float
    {
        $signedTransactions = AccountTransaction::withoutGlobalScopes()
            ->where('payment_account_id', $account->id)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance")
            ->value('balance');

        return round((float) $account->opening_balance + (float) $signedTransactions, 2);
    }

    protected function loadPaymentAccount(PaymentAccount $account): PaymentAccount
    {
        return $account->load(['chartOfAccount'])->loadCount('transactions');
    }
}
