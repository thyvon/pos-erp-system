<?php

namespace App\Repositories\Expenses;

use App\Models\Expense;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExpenseRepository extends BaseRepository
{
    public function __construct(Expense $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['branch', 'expenseAccount', 'paymentAccount', 'creator'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);
                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('reference_no', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                }
            )
            ->when(filled($filters['branch_id'] ?? null), fn ($query) => $query->where('branch_id', $filters['branch_id']))
            ->when(filled($filters['expense_account_id'] ?? null), fn ($query) => $query->where('expense_account_id', $filters['expense_account_id']))
            ->when(filled($filters['payment_account_id'] ?? null), fn ($query) => $query->where('payment_account_id', $filters['payment_account_id']))
            ->when(filled($filters['date_from'] ?? null), fn ($query) => $query->whereDate('expense_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn ($query) => $query->whereDate('expense_date', '<=', $filters['date_to']))
            ->where(function ($query) use ($user): void {
                BranchAccess::scopeBranchQuery($query, $user, 'branch_id');
            })
            ->orderByDesc('expense_date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }
}
