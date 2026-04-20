<?php

namespace App\Services\Accounting;

use App\Exceptions\Domain\DomainException;
use App\Models\ChartOfAccount;
use App\Models\User;
use App\Repositories\Accounting\ChartOfAccountRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ChartOfAccountService
{
    public function __construct(
        protected ChartOfAccountRepository $accounts,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->accounts->paginateFiltered($filters);
    }

    public function summary(): array
    {
        return $this->accounts->summary();
    }

    public function create(string $businessId, array $data, ?User $actor = null): ChartOfAccount
    {
        return DB::transaction(function () use ($businessId, $data, $actor): ChartOfAccount {
            $parent = $this->resolveParent($businessId, $data['parent_id'] ?? null);

            /** @var ChartOfAccount $account */
            $account = $this->accounts->create([
                'business_id' => $businessId,
                'parent_id' => $parent?->id,
                'code' => $data['code'],
                'name' => $data['name'],
                'type' => $data['type'],
                'sub_type' => $data['sub_type'] ?? null,
                'normal_balance' => $data['normal_balance'],
                'is_system' => false,
                'is_active' => $data['is_active'] ?? true,
                'description' => $data['description'] ?? null,
            ]);

            $account = $this->loadAccount($account);

            $this->auditLogger->log(
                'coa_created',
                ChartOfAccount::class,
                $account->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($account)
            );

            return $account;
        });
    }

    public function update(string $businessId, ChartOfAccount $account, array $data, ?User $actor = null): ChartOfAccount
    {
        return DB::transaction(function () use ($businessId, $account, $data, $actor): ChartOfAccount {
            $this->ensureBelongsToBusiness($businessId, $account);

            if ($account->is_system) {
                throw new DomainException('System chart of account records cannot be edited.', 422);
            }

            $parent = array_key_exists('parent_id', $data)
                ? $this->resolveParent($businessId, $data['parent_id'])
                : $account->parent;

            if ($parent && $parent->id === $account->id) {
                throw new DomainException('An account cannot be its own parent.', 422);
            }

            $before = $this->auditPayload($account);

            /** @var ChartOfAccount $updated */
            $updated = $this->accounts->update($account, [
                'parent_id' => $parent?->id,
                'code' => $data['code'] ?? $account->code,
                'name' => $data['name'] ?? $account->name,
                'type' => $data['type'] ?? $account->type,
                'sub_type' => $data['sub_type'] ?? $account->sub_type,
                'normal_balance' => $data['normal_balance'] ?? $account->normal_balance,
                'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $account->is_active,
                'description' => array_key_exists('description', $data) ? $data['description'] : $account->description,
            ]);

            $updated = $this->loadAccount($updated);

            $this->auditLogger->log(
                'coa_updated',
                ChartOfAccount::class,
                $updated->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updated)
            );

            return $updated;
        });
    }

    public function delete(string $businessId, ChartOfAccount $account, ?User $actor = null): void
    {
        $this->ensureBelongsToBusiness($businessId, $account);

        $account->loadCount(['children', 'journalEntries', 'paymentAccounts']);

        if ($account->is_system) {
            throw new DomainException('System chart of account records cannot be deleted.', 422);
        }

        if ($account->children_count > 0) {
            throw new DomainException('Parent accounts with child accounts cannot be deleted.', 422);
        }

        if ($account->journal_entries_count > 0) {
            throw new DomainException('Accounts with journal entries cannot be deleted.', 422);
        }

        if ($account->payment_accounts_count > 0) {
            throw new DomainException('Accounts linked to payment accounts cannot be deleted.', 422);
        }

        $before = $this->auditPayload($account);

        $this->accounts->delete($account);

        $this->auditLogger->log(
            'coa_deleted',
            ChartOfAccount::class,
            $account->id,
            $actor,
            $businessId,
            $before,
            null
        );
    }

    protected function resolveParent(string $businessId, ?string $parentId): ?ChartOfAccount
    {
        if (! filled($parentId)) {
            return null;
        }

        /** @var ChartOfAccount|null $parent */
        $parent = ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($parentId);

        if (! $parent) {
            throw new DomainException('Selected parent account is invalid for this business.', 422);
        }

        return $parent;
    }

    protected function ensureBelongsToBusiness(string $businessId, ChartOfAccount $account): void
    {
        if ((string) $account->business_id !== $businessId) {
            throw new DomainException('Selected chart of account does not belong to this business.', 422);
        }
    }

    protected function loadAccount(ChartOfAccount $account): ChartOfAccount
    {
        return $account->load(['parent'])->loadCount(['children', 'journalEntries', 'paymentAccounts']);
    }

    protected function auditPayload(ChartOfAccount $account): array
    {
        return [
            'code' => $account->code,
            'name' => $account->name,
            'type' => $account->type,
            'sub_type' => $account->sub_type,
            'normal_balance' => $account->normal_balance,
            'is_system' => $account->is_system,
            'is_active' => $account->is_active,
        ];
    }
}
