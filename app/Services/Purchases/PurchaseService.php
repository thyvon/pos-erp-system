<?php

namespace App\Services\Purchases;

use App\Exceptions\Domain\DomainException;
use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Purchases\PurchaseRepository;
use App\Services\AuditService;
use App\Services\Inventory\StockMovementService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        protected PurchaseRepository $purchases,
        protected AuditService $auditService,
        protected StockMovementService $stockMovementService,
    ) {
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
                'purchase_number' => $this->generatePurchaseNumber(),
                'supplier_invoice_no' => $data['supplier_invoice_no'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'payment_status' => 'unpaid',
                'purchase_date' => $data['purchase_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
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
            /** @var Purchase $lockedPurchase */
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with('items')
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['draft', 'confirmed'], true)) {
                throw new DomainException('Only draft or confirmed purchases can be updated.', 422);
            }

            $oldValues = $this->auditPayload($lockedPurchase->loadMissing(['branch', 'warehouse', 'supplier']));
            $branch = $this->resolveBranch($businessId, $data['branch_id']);
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id']);
            $supplier = $this->resolveSupplier($businessId, $data['supplier_id']);
            $this->ensureWarehouseBelongsToBranch($warehouse, $branch);
            $this->ensureUserCanAccessBranch($actor, $branch);
            $totals = $this->calculateTotals($data);

            $lockedPurchase->fill([
                'branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier->id,
                'supplier_invoice_no' => $data['supplier_invoice_no'] ?? null,
                'status' => $data['status'] ?? $lockedPurchase->status,
                'purchase_date' => $data['purchase_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => $totals['subtotal'],
                'discount_amount' => $totals['discount_amount'],
                'tax_amount' => $totals['tax_amount'],
                'shipping_charges' => $totals['shipping_charges'],
                'total_amount' => $totals['total_amount'],
                'notes' => $data['notes'] ?? null,
                'staff_note' => $data['staff_note'] ?? null,
            ]);
            $lockedPurchase->save();
            $lockedPurchase->items()->delete();
            $this->syncItems($businessId, $lockedPurchase, $data['items']);

            $lockedPurchase = $this->loadPurchase($lockedPurchase);
            $this->audit('updated', $lockedPurchase, $actor, $oldValues);

            return $lockedPurchase;
        });
    }

    public function delete(string $businessId, Purchase $purchase, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $purchase, $actor): void {
            /** @var Purchase $lockedPurchase */
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with('items')
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['draft', 'confirmed', 'cancelled'], true)) {
                throw new DomainException('Received purchases cannot be deleted.', 422);
            }

            if ($lockedPurchase->items->contains(fn ($item) => (float) $item->received_quantity > 0)) {
                throw new DomainException('Purchases with received quantities cannot be deleted.', 422);
            }

            $oldValues = $this->auditPayload($lockedPurchase->loadMissing(['branch', 'warehouse', 'supplier']));
            $this->purchases->delete($lockedPurchase);
            $this->auditService->log('deleted', Purchase::class, $lockedPurchase->id, $actor, $businessId, $oldValues, null);
        });
    }

    public function receive(string $businessId, Purchase $purchase, array $data, ?User $actor = null): Purchase
    {
        return DB::transaction(function () use ($businessId, $purchase, $data, $actor): Purchase {
            /** @var Purchase $lockedPurchase */
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with(['items.product', 'items.variation', 'warehouse', 'branch', 'supplier'])
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['confirmed', 'partially_received'], true)) {
                throw new DomainException('Only confirmed purchases can be received.', 422);
            }

            $this->ensureUserCanAccessBranch($actor, $lockedPurchase->branch);
            $itemsById = $lockedPurchase->items->keyBy('id');

            foreach ($data['items'] as $receiveLine) {
                /** @var PurchaseItem|null $item */
                $item = $itemsById->get($receiveLine['purchase_item_id']);

                if (! $item) {
                    throw new DomainException('Selected purchase item does not belong to this purchase.', 422);
                }

                $this->receiveItem($businessId, $lockedPurchase, $item, $receiveLine, $actor);
            }

            $lockedPurchase->refresh()->load('items');
            $lockedPurchase->status = $this->resolveReceivedStatus($lockedPurchase);
            $lockedPurchase->received_by = $actor?->id;
            $lockedPurchase->received_at = $data['received_at'] ?? now();
            $lockedPurchase->save();
            $lockedPurchase = $this->loadPurchase($lockedPurchase);

            $this->auditService->log(
                'received',
                Purchase::class,
                $lockedPurchase->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($lockedPurchase)
            );

            return $lockedPurchase;
        });
    }

    protected function receiveItem(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $item,
        array $receiveLine,
        ?User $actor = null,
    ): void {
        $quantity = round((float) $receiveLine['quantity'], 4);
        $remaining = round((float) $item->quantity - (float) $item->received_quantity, 4);

        if ($quantity > $remaining) {
            throw new DomainException('Received quantity cannot exceed the remaining purchase quantity.', 422);
        }

        $product = $item->product;

        if (! $product) {
            throw new DomainException('Purchase item product is missing.', 422);
        }

        match ($product->stock_tracking) {
            'lot' => $this->receiveLotTrackedItem($businessId, $purchase, $item, $receiveLine, $quantity, $actor),
            'serial' => $this->receiveSerialTrackedItem($businessId, $purchase, $item, $receiveLine, $quantity, $actor),
            default => $this->recordReceiptMovement($businessId, $purchase, $item, $quantity, $actor, $receiveLine['notes'] ?? null),
        };

        $item->received_quantity = number_format((float) $item->received_quantity + $quantity, 4, '.', '');
        $item->save();
    }

    protected function receiveLotTrackedItem(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $item,
        array $receiveLine,
        float $quantity,
        ?User $actor = null,
    ): void {
        if (blank($receiveLine['lot_number'] ?? null)) {
            throw new DomainException('A lot number is required for lot-tracked purchase items.', 422);
        }

        $lot = StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('lot_number', trim((string) $receiveLine['lot_number']))
            ->first();

        if ($lot && (
            (string) $lot->product_id !== (string) $item->product_id
            || (string) $lot->warehouse_id !== (string) $purchase->warehouse_id
            || (string) ($lot->variation_id ?? '') !== (string) ($item->variation_id ?? '')
        )) {
            throw new DomainException('Selected lot number is already used for a different product or warehouse.', 422);
        }

        if (! $lot) {
            $lot = StockLot::withoutGlobalScopes()->create([
                'business_id' => $businessId,
                'product_id' => $item->product_id,
                'variation_id' => $item->variation_id,
                'warehouse_id' => $purchase->warehouse_id,
                'supplier_id' => $purchase->supplier_id,
                'lot_number' => trim((string) $receiveLine['lot_number']),
                'manufacture_date' => $receiveLine['manufacture_date'] ?? null,
                'expiry_date' => $receiveLine['expiry_date'] ?? null,
                'received_at' => $purchase->received_at ?? now(),
                'unit_cost' => $item->unit_cost,
                'qty_received' => number_format($quantity, 4, '.', ''),
                'qty_on_hand' => 0,
                'qty_reserved' => 0,
                'status' => 'active',
                'notes' => $receiveLine['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);
        } else {
            $lot->qty_received = number_format((float) $lot->qty_received + $quantity, 4, '.', '');
            $lot->save();
        }

        $this->recordReceiptMovement($businessId, $purchase, $item, $quantity, $actor, $receiveLine['notes'] ?? null, $lot->id);
    }

    protected function receiveSerialTrackedItem(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $item,
        array $receiveLine,
        float $quantity,
        ?User $actor = null,
    ): void {
        $serialNumbers = array_values($receiveLine['serial_numbers'] ?? []);

        if (count($serialNumbers) !== (int) $quantity || round($quantity, 4) !== (float) ((int) $quantity)) {
            throw new DomainException('Serial-tracked purchase items require one serial number per received unit.', 422);
        }

        foreach ($serialNumbers as $serialNumber) {
            $serialNumber = trim((string) $serialNumber);

            if (StockSerial::withoutGlobalScopes()->where('business_id', $businessId)->where('serial_number', $serialNumber)->exists()) {
                throw new DomainException('Selected serial number already exists.', 422);
            }

            $serial = StockSerial::withoutGlobalScopes()->create([
                'business_id' => $businessId,
                'product_id' => $item->product_id,
                'variation_id' => $item->variation_id,
                'warehouse_id' => null,
                'supplier_id' => $purchase->supplier_id,
                'serial_number' => $serialNumber,
                'status' => 'in_stock',
                'purchase_item_id' => $item->id,
                'unit_cost' => $item->unit_cost,
                'warranty_expires' => $receiveLine['warranty_expires'] ?? null,
                'received_at' => $purchase->received_at ?? now(),
                'notes' => $receiveLine['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            $this->recordReceiptMovement($businessId, $purchase, $item, 1, $actor, $receiveLine['notes'] ?? null, null, $serial->id);
        }
    }

    protected function recordReceiptMovement(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $item,
        float $quantity,
        ?User $actor = null,
        ?string $notes = null,
        ?string $lotId = null,
        ?string $serialId = null,
    ): void {
        $this->stockMovementService->record($businessId, [
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'warehouse_id' => $purchase->warehouse_id,
            'lot_id' => $lotId,
            'serial_id' => $serialId,
            'type' => 'purchase_receipt',
            'quantity' => $quantity,
            'unit_cost' => $item->unit_cost,
            'reference_type' => Purchase::class,
            'reference_id' => $purchase->id,
            'notes' => $notes ?? $purchase->notes,
        ], $actor);
    }

    protected function resolveReceivedStatus(Purchase $purchase): string
    {
        $totalQuantity = 0.0;
        $receivedQuantity = 0.0;

        foreach ($purchase->items as $item) {
            $totalQuantity += (float) $item->quantity;
            $receivedQuantity += (float) $item->received_quantity;
        }

        return $receivedQuantity >= $totalQuantity ? 'received' : 'partially_received';
    }

    protected function syncItems(string $businessId, Purchase $purchase, array $items): void
    {
        foreach ($items as $item) {
            $product = $this->resolveProduct($businessId, $item['product_id']);
            $variation = $this->resolveVariation($businessId, $product, $item['variation_id'] ?? null);
            $quantity = round((float) $item['quantity'], 4);
            $unitCost = round((float) $item['unit_cost'], 4);
            $lineSubtotal = round($quantity * $unitCost, 2);
            $discountAmount = round((float) ($item['discount_amount'] ?? 0), 2);
            $taxRate = round((float) ($item['tax_rate'] ?? 0), 2);
            $taxableAmount = max(0, $lineSubtotal - $discountAmount);
            $taxAmount = round($taxableAmount * ($taxRate / 100), 2);

            $purchase->items()->create([
                'product_id' => $product->id,
                'variation_id' => $variation?->id,
                'quantity' => $quantity,
                'received_quantity' => 0,
                'unit_cost' => $unitCost,
                'discount_amount' => $discountAmount,
                'tax_rate' => $taxRate,
                'tax_amount' => $taxAmount,
                'total_amount' => round($taxableAmount + $taxAmount, 2),
                'notes' => $item['notes'] ?? null,
            ]);
        }
    }

    protected function calculateTotals(array $data): array
    {
        $subtotal = 0.0;
        $itemDiscount = 0.0;
        $taxAmount = 0.0;

        foreach ($data['items'] as $item) {
            $lineSubtotal = round((float) $item['quantity'] * (float) $item['unit_cost'], 2);
            $discountAmount = round((float) ($item['discount_amount'] ?? 0), 2);
            $taxableAmount = max(0, $lineSubtotal - $discountAmount);

            $subtotal += $lineSubtotal;
            $itemDiscount += $discountAmount;
            $taxAmount += round($taxableAmount * (round((float) ($item['tax_rate'] ?? 0), 2) / 100), 2);
        }

        $headerDiscount = round((float) ($data['discount_amount'] ?? 0), 2);
        $shipping = round((float) ($data['shipping_charges'] ?? 0), 2);
        $discount = round($itemDiscount + $headerDiscount, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'discount_amount' => $discount,
            'tax_amount' => round($taxAmount, 2),
            'shipping_charges' => $shipping,
            'total_amount' => round(max(0, $subtotal - $discount + $taxAmount + $shipping), 2),
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

    protected function generatePurchaseNumber(): string
    {
        $prefix = 'PO-'.now()->format('Y').'-';
        $lastReference = Purchase::withoutGlobalScopes()
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
        return $purchase->load(['branch', 'warehouse.branch', 'supplier', 'creator', 'receiver', 'items.product', 'items.variation']);
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
}
