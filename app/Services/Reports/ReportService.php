<?php

namespace App\Services\Reports;

use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\SaleReturn;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Models\PurchaseReturn;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ReportService
{
    public function sales(User $user, array $filters): array
    {
        $query = $this->salesQuery($user, $filters);
        $summaryQuery = clone $query;

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $paginator = $query
            ->with(['branch', 'warehouse', 'customer'])
            ->orderByDesc('sale_date')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'summary' => $this->salesSummary($summaryQuery),
            'rows' => $this->salesRows($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function salesReturns(User $user, array $filters): array
    {
        $query = $this->salesReturnsQuery($user, $filters);
        $summaryQuery = clone $query;

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $paginator = $query
            ->with(['sale.customer', 'branch', 'warehouse'])
            ->withCount('items')
            ->orderByDesc('return_date')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'summary' => $this->salesReturnsSummary($summaryQuery),
            'rows' => $this->salesReturnRows($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function purchases(User $user, array $filters): array
    {
        $query = $this->purchasesQuery($user, $filters);
        $summaryQuery = clone $query;

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $paginator = $query
            ->with(['branch', 'warehouse', 'supplier'])
            ->orderByDesc('purchase_date')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'summary' => $this->purchasesSummary($summaryQuery),
            'rows' => $this->purchaseRows($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function purchaseReturns(User $user, array $filters): array
    {
        $query = $this->purchaseReturnsQuery($user, $filters);
        $summaryQuery = clone $query;

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $paginator = $query
            ->with(['purchase.supplier', 'branch', 'warehouse'])
            ->withCount('items')
            ->orderByDesc('return_date')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'summary' => $this->purchaseReturnsSummary($summaryQuery),
            'rows' => $this->purchaseReturnRows($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function salePayments(User $user, array $filters): array
    {
        $query = $this->salePaymentsQuery($user, $filters);
        $summaryQuery = clone $query;

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $paginator = $query
            ->with(['sale.branch', 'sale.customer', 'paymentAccount', 'creator'])
            ->orderByDesc('payment_date')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'summary' => $this->salePaymentsSummary($summaryQuery),
            'rows' => $this->salePaymentRows($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function purchasePayments(User $user, array $filters): array
    {
        $query = $this->purchasePaymentsQuery($user, $filters);
        $summaryQuery = clone $query;

        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $paginator = $query
            ->with(['purchase.branch', 'purchase.supplier', 'paymentAccount', 'creator'])
            ->orderByDesc('payment_date')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'summary' => $this->purchasePaymentsSummary($summaryQuery),
            'rows' => $this->purchasePaymentRows($paginator),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    protected function salesQuery(User $user, array $filters): Builder
    {
        return Sale::query()
            ->where('business_id', $user->business_id)
            ->when(
                blank($filters['type'] ?? null),
                fn (Builder $query) => $query
                    ->where('type', '!=', 'quotation')
                    ->where('status', '!=', 'quotation')
            )
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function (Builder $builder) use ($search): void {
                        $builder
                            ->where('sale_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', fn (Builder $customer) => $customer->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(filled($filters['type'] ?? null), fn (Builder $query) => $query->where('type', $filters['type']))
            ->when(filled($filters['payment_status'] ?? null), fn (Builder $query) => $query->where('payment_status', $filters['payment_status']))
            ->when(filled($filters['branch_id'] ?? null), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']))
            ->when(filled($filters['warehouse_id'] ?? null), fn (Builder $query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(filled($filters['customer_id'] ?? null), fn (Builder $query) => $query->where('customer_id', $filters['customer_id']))
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query->whereDate('sale_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query->whereDate('sale_date', '<=', $filters['date_to']));
    }

    protected function salesSummary(Builder $query): array
    {
        return [
            'count' => (int) (clone $query)->count(),
            'total_amount' => $this->decimal((clone $query)->sum('total_amount')),
            'paid_amount' => $this->decimal((clone $query)->sum('paid_amount')),
            'due_amount' => $this->decimal((clone $query)->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as aggregate')->value('aggregate')),
            'tax_amount' => $this->decimal((clone $query)->sum('tax_amount')),
            'discount_amount' => $this->decimal((clone $query)->sum('discount_amount')),
            'shipping_charges' => $this->decimal((clone $query)->sum('shipping_charges')),
        ];
    }

    protected function salesReturnsQuery(User $user, array $filters): Builder
    {
        return SaleReturn::query()
            ->where('business_id', $user->business_id)
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function (Builder $builder) use ($search): void {
                        $builder
                            ->where('return_number', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%")
                            ->orWhereHas('sale', fn (Builder $sale) => $sale->where('sale_number', 'like', "%{$search}%"))
                            ->orWhereHas('sale.customer', fn (Builder $customer) => $customer->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(filled($filters['refund_method'] ?? null), fn (Builder $query) => $query->where('refund_method', $filters['refund_method']))
            ->when(filled($filters['sale_id'] ?? null), fn (Builder $query) => $query->where('sale_id', $filters['sale_id']))
            ->when(filled($filters['branch_id'] ?? null), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']))
            ->when(filled($filters['warehouse_id'] ?? null), fn (Builder $query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(
                filled($filters['customer_id'] ?? null),
                fn (Builder $query) => $query->whereHas('sale', fn (Builder $sale) => $sale->where('customer_id', $filters['customer_id']))
            )
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query->whereDate('return_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query->whereDate('return_date', '<=', $filters['date_to']));
    }

    protected function salesReturnsSummary(Builder $query): array
    {
        return [
            'count' => (int) (clone $query)->count(),
            'total_amount' => $this->decimal((clone $query)->sum('total_amount')),
        ];
    }

    protected function purchasesQuery(User $user, array $filters): Builder
    {
        return Purchase::query()
            ->where('business_id', $user->business_id)
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function (Builder $builder) use ($search): void {
                        $builder
                            ->where('purchase_number', 'like', "%{$search}%")
                            ->orWhere('supplier_invoice_no', 'like', "%{$search}%")
                            ->orWhereHas('supplier', fn (Builder $supplier) => $supplier->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(filled($filters['payment_status'] ?? null), fn (Builder $query) => $query->where('payment_status', $filters['payment_status']))
            ->when(filled($filters['branch_id'] ?? null), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']))
            ->when(filled($filters['warehouse_id'] ?? null), fn (Builder $query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(filled($filters['supplier_id'] ?? null), fn (Builder $query) => $query->where('supplier_id', $filters['supplier_id']))
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query->whereDate('purchase_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query->whereDate('purchase_date', '<=', $filters['date_to']));
    }

    protected function purchasesSummary(Builder $query): array
    {
        return [
            'count' => (int) (clone $query)->count(),
            'total_amount' => $this->decimal((clone $query)->sum('total_amount')),
            'paid_amount' => $this->decimal((clone $query)->sum('paid_amount')),
            'due_amount' => $this->decimal((clone $query)->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as aggregate')->value('aggregate')),
            'tax_amount' => $this->decimal((clone $query)->sum('tax_amount')),
            'discount_amount' => $this->decimal((clone $query)->sum('discount_amount')),
            'shipping_charges' => $this->decimal((clone $query)->sum('shipping_charges')),
        ];
    }

    protected function purchaseReturnsQuery(User $user, array $filters): Builder
    {
        return PurchaseReturn::query()
            ->where('business_id', $user->business_id)
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function (Builder $builder) use ($search): void {
                        $builder
                            ->where('return_number', 'like', "%{$search}%")
                            ->orWhere('notes', 'like', "%{$search}%")
                            ->orWhereHas('purchase', fn (Builder $purchase) => $purchase->where('purchase_number', 'like', "%{$search}%"))
                            ->orWhereHas('purchase.supplier', fn (Builder $supplier) => $supplier->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(filled($filters['purchase_id'] ?? null), fn (Builder $query) => $query->where('purchase_id', $filters['purchase_id']))
            ->when(filled($filters['branch_id'] ?? null), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']))
            ->when(filled($filters['warehouse_id'] ?? null), fn (Builder $query) => $query->where('warehouse_id', $filters['warehouse_id']))
            ->when(
                filled($filters['supplier_id'] ?? null),
                fn (Builder $query) => $query->whereHas('purchase', fn (Builder $purchase) => $purchase->where('supplier_id', $filters['supplier_id']))
            )
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query->whereDate('return_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query->whereDate('return_date', '<=', $filters['date_to']));
    }

    protected function purchaseReturnsSummary(Builder $query): array
    {
        return [
            'count' => (int) (clone $query)->count(),
            'total_amount' => $this->decimal((clone $query)->sum('total_amount')),
        ];
    }

    protected function salePaymentsQuery(User $user, array $filters): Builder
    {
        return SalePayment::query()
            ->where('business_id', $user->business_id)
            ->when(
                blank($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', 'completed')
            )
            ->whereHas('sale', function (Builder $sale) use ($user, $filters): void {
                $sale
                    ->where('business_id', $user->business_id)
                    ->when(filled($filters['branch_id'] ?? null), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']))
                    ->when(filled($filters['warehouse_id'] ?? null), fn (Builder $query) => $query->where('warehouse_id', $filters['warehouse_id']))
                    ->when(filled($filters['customer_id'] ?? null), fn (Builder $query) => $query->where('customer_id', $filters['customer_id']));
            })
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function (Builder $builder) use ($search): void {
                        $builder
                            ->where('reference', 'like', "%{$search}%")
                            ->orWhere('note', 'like', "%{$search}%")
                            ->orWhereHas('sale', fn (Builder $sale) => $sale->where('sale_number', 'like', "%{$search}%"))
                            ->orWhereHas('sale.customer', fn (Builder $customer) => $customer->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(filled($filters['method'] ?? null), fn (Builder $query) => $query->where('method', $filters['method']))
            ->when(filled($filters['payment_account_id'] ?? null), fn (Builder $query) => $query->where('payment_account_id', $filters['payment_account_id']))
            ->when(filled($filters['cashier_id'] ?? null), fn (Builder $query) => $query->where('created_by', $filters['cashier_id']))
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query->whereDate('payment_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query->whereDate('payment_date', '<=', $filters['date_to']));
    }

    protected function salePaymentsSummary(Builder $query): array
    {
        return [
            'count' => (int) (clone $query)->count(),
            'total_amount' => $this->decimal((clone $query)->sum('amount')),
        ];
    }

    protected function purchasePaymentsQuery(User $user, array $filters): Builder
    {
        return PurchasePayment::query()
            ->where('business_id', $user->business_id)
            ->when(
                blank($filters['status'] ?? null),
                fn (Builder $query) => $query->where('status', 'completed')
            )
            ->whereHas('purchase', function (Builder $purchase) use ($user, $filters): void {
                $purchase
                    ->where('business_id', $user->business_id)
                    ->when(filled($filters['branch_id'] ?? null), fn (Builder $query) => $query->where('branch_id', $filters['branch_id']))
                    ->when(filled($filters['warehouse_id'] ?? null), fn (Builder $query) => $query->where('warehouse_id', $filters['warehouse_id']))
                    ->when(filled($filters['supplier_id'] ?? null), fn (Builder $query) => $query->where('supplier_id', $filters['supplier_id']));
            })
            ->when(
                filled($filters['search'] ?? null),
                function (Builder $query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function (Builder $builder) use ($search): void {
                        $builder
                            ->where('reference', 'like', "%{$search}%")
                            ->orWhere('note', 'like', "%{$search}%")
                            ->orWhereHas('purchase', fn (Builder $purchase) => $purchase->where('purchase_number', 'like', "%{$search}%"))
                            ->orWhereHas('purchase.supplier', fn (Builder $supplier) => $supplier->where('name', 'like', "%{$search}%"));
                    });
                }
            )
            ->when(filled($filters['status'] ?? null), fn (Builder $query) => $query->where('status', $filters['status']))
            ->when(filled($filters['method'] ?? null), fn (Builder $query) => $query->where('method', $filters['method']))
            ->when(filled($filters['payment_account_id'] ?? null), fn (Builder $query) => $query->where('payment_account_id', $filters['payment_account_id']))
            ->when(filled($filters['cashier_id'] ?? null), fn (Builder $query) => $query->where('created_by', $filters['cashier_id']))
            ->when(filled($filters['date_from'] ?? null), fn (Builder $query) => $query->whereDate('payment_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to'] ?? null), fn (Builder $query) => $query->whereDate('payment_date', '<=', $filters['date_to']));
    }

    protected function purchasePaymentsSummary(Builder $query): array
    {
        return [
            'count' => (int) (clone $query)->count(),
            'total_amount' => $this->decimal((clone $query)->sum('amount')),
        ];
    }

    protected function salesRows(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()
            ->map(fn (Sale $sale): array => [
                'id' => $sale->id,
                'sale_number' => $sale->sale_number,
                'sale_date' => optional($sale->sale_date)->toDateString(),
                'type' => $sale->type,
                'status' => $sale->status,
                'payment_status' => $sale->payment_status,
                'branch' => $sale->branch ? [
                    'id' => $sale->branch->id,
                    'name' => $sale->branch->name,
                    'code' => $sale->branch->code,
                ] : null,
                'warehouse' => $sale->warehouse ? [
                    'id' => $sale->warehouse->id,
                    'name' => $sale->warehouse->name,
                    'code' => $sale->warehouse->code,
                ] : null,
                'customer' => $sale->customer ? [
                    'id' => $sale->customer->id,
                    'name' => $sale->customer->name,
                    'phone' => $sale->customer->phone,
                ] : null,
                'subtotal' => $this->decimal($sale->subtotal),
                'discount_amount' => $this->decimal($sale->discount_amount),
                'tax_amount' => $this->decimal($sale->tax_amount),
                'shipping_charges' => $this->decimal($sale->shipping_charges),
                'total_amount' => $this->decimal($sale->total_amount),
                'paid_amount' => $this->decimal($sale->paid_amount),
                'due_amount' => $this->decimal((float) $sale->total_amount - (float) $sale->paid_amount),
            ])
            ->all();
    }

    protected function salesReturnRows(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()
            ->map(fn (SaleReturn $saleReturn): array => [
                'id' => $saleReturn->id,
                'return_number' => $saleReturn->return_number,
                'return_date' => optional($saleReturn->return_date)->toDateString(),
                'status' => $saleReturn->status,
                'refund_method' => $saleReturn->refund_method,
                'sale' => $saleReturn->sale ? [
                    'id' => $saleReturn->sale->id,
                    'sale_number' => $saleReturn->sale->sale_number,
                    'status' => $saleReturn->sale->status,
                ] : null,
                'branch' => $saleReturn->branch ? [
                    'id' => $saleReturn->branch->id,
                    'name' => $saleReturn->branch->name,
                    'code' => $saleReturn->branch->code,
                ] : null,
                'warehouse' => $saleReturn->warehouse ? [
                    'id' => $saleReturn->warehouse->id,
                    'name' => $saleReturn->warehouse->name,
                    'code' => $saleReturn->warehouse->code,
                ] : null,
                'customer' => $saleReturn->sale?->customer ? [
                    'id' => $saleReturn->sale->customer->id,
                    'name' => $saleReturn->sale->customer->name,
                    'phone' => $saleReturn->sale->customer->phone,
                ] : null,
                'items_count' => (int) ($saleReturn->items_count ?? 0),
                'total_amount' => $this->decimal($saleReturn->total_amount),
            ])
            ->all();
    }

    protected function purchaseRows(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()
            ->map(fn (Purchase $purchase): array => [
                'id' => $purchase->id,
                'purchase_number' => $purchase->purchase_number,
                'supplier_invoice_no' => $purchase->supplier_invoice_no,
                'purchase_date' => optional($purchase->purchase_date)->toDateString(),
                'expected_date' => optional($purchase->expected_date)->toDateString(),
                'status' => $purchase->status,
                'payment_status' => $purchase->payment_status,
                'branch' => $purchase->branch ? [
                    'id' => $purchase->branch->id,
                    'name' => $purchase->branch->name,
                    'code' => $purchase->branch->code,
                ] : null,
                'warehouse' => $purchase->warehouse ? [
                    'id' => $purchase->warehouse->id,
                    'name' => $purchase->warehouse->name,
                    'code' => $purchase->warehouse->code,
                ] : null,
                'supplier' => $purchase->supplier ? [
                    'id' => $purchase->supplier->id,
                    'name' => $purchase->supplier->name,
                    'code' => $purchase->supplier->code,
                    'company' => $purchase->supplier->company,
                    'phone' => $purchase->supplier->phone,
                ] : null,
                'subtotal' => $this->decimal($purchase->subtotal),
                'discount_amount' => $this->decimal($purchase->discount_amount),
                'tax_amount' => $this->decimal($purchase->tax_amount),
                'shipping_charges' => $this->decimal($purchase->shipping_charges),
                'total_amount' => $this->decimal($purchase->total_amount),
                'paid_amount' => $this->decimal($purchase->paid_amount),
                'due_amount' => $this->decimal((float) $purchase->total_amount - (float) $purchase->paid_amount),
            ])
            ->all();
    }

    protected function purchaseReturnRows(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()
            ->map(fn (PurchaseReturn $purchaseReturn): array => [
                'id' => $purchaseReturn->id,
                'return_number' => $purchaseReturn->return_number,
                'return_date' => optional($purchaseReturn->return_date)->toDateString(),
                'status' => $purchaseReturn->status,
                'purchase' => $purchaseReturn->purchase ? [
                    'id' => $purchaseReturn->purchase->id,
                    'purchase_number' => $purchaseReturn->purchase->purchase_number,
                    'status' => $purchaseReturn->purchase->status,
                ] : null,
                'branch' => $purchaseReturn->branch ? [
                    'id' => $purchaseReturn->branch->id,
                    'name' => $purchaseReturn->branch->name,
                    'code' => $purchaseReturn->branch->code,
                ] : null,
                'warehouse' => $purchaseReturn->warehouse ? [
                    'id' => $purchaseReturn->warehouse->id,
                    'name' => $purchaseReturn->warehouse->name,
                    'code' => $purchaseReturn->warehouse->code,
                ] : null,
                'supplier' => $purchaseReturn->purchase?->supplier ? [
                    'id' => $purchaseReturn->purchase->supplier->id,
                    'name' => $purchaseReturn->purchase->supplier->name,
                    'code' => $purchaseReturn->purchase->supplier->code,
                    'company' => $purchaseReturn->purchase->supplier->company,
                    'phone' => $purchaseReturn->purchase->supplier->phone,
                ] : null,
                'items_count' => (int) ($purchaseReturn->items_count ?? 0),
                'total_amount' => $this->decimal($purchaseReturn->total_amount),
            ])
            ->all();
    }

    protected function salePaymentRows(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()
            ->map(fn (SalePayment $payment): array => [
                'id' => $payment->id,
                'payment_date' => optional($payment->payment_date)->toDateString(),
                'method' => $payment->method,
                'reference' => $payment->reference,
                'status' => $payment->status,
                'amount' => $this->decimal($payment->amount),
                'payment_currency' => $payment->payment_currency,
                'payment_amount' => $this->decimal($payment->payment_amount ?? $payment->amount),
                'exchange_rate' => $payment->exchange_rate ? $this->decimal($payment->exchange_rate) : null,
                'sale' => $payment->sale ? [
                    'id' => $payment->sale->id,
                    'sale_number' => $payment->sale->sale_number,
                    'status' => $payment->sale->status,
                ] : null,
                'branch' => $payment->sale?->branch ? [
                    'id' => $payment->sale->branch->id,
                    'name' => $payment->sale->branch->name,
                    'code' => $payment->sale->branch->code,
                ] : null,
                'customer' => $payment->sale?->customer ? [
                    'id' => $payment->sale->customer->id,
                    'name' => $payment->sale->customer->name,
                    'phone' => $payment->sale->customer->phone,
                ] : null,
                'payment_account' => $payment->paymentAccount ? [
                    'id' => $payment->paymentAccount->id,
                    'name' => $payment->paymentAccount->name,
                    'type' => $payment->paymentAccount->account_type,
                ] : null,
                'cashier' => $payment->creator ? [
                    'id' => $payment->creator->id,
                    'name' => $payment->creator->full_name,
                ] : null,
            ])
            ->all();
    }

    protected function purchasePaymentRows(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()
            ->map(fn (PurchasePayment $payment): array => [
                'id' => $payment->id,
                'payment_date' => optional($payment->payment_date)->toDateString(),
                'method' => $payment->method,
                'reference' => $payment->reference,
                'status' => $payment->status,
                'amount' => $this->decimal($payment->amount),
                'payment_currency' => $payment->payment_currency,
                'payment_amount' => $this->decimal($payment->payment_amount ?? $payment->amount),
                'exchange_rate' => $payment->exchange_rate ? $this->decimal($payment->exchange_rate) : null,
                'purchase' => $payment->purchase ? [
                    'id' => $payment->purchase->id,
                    'purchase_number' => $payment->purchase->purchase_number,
                    'status' => $payment->purchase->status,
                ] : null,
                'branch' => $payment->purchase?->branch ? [
                    'id' => $payment->purchase->branch->id,
                    'name' => $payment->purchase->branch->name,
                    'code' => $payment->purchase->branch->code,
                ] : null,
                'supplier' => $payment->purchase?->supplier ? [
                    'id' => $payment->purchase->supplier->id,
                    'name' => $payment->purchase->supplier->name,
                    'code' => $payment->purchase->supplier->code,
                    'company' => $payment->purchase->supplier->company,
                    'phone' => $payment->purchase->supplier->phone,
                ] : null,
                'payment_account' => $payment->paymentAccount ? [
                    'id' => $payment->paymentAccount->id,
                    'name' => $payment->paymentAccount->name,
                    'type' => $payment->paymentAccount->account_type,
                ] : null,
                'cashier' => $payment->creator ? [
                    'id' => $payment->creator->id,
                    'name' => $payment->creator->full_name,
                ] : null,
            ])
            ->all();
    }

    protected function decimal(mixed $value): string
    {
        return number_format((float) ($value ?? 0), 2, '.', '');
    }
}
