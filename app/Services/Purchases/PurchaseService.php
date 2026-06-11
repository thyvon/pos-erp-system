<?php

namespace App\Services\Purchases;

use App\Exceptions\Domain\DomainException;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReceive;
use App\Models\PurchaseReceiveItem;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\SubUnit;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Purchases\PurchaseRepository;
use App\Services\AuditService;
use App\Services\Foundation\EditWindowService;
use App\Services\Inventory\StockMovementService;
use App\Services\Purchases\PurchaseReceiveService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        protected PurchaseRepository $purchases,
        protected AuditService $auditService,
        protected StockMovementService $stockMovementService,
        protected EditWindowService $editWindow,
        protected \App\Services\Accounting\AccountingService $accountingService,
        protected \App\Services\Foundation\SettingsService $settings,
        protected PurchaseReceiveService $receiveService,
    ) {
    }
    public function nextLotNumber(string $businessId): ?string
    {
        $stockSettings = $this->settings->getGroup('stock', $businessId);

        if (! ($stockSettings['enable_auto_lot_number'] ?? false)) {
            return null;
        }

        $prefix = $stockSettings['lot_number_prefix'] ?? 'LOT';
        $format = $stockSettings['lot_number_format'] ?? 'MMYY';
        $datePart = '';

        if ($format === 'MMYY') {
            $datePart = now()->format('my');
        } elseif ($format === 'YYYYMM') {
            $datePart = now()->format('Ym');
        }

        $fullPrefix = $prefix.$datePart.'-';

        $lastLot = \App\Models\StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('lot_number', 'like', $fullPrefix.'%')
            ->orderByDesc('lot_number')
            ->value('lot_number');

        $nextSequence = $lastLot === null
            ? 1
            : ((int) substr($lastLot, strlen($fullPrefix))) + 1;

        return sprintf('%s%04d', $fullPrefix, $nextSequence);
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->purchases->paginateFiltered($filters, $user);
    }

    public function create(string $businessId, array $data, ?User $actor = null): Purchase
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Purchase {
            $branch = $this->resolveBranch($businessId, $data['branch_id']);
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id']);
            $supplier = $this->resolveSupplier($businessId, $data['supplier_id']);
            $this->ensureWarehouseBelongsToBranch($warehouse, $branch);
            $this->ensureUserCanAccessBranch($actor, $branch);

            $totals = $this->calculateTotals($data);

            /** @var Purchase $purchase */
            $purchase = $this->purchases->create([
                'business_id' => $businessId,
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier->id,
                'created_by' => $actor?->id,
                'purchase_number' => $this->generatePurchaseNumber($businessId),
                'supplier_invoice_no' => $data['supplier_invoice_no'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'payment_status' => 'unpaid',
                'purchase_date' => $data['purchase_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_type' => $data['discount_type'] ?? null,
                'discount_amount' => $totals['discount_amount'],
                'tax_scope' => $data['tax_scope'] ?? 'line',
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_rate_type' => $data['tax_rate_type'] ?? null,
                'tax_rate' => $data['tax_rate'] ?? 0,
                'tax_type' => $data['tax_type'] ?? null,
                'tax_amount' => $totals['tax_amount'],
                'shipping_charges' => $totals['shipping_charges'],
                'total_amount' => $totals['total_amount'],
                'paid_amount' => 0,
                'notes' => $data['notes'] ?? null,
                'staff_note' => $data['staff_note'] ?? null,
            ]);

            $this->syncItems($businessId, $purchase, $data['items']);
            $purchase = $this->loadPurchase($purchase);
            $this->audit('created', $purchase, $actor, null);

            return $purchase;
        });
    }

    public function update(string $businessId, Purchase $purchase, array $data, ?User $actor = null): Purchase
    {
        return DB::transaction(function () use ($businessId, $purchase, $data, $actor): Purchase {
            $branch = $this->resolveBranch($businessId, $data['branch_id']);
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id']);
            $this->ensureWarehouseBelongsToBranch($warehouse, $branch);
            $this->ensureUserCanAccessBranch($actor, $branch);

            if (in_array($purchase->status, ['received'], true)) {
                throw new DomainException('Purchase cannot be edited once fully received.', 422);
            }

            $purchase->load('returns');
            $this->assertPurchaseHasNoReturnDocuments($purchase);

            $totals = $this->calculateTotals($data);

            $purchase->update([
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $data['supplier_id'],
                'supplier_invoice_no' => $data['supplier_invoice_no'] ?? null,
                'status' => $data['status'] ?? $purchase->status,
                'purchase_date' => $data['purchase_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_type' => $data['discount_type'] ?? null,
                'discount_amount' => $totals['discount_amount'],
                'tax_scope' => $data['tax_scope'] ?? 'line',
                'tax_rate_id' => $data['tax_rate_id'] ?? null,
                'tax_rate_type' => $data['tax_rate_type'] ?? null,
                'tax_rate' => $data['tax_rate'] ?? 0,
                'tax_type' => $data['tax_type'] ?? null,
                'tax_amount' => $totals['tax_amount'],
                'shipping_charges' => $totals['shipping_charges'],
                'total_amount' => $totals['total_amount'],
                'notes' => $data['notes'] ?? null,
                'staff_note' => $data['staff_note'] ?? null,
            ]);

            $this->syncItemsUpdate($businessId, $purchase, $data['items']);
            $purchase = $this->loadPurchase($purchase);
            $this->audit('updated', $purchase, $actor, null);

            return $purchase;
        });
    }

    protected function syncItemsUpdate(string $businessId, Purchase $purchase, array $items): void
    {
        $existingItems = $purchase->items->keyBy('id');

        foreach ($items as $item) {
            $match = $existingItems->first(
                fn (PurchaseItem $ei) => (string) $ei->product_id === (string) $item['product_id']
                    && (string) ($ei->variation_id ?? '') === (string) ($item['variation_id'] ?? '')
                    && (string) ($ei->sub_unit_id ?? '') === (string) ($item['sub_unit_id'] ?? '')
            );

            if ($match) {
                $existingItems->forget($match->id);
                $this->updateItemLine($purchase, $match, $item);
            } else {
                $this->createItemLine($businessId, $purchase, $item);
            }
        }

        $receivedRemovedItem = $existingItems->first(
            fn (PurchaseItem $item): bool => $this->hasReceivedQuantity($item)
        );

        if ($receivedRemovedItem) {
            throw new DomainException('Received purchase item lines cannot be deleted.', 422);
        }

        $purchase->items()
            ->whereIn('id', $existingItems->keys()->all())
            ->where('received_quantity', 0)
            ->delete();
    }

    protected function updateItemLine(Purchase $purchase, PurchaseItem $item, array $data): void
    {
        $quantity = round((float) $data['quantity'], 4);
        $unitCost = round((float) $data['unit_cost'], 4);

        if ($this->hasReceivedQuantity($item)) {
            $this->assertReceivedItemUnchanged($item, $data);
        }

        if ($quantity < round((float) $item->received_quantity, 4)) {
            throw new DomainException('Purchase item quantity cannot be less than the already received quantity.', 422);
        }

        $lineSubtotal = round($quantity * $unitCost, 2);
        $discountAmount = round((float) ($data['discount_amount'] ?? 0), 2);
        $taxableAmount = max(0, $lineSubtotal - $discountAmount);

        $itemTaxAmount = $purchase->tax_scope === 'sale'
            ? 0
            : round($taxableAmount * (round((float) ($data['tax_rate'] ?? 0), 2) / 100), 2);

        $item->fill([
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'discount_type' => $data['discount_type'] ?? null,
            'discount_amount' => $discountAmount,
            'tax_rate_id' => $data['tax_rate_id'] ?? null,
            'tax_rate' => round((float) ($data['tax_rate'] ?? 0), 2),
            'tax_amount' => $itemTaxAmount,
            'total_amount' => round($taxableAmount + $itemTaxAmount, 2),
            'notes' => $data['notes'] ?? null,
        ]);
        $item->save();
    }

    protected function assertReceivedItemUnchanged(PurchaseItem $item, array $data): void
    {
        $same = round((float) $item->quantity, 4) === round((float) $data['quantity'], 4)
            && round((float) $item->unit_cost, 4) === round((float) $data['unit_cost'], 4)
            && $this->nullableString($item->discount_type) === $this->nullableString($data['discount_type'] ?? null)
            && round((float) $item->discount_amount, 2) === round((float) ($data['discount_amount'] ?? 0), 2)
            && $this->nullableString($item->tax_rate_id) === $this->nullableString($data['tax_rate_id'] ?? null)
            && round((float) $item->tax_rate, 2) === round((float) ($data['tax_rate'] ?? 0), 2)
            && $this->nullableString($item->notes) === $this->nullableString($data['notes'] ?? null);

        if (! $same) {
            throw new DomainException('Received purchase item lines cannot be edited.', 422);
        }
    }

    protected function hasReceivedQuantity(PurchaseItem $item): bool
    {
        return round((float) $item->received_quantity, 4) > 0;
    }

    protected function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    protected function createItemLine(string $businessId, Purchase $purchase, array $data): void
    {
        $product = $this->resolveProduct($businessId, $data['product_id']);
        $variation = $this->resolveVariation($businessId, $product, $data['variation_id'] ?? null);
        $subUnit = $this->resolveSubUnit($businessId, $product, $variation, $data['sub_unit_id'] ?? null);
        $this->validateSubUnitEligibility($product, $subUnit);
        $quantity = round((float) $data['quantity'], 4);
        $unitCost = round((float) $data['unit_cost'], 4);
        $lineSubtotal = round($quantity * $unitCost, 2);
        $discountAmount = round((float) ($data['discount_amount'] ?? 0), 2);
        $taxableAmount = max(0, $lineSubtotal - $discountAmount);

        $itemTaxAmount = $purchase->tax_scope === 'sale'
            ? 0
            : round($taxableAmount * (round((float) ($data['tax_rate'] ?? 0), 2) / 100), 2);

        $purchase->items()->create([
            'product_id' => $product->id,
            'variation_id' => $variation?->id,
            'sub_unit_id' => $subUnit?->id,
            'quantity' => $quantity,
            'received_quantity' => 0,
            'unit_cost' => $unitCost,
            'discount_type' => $data['discount_type'] ?? null,
            'discount_amount' => $discountAmount,
            'tax_rate_id' => $data['tax_rate_id'] ?? null,
            'tax_rate' => round((float) ($data['tax_rate'] ?? 0), 2),
            'tax_amount' => $itemTaxAmount,
            'total_amount' => round($taxableAmount + $itemTaxAmount, 2),
            'notes' => $data['notes'] ?? null,
        ]);
    }

    protected function syncItems(string $businessId, Purchase $purchase, array $items): void
    {
        foreach ($items as $item) {
            $product = $this->resolveProduct($businessId, $item['product_id']);
            $variation = $this->resolveVariation($businessId, $product, $item['variation_id'] ?? null);
            $subUnit = $this->resolveSubUnit($businessId, $product, $variation, $item['sub_unit_id'] ?? null);
            $this->validateSubUnitEligibility($product, $subUnit);
            $quantity = round((float) $item['quantity'], 4);
            $unitCost = round((float) $item['unit_cost'], 4);
            $lineSubtotal = round($quantity * $unitCost, 2);
            $discountAmount = round((float) ($item['discount_amount'] ?? 0), 2);
            $taxableAmount = max(0, $lineSubtotal - $discountAmount);

            $itemTaxAmount = $purchase->tax_scope === 'sale'
                ? 0
                : round($taxableAmount * (round((float) ($item['tax_rate'] ?? 0), 2) / 100), 2);

            $purchase->items()->create([
                'product_id' => $product->id,
                'variation_id' => $variation?->id,
                'sub_unit_id' => $subUnit?->id,
                'quantity' => $quantity,
                'received_quantity' => 0,
                'unit_cost' => $unitCost,
                'discount_type' => $item['discount_type'] ?? null,
                'discount_amount' => $discountAmount,
                'tax_rate_id' => $item['tax_rate_id'] ?? null,
                'tax_rate' => round((float) ($item['tax_rate'] ?? 0), 2),
                'tax_amount' => $itemTaxAmount,
                'total_amount' => round($taxableAmount + $itemTaxAmount, 2),
                'notes' => $item['notes'] ?? null,
            ]);
        }
    }

    protected function calculateTotals(array $data): array
    {
        $subtotal = 0.0;
        $itemDiscount = 0.0;
        $itemTax = 0.0;

        foreach ($data['items'] as $item) {
            $lineSubtotal = round((float) $item['quantity'] * (float) $item['unit_cost'], 2);
            $discountAmount = round((float) ($item['discount_amount'] ?? 0), 2);
            $taxableAmount = max(0, $lineSubtotal - $discountAmount);

            $subtotal += $lineSubtotal;
            $itemDiscount += $discountAmount;

            if (($data['tax_scope'] ?? 'line') === 'line') {
                $itemTax += round($taxableAmount * (round((float) ($item['tax_rate'] ?? 0), 2) / 100), 2);
            }
        }

        $headerDiscount = round((float) ($data['discount_amount'] ?? 0), 2);
        $shipping = round((float) ($data['shipping_charges'] ?? 0), 2);
        $discount = round($itemDiscount + $headerDiscount, 2);
        $discounted = max(0, round($subtotal - $discount, 2));

        if (($data['tax_scope'] ?? 'line') === 'sale') {
            $saleTaxRate = round((float) ($data['tax_rate'] ?? 0), 2);
            $itemTax = round($discounted * ($saleTaxRate / 100), 2);
        }

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => $discount,
            'tax_amount' => round($itemTax, 2),
            'shipping_charges' => $shipping,
            'total_amount' => round(max(0, $subtotal - $discount + $itemTax + $shipping), 2),
        ];
    }

    protected function resolveBranch(string $businessId, string $branchId): Branch
    {
        $branch = Branch::withoutGlobalScopes()->where('business_id', $businessId)->find($branchId);

        if (! $branch) {
            throw new DomainException('Selected branch is invalid for this business.', 422);
        }

        return $branch;
    }

    protected function resolveWarehouse(string $businessId, string $warehouseId): Warehouse
    {
        $warehouse = Warehouse::withoutGlobalScopes()->where('business_id', $businessId)->find($warehouseId);

        if (! $warehouse) {
            throw new DomainException('Selected warehouse is invalid for this business.', 422);
        }

        return $warehouse;
    }

    protected function resolveSupplier(string $businessId, string $supplierId): Supplier
    {
        $supplier = Supplier::withoutGlobalScopes()->where('business_id', $businessId)->find($supplierId);

        if (! $supplier) {
            throw new DomainException('Selected supplier is invalid for this business.', 422);
        }

        return $supplier;
    }

    protected function resolveProduct(string $businessId, string $productId): Product
    {
        $product = Product::withoutGlobalScopes()->where('business_id', $businessId)->find($productId);

        if (! $product) {
            throw new DomainException('Selected product is invalid for this business.', 422);
        }

        return $product;
    }

    protected function resolveVariation(string $businessId, Product $product, ?string $variationId): ?ProductVariation
    {
        if (blank($variationId)) {
            return null;
        }

        $variation = ProductVariation::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('product_id', $product->id)
            ->find($variationId);

        if (! $variation) {
            throw new DomainException('Selected variation is invalid for this product.', 422);
        }

        return $variation;
    }

    protected function resolveSubUnit(
        string $businessId,
        Product $product,
        ?ProductVariation $variation,
        ?string $subUnitId
    ): ?SubUnit {
        if (! filled($subUnitId)) {
            return null;
        }

        /** @var SubUnit|null $subUnit */
        $subUnit = SubUnit::query()
            ->where('business_id', $businessId)
            ->find($subUnitId);

        if (! $subUnit) {
            throw new DomainException('Selected sub unit is invalid for this purchase line.', 422);
        }

        $expectedSubUnitId = $variation?->sub_unit_id ?: $product->sub_unit_id;

        if (! $expectedSubUnitId || (string) $expectedSubUnitId !== (string) $subUnit->id) {
            throw new DomainException('Selected sub unit is not configured for this product line.', 422);
        }

        return $subUnit;
    }

    protected function validateSubUnitEligibility(Product $product, ?SubUnit $subUnit): void
    {
        // Restriction removed: Tracked products (lot/serial) can now be purchased in sub-units.
        // For serial tracking, we will validate that the converted base quantity is an integer during receive.
    }

    protected function ensureWarehouseBelongsToBranch(Warehouse $warehouse, Branch $branch): void
    {
        if ((string) $warehouse->branch_id !== (string) $branch->id) {
            throw new DomainException('Selected warehouse does not belong to the selected branch.', 422);
        }
    }

    protected function ensureUserCanAccessBranch(?User $user, Branch $branch): void
    {
        if ($user && ! $user->hasBranchAccess($branch->id)) {
            throw new DomainException('You cannot manage purchases outside your assigned branches.', 403);
        }
    }

    protected function generatePurchaseNumber(string $businessId): string
    {
        $prefix = 'PO-'.now()->format('Y').'-';
        $lastReference = Purchase::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('purchase_number', 'like', $prefix.'%')
            ->orderByDesc('purchase_number')
            ->value('purchase_number');

        $nextNumber = $lastReference === null
            ? 1
            : ((int) substr($lastReference, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $nextNumber);
    }

    protected function loadPurchase(Purchase $purchase): Purchase
    {
        return $purchase->load(['branch', 'warehouse.branch', 'supplier', 'creator', 'receiver', 'returns', 'items.purchase', 'items.product.unit', 'items.variation', 'items.subUnit', 'items.taxRate', 'payments.paymentAccount', 'payments.replacedPayment', 'payments.reverser']);
    }

    protected function audit(string $event, Purchase $purchase, ?User $actor, ?array $oldValues): void
    {
        $this->auditService->log(
            $event,
            Purchase::class,
            $purchase->id,
            $actor,
            $purchase->business_id,
            $oldValues,
            $this->auditPayload($purchase)
        );
    }

    protected function auditPayload(Purchase $purchase): array
    {
        return [
            'purchase_number' => $purchase->purchase_number,
            'branch_id' => $purchase->branch_id,
            'warehouse_id' => $purchase->warehouse_id,
            'supplier_id' => $purchase->supplier_id,
            'status' => $purchase->status,
            'payment_status' => $purchase->payment_status,
            'purchase_date' => optional($purchase->purchase_date)->toDateString(),
            'total_amount' => (string) $purchase->total_amount,
        ];
    }

    protected function assertPurchaseHasNoReturnDocuments(Purchase $purchase): void
    {
        if ($purchase->returns->isNotEmpty()) {
            throw new DomainException('Purchases with return documents cannot be edited because return lines reference the original purchase items.', 422);
        }
    }
}
