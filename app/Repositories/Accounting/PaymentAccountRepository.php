<?php

namespace App\Repositories\Accounting;

use App\Models\AccountTransaction;
use App\Models\PaymentAccount;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaymentAccountRepository extends BaseRepository
{
    public function __construct(PaymentAccount $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $transactionBalanceSubQuery = AccountTransaction::withoutGlobalScopes()
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0)")
            ->whereColumn('payment_account_id', 'payment_accounts.id');

        $query = $this->query()
            ->with(['chartOfAccount'])
            ->select('payment_accounts.*')
            ->selectSub($transactionBalanceSubQuery, 'transaction_balance')
            ->withCount('transactions')
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('account_number', 'like', "%{$search}%")
                            ->orWhere('bank_name', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['type'] ?? null),
                fn ($query) => $query->where('account_type', $filters['type'])
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('is_active', $filters['status'] === 'active')
            )
            ->orderBy('name');

        return $query->paginate($perPage)->withQueryString();
    }

    public function summary(): array
    {
        $totals = $this->query()
            ->selectRaw('COUNT(*) as total_accounts')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_accounts')
            ->selectRaw("SUM(CASE WHEN account_type = 'bank' THEN 1 ELSE 0 END) as bank_accounts")
            ->selectRaw('SUM(CASE WHEN coa_account_id IS NOT NULL THEN 1 ELSE 0 END) as linked_accounts')
            ->first();

        return [
            'total_accounts' => (int) ($totals?->total_accounts ?? 0),
            'active_accounts' => (int) ($totals?->active_accounts ?? 0),
            'bank_accounts' => (int) ($totals?->bank_accounts ?? 0),
            'linked_accounts' => (int) ($totals?->linked_accounts ?? 0),
        ];
    }
}
