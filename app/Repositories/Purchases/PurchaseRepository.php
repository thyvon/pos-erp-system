<?php

namespace App\Repositories\Purchases;

use App\Models\Purchase;
use App\Models\User;
use App\Repositories\BaseRepository;
use App\Support\BranchAccess;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PurchaseRepository extends BaseRepository
{
    public function __construct(Purchase $model)
    {
        parent::__construct($model);
    }

    public function paginateFiltered(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = $this->query()
            ->with(['branch', 'warehouse', 'supplier', 'creator'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($inner) use ($search): void {
                        $inner
                            ->where('purchase_number', 'like', "%{$search}%")
                            ->orWhere('supplier_invoice_no', 'like', "%{$search}%")
                            ->orWhereHas('supplier', fn ($supplierQuery) => $supplierQuery->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['branch_id'] ?? null), fn ($query) => $query->where('branch_id', $filters['branch_id']))
            ->when(filled($filters['warehouse_id'] ?? null), fn ($query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(filled($filters['supplier_id'] ?? null), fn ($query) => $query->where('supplier_id', $filters['supplier_id']))
            ->when(filled($filters['status'] ?? null), fn ($query) => $query->where('status', $filters['status']))
            ->when(filled($filters['payment_status'] ?? null), fn ($query) => $query->where('payment_status', $filters['payment_status']))
            ->when(filled($filters['date_from'] ?? null), fn ($query) => $query->whereDate('purchase_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn ($query) => $query->whereDate('purchase_date', '<=', $filters['date_to']))
            ->where(function ($query) use ($user): void {
                BranchAccess::scopeBranchQuery($query, $user, 'branch_id');
            })
            ->orderByDesc('purchase_date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }
}
