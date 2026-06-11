<?php

namespace App\Services\Purchases;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReceive;
use App\Models\PurchaseReceiveItem;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\SubUnit;
use App\Models\User;
use App\Services\AuditService;
use App\Services\Inventory\StockMovementService;
use Illuminate\Support\Facades\DB;

class PurchaseReceiveService
{
    public function __construct(
        protected StockMovementService $stockMovementService,
        protected \App\Services\Accounting\AccountingService $accountingService,
        protected AuditService $auditService,
    ) {
    }

    public function receive(string $businessId, Purchase $purchase, array $data, ?User $actor = null): Purchase
    {
        return DB::transaction(function () use ($businessId, $purchase, $data, $actor): Purchase {
            $lockedPurchase = Purchase::withoutGlobalScopes()
                ->with(['items.product', 'items.variation', 'items.subUnit'])
                ->where('business_id', $businessId)
                ->whereKey($purchase->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! in_array($lockedPurchase->status, ['confirmed', 'partially_received'], true)) {
                throw new DomainException('Purchase must be confirmed or partially received to receive stock.', 422);
            }

            $purchaseReceive = PurchaseReceive::withoutGlobalScopes()->create([
                'business_id' => $businessId,
                'purchase_id' => $lockedPurchase->id,
                'branch_id' => $lockedPurchase->branch_id,
                'warehouse_id' => $lockedPurchase->warehouse_id,
                'receive_number' => $this->generateReceiveNumber($businessId),
                'received_at' => $data['received_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            foreach ($data['items'] as $receiveLine) {
                $item = $lockedPurchase->items->firstWhere('id', $receiveLine['purchase_item_id']);

                if (! $item) {
                    throw new DomainException('Purchase item not found.', 422);
                }

                $this->receiveItem($businessId, $lockedPurchase, $item, $receiveLine, $purchaseReceive, $actor);
            }

            $lockedPurchase->refresh()->load('items');
            $lockedPurchase->received_at ??= now();
            $lockedPurchase->received_by ??= $actor?->id;
            $lockedPurchase->status = $this->resolveReceivedStatus($lockedPurchase);
            $lockedPurchase->save();

            $this->postReceiveJournal($businessId, $purchaseReceive, $actor);

            return $this->loadPurchase($lockedPurchase->fresh());
        });
    }

    public function updateReceive(string $businessId, PurchaseReceive $purchaseReceive, array $data, ?User $actor = null): PurchaseReceive
    {
        return DB::transaction(function () use ($businessId, $purchaseReceive, $data, $actor): PurchaseReceive {
            $lockedReceive = PurchaseReceive::withoutGlobalScopes()
                ->with(['purchase.items.product', 'purchase.items.variation', 'purchase.items.subUnit', 'items'])
                ->where('business_id', $businessId)
                ->whereKey($purchaseReceive->id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldJournal = \App\Models\Journal::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('reference_type', PurchaseReceive::class)
                ->where('reference_id', $lockedReceive->id)
                ->whereNull('reversed_by_id')
                ->first();

            if ($oldJournal) {
                $this->accountingService->reverseJournal($businessId, $oldJournal, 'Correction for purchase receive edit', $actor);
            }

            $lockedReceive->update([
                'received_at' => $data['received_at'] ?? $lockedReceive->received_at,
                'notes' => $data['notes'] ?? $lockedReceive->notes,
            ]);

            $oldItems = $lockedReceive->items->keyBy('id');

            foreach ($data['items'] as $receiveLine) {
                $oldReceiveItem = $oldItems->get($receiveLine['id'] ?? '');

                if (! $oldReceiveItem) {
                    throw new DomainException('Receive item not found in this receive record.', 422);
                }

                $purchaseItem = $lockedReceive->purchase->items->firstWhere('id', $oldReceiveItem->purchase_item_id);

                if (! $purchaseItem) {
                    throw new DomainException('Purchase item not found.', 422);
                }

                $newQty = round((float) $receiveLine['quantity'], 4);
                $oldQty = round((float) $oldReceiveItem->quantity, 4);
                $delta = $newQty - $oldQty;
                $maxAllowedQuantity = round(
                    (float) $purchaseItem->quantity - ((float) $purchaseItem->received_quantity - $oldQty),
                    4
                );

                if ($newQty > $maxAllowedQuantity) {
                    throw new DomainException('Received quantity cannot exceed the remaining purchase quantity.', 422);
                }

                if ($delta === 0.0) {
                    continue;
                }

                $stockTracking = $purchaseItem->product?->stock_tracking ?? 'none';

                if ($stockTracking === 'serial' && $delta > 0) {
                    throw new DomainException('Cannot increase quantity of a serial-tracked receive item without providing new serial numbers.', 422);
                }

                $inventoryDelta = $this->inventoryQuantityFromPurchaseItem($purchaseItem, abs($delta));

                if ($stockTracking === 'serial' && round($inventoryDelta, 4) !== (float) ((int) $inventoryDelta)) {
                    throw new DomainException('Serial-tracked purchase receive corrections must resolve to whole base units.', 422);
                }

                if ($delta > 0) {
                    if ($stockTracking === 'lot') {
                        $this->adjustLotQuantity($businessId, $lockedReceive->purchase, $purchaseItem, $delta, $oldReceiveItem, $lockedReceive, $actor, $receiveLine['notes'] ?? null);
                    } else {
                        $this->recordReceiptMovement($businessId, $lockedReceive->purchase, $purchaseItem, $inventoryDelta, $actor, $receiveLine['notes'] ?? null);
                    }
                } else {
                    if ($stockTracking === 'lot') {
                        $this->adjustLotQuantity($businessId, $lockedReceive->purchase, $purchaseItem, $delta, $oldReceiveItem, $lockedReceive, $actor, 'Correction for purchase receive edit');
                    } elseif ($stockTracking === 'serial') {
                        $this->removeSerialQuantities($businessId, $purchaseItem, $oldReceiveItem, $lockedReceive, (int) $inventoryDelta, $actor);
                    } else {
                        $this->stockMovementService->record($businessId, [
                            'product_id' => $purchaseItem->product_id,
                            'variation_id' => $purchaseItem->variation_id,
                            'warehouse_id' => $lockedReceive->purchase->warehouse_id,
                            'type' => 'adjustment_out',
                            'quantity' => $inventoryDelta,
                            'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
                            'reference_type' => PurchaseReceive::class,
                            'reference_id' => $lockedReceive->id,
                            'notes' => 'Correction for purchase receive edit',
                        ], $actor);
                    }
                }

                $purchaseItem->received_quantity = number_format((float) $purchaseItem->received_quantity + $delta, 4, '.', '');
                $purchaseItem->save();

                $serialNumbers = $oldReceiveItem->serial_numbers ?? [];

                if ($stockTracking === 'serial' && $delta < 0) {
                    $removeCount = (int) $this->inventoryQuantityFromPurchaseItem($purchaseItem, abs($delta));
                    $serialNumbers = array_slice($serialNumbers, 0, -$removeCount);
                }

                $oldReceiveItem->update([
                    'quantity' => $newQty,
                    'notes' => $receiveLine['notes'] ?? $oldReceiveItem->notes,
                    'serial_numbers' => $stockTracking === 'serial' ? $serialNumbers : ($oldReceiveItem->serial_numbers ?? null),
                ]);
            }

            $lockedReceive->purchase->refresh()->load('items');
            $lockedReceive->purchase->status = $this->resolveReceivedStatus($lockedReceive->purchase);
            $lockedReceive->purchase->save();

            $this->postReceiveJournal($businessId, $lockedReceive->fresh(), $actor);

            return $lockedReceive->fresh()->load('items', 'purchase');
        });
    }

    protected function adjustLotQuantity(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $purchaseItem,
        float $delta,
        PurchaseReceiveItem $receiveItem,
        PurchaseReceive $lockedReceive,
        ?User $actor = null,
        ?string $notes = null,
    ): void {
        $lot = StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('product_id', $purchaseItem->product_id)
            ->where('warehouse_id', $purchase->warehouse_id)
            ->where('lot_number', $receiveItem->lot_number)
            ->first();

        $inventoryDelta = $this->inventoryQuantityFromPurchaseItem($purchaseItem, abs($delta));

        if ($delta > 0) {
            if ($lot) {
                $lot->qty_received = number_format((float) $lot->qty_received + $inventoryDelta, 4, '.', '');
                $lot->save();
            }

            $this->recordReceiptMovement(
                $businessId, $purchase, $purchaseItem, $inventoryDelta, $actor, $notes, $lot?->id
            );
        } else {
            if ($lot) {
                $lot->qty_received = number_format(
                    max(0, (float) $lot->qty_received - $inventoryDelta), 4, '.', ''
                );
                $lot->save();
            }

            $this->stockMovementService->record($businessId, [
                'product_id' => $purchaseItem->product_id,
                'variation_id' => $purchaseItem->variation_id,
                'warehouse_id' => $purchase->warehouse_id,
                'lot_id' => $lot?->id,
                'type' => 'adjustment_out',
                'quantity' => $inventoryDelta,
                'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
                'reference_type' => PurchaseReceive::class,
                'reference_id' => $lockedReceive->id,
                'notes' => $notes ?? 'Correction for purchase receive edit',
            ], $actor);
        }
    }

    protected function removeSerialQuantities(
        string $businessId,
        PurchaseItem $purchaseItem,
        PurchaseReceiveItem $receiveItem,
        PurchaseReceive $lockedReceive,
        int $removeCount,
        ?User $actor = null,
    ): void {
        $serialNumbers = $receiveItem->serial_numbers ?? [];
        $toRemove = array_slice($serialNumbers, -$removeCount);

        foreach ($toRemove as $serialNumber) {
            $serial = StockSerial::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('product_id', $purchaseItem->product_id)
                ->where('serial_number', trim((string) $serialNumber))
                ->first();

            if (! $serial) {
                continue;
            }

            $this->stockMovementService->record($businessId, [
                'product_id' => $purchaseItem->product_id,
                'variation_id' => $purchaseItem->variation_id,
                'warehouse_id' => $lockedReceive->purchase->warehouse_id,
                'serial_id' => $serial->id,
                'type' => 'adjustment_out',
                'quantity' => 1,
                'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
                'reference_type' => PurchaseReceive::class,
                'reference_id' => $lockedReceive->id,
                'notes' => 'Correction for purchase receive edit',
            ], $actor);

            $serial->delete();
        }
    }

    public function deleteReceive(string $businessId, PurchaseReceive $purchaseReceive, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $purchaseReceive, $actor): void {
            $lockedReceive = PurchaseReceive::withoutGlobalScopes()
                ->with(['purchase.items.product', 'purchase.items.variation', 'purchase.items.subUnit', 'items'])
                ->where('business_id', $businessId)
                ->whereKey($purchaseReceive->id)
                ->lockForUpdate()
                ->firstOrFail();

            foreach ($lockedReceive->items as $receiveItem) {
                $quantity = round((float) $receiveItem->quantity, 4);

                if ($quantity === 0.0) {
                    continue;
                }

                $purchaseItem = $lockedReceive->purchase->items->firstWhere('id', $receiveItem->purchase_item_id);

                if (! $purchaseItem) {
                    throw new DomainException('Purchase item not found.', 422);
                }

                $stockTracking = $purchaseItem->product?->stock_tracking ?? 'none';

                if ($stockTracking === 'lot') {
                    $this->reverseLotTrackedReceive($businessId, $lockedReceive->purchase, $purchaseItem, $quantity, $receiveItem, $lockedReceive, $actor);
                } elseif ($stockTracking === 'serial') {
                    $this->reverseSerialTrackedReceive($businessId, $purchaseItem, $receiveItem, $lockedReceive, $actor);
                } else {
                    $inventoryQuantity = $this->inventoryQuantityFromPurchaseItem($purchaseItem, $quantity);

                    $this->stockMovementService->record($businessId, [
                        'product_id' => $purchaseItem->product_id,
                        'variation_id' => $purchaseItem->variation_id,
                        'warehouse_id' => $lockedReceive->purchase->warehouse_id,
                        'type' => 'adjustment_out',
                        'quantity' => $inventoryQuantity,
                        'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
                        'reference_type' => PurchaseReceive::class,
                        'reference_id' => $lockedReceive->id,
                        'notes' => 'Purchase receive record deleted',
                    ], $actor);
                }

                $purchaseItem->received_quantity = number_format(
                    max(0, (float) $purchaseItem->received_quantity - $quantity), 4, '.', ''
                );
                $purchaseItem->save();
            }

            $lockedReceive->delete();

            $lockedReceive->purchase->refresh()->load('items');
            $lockedReceive->purchase->status = $this->resolveReceivedStatus($lockedReceive->purchase);
            $lockedReceive->purchase->save();

            $oldJournal = \App\Models\Journal::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('reference_type', PurchaseReceive::class)
                ->where('reference_id', $lockedReceive->id)
                ->whereNull('reversed_by_id')
                ->first();

            if ($oldJournal) {
                $this->accountingService->reverseJournal($businessId, $oldJournal, 'Purchase receive record deleted', $actor);
            }
        });
    }

    public function removeReceiveItem(string $businessId, PurchaseReceive $purchaseReceive, string $receiveItemId, ?User $actor = null): PurchaseReceive
    {
        return DB::transaction(function () use ($businessId, $purchaseReceive, $receiveItemId, $actor): PurchaseReceive {
            $lockedReceive = PurchaseReceive::withoutGlobalScopes()
                ->with(['purchase.items.product', 'purchase.items.variation', 'purchase.items.subUnit', 'items'])
                ->where('business_id', $businessId)
                ->whereKey($purchaseReceive->id)
                ->lockForUpdate()
                ->firstOrFail();

            $receiveItem = $lockedReceive->items->firstWhere('id', $receiveItemId);

            if (! $receiveItem) {
                throw new DomainException('Receive item not found in this receive record.', 422);
            }

            $quantity = round((float) $receiveItem->quantity, 4);

            if ($quantity > 0) {
                $purchaseItem = $lockedReceive->purchase->items->firstWhere('id', $receiveItem->purchase_item_id);

                if (! $purchaseItem) {
                    throw new DomainException('Purchase item not found.', 422);
                }

                $stockTracking = $purchaseItem->product?->stock_tracking ?? 'none';

                if ($stockTracking === 'lot') {
                    $this->reverseLotTrackedReceive($businessId, $lockedReceive->purchase, $purchaseItem, $quantity, $receiveItem, $lockedReceive, $actor);
                } elseif ($stockTracking === 'serial') {
                    $this->reverseSerialTrackedReceive($businessId, $purchaseItem, $receiveItem, $lockedReceive, $actor);
                } else {
                    $inventoryQuantity = $this->inventoryQuantityFromPurchaseItem($purchaseItem, $quantity);

                    $this->stockMovementService->record($businessId, [
                        'product_id' => $purchaseItem->product_id,
                        'variation_id' => $purchaseItem->variation_id,
                        'warehouse_id' => $lockedReceive->purchase->warehouse_id,
                        'type' => 'adjustment_out',
                        'quantity' => $inventoryQuantity,
                        'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
                        'reference_type' => PurchaseReceive::class,
                        'reference_id' => $lockedReceive->id,
                        'notes' => 'Purchase receive item deleted',
                    ], $actor);
                }

                $purchaseItem->received_quantity = number_format(
                    max(0, (float) $purchaseItem->received_quantity - $quantity), 4, '.', ''
                );
                $purchaseItem->save();
            }

            $receiveItem->delete();

            $lockedReceive->purchase->refresh()->load('items');
            $lockedReceive->purchase->status = $this->resolveReceivedStatus($lockedReceive->purchase);
            $lockedReceive->purchase->save();

            $oldJournal = \App\Models\Journal::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('reference_type', PurchaseReceive::class)
                ->where('reference_id', $lockedReceive->id)
                ->whereNull('reversed_by_id')
                ->first();

            if ($oldJournal) {
                $this->accountingService->reverseJournal($businessId, $oldJournal, 'Purchase receive item deleted', $actor);
            }

            if ($lockedReceive->items()->count() > 0) {
                $this->postReceiveJournal($businessId, $lockedReceive->fresh(), $actor);
            }

            return $lockedReceive->fresh()->load('items', 'purchase');
        });
    }

    protected function postReceiveJournal(string $businessId, PurchaseReceive $receive, ?User $actor = null): \App\Models\Journal
    {
        $receive->load(['items.purchaseItem', 'purchase']);
        $totalReceivedValue = 0.0;

        foreach ($receive->items as $item) {
            $purchaseItem = $item->purchaseItem;
            if (! $purchaseItem) {
                continue;
            }
            $qty = (float) $item->quantity;
            $itemTotalQty = (float) $purchaseItem->quantity;

            if ($itemTotalQty > 0) {
                $lineValue = ($qty / $itemTotalQty) * (float) $purchaseItem->total_amount;
                $totalReceivedValue += round($lineValue, 2);
            }
        }

        if ($totalReceivedValue <= 0) {
            throw new DomainException('Total received value must be greater than zero to post a journal.', 422);
        }

        $inventoryAccount = $this->resolveAccountByCode($businessId, '1300');
        $payableAccount = $this->resolveAccountByCode($businessId, '2100');

        return $this->accountingService->postJournal($businessId, [
            'type' => 'purchase',
            'reference_type' => PurchaseReceive::class,
            'reference_id' => $receive->id,
            'description' => "Inventory receipt for purchase {$receive->purchase->purchase_number} (Receive #{$receive->receive_number})",
            'posted_at' => $receive->received_at,
            'entries' => [
                [
                    'account_id' => $inventoryAccount->id,
                    'type' => 'debit',
                    'amount' => $totalReceivedValue,
                    'description' => 'Inventory asset increase',
                ],
                [
                    'account_id' => $payableAccount->id,
                    'type' => 'credit',
                    'amount' => $totalReceivedValue,
                    'description' => 'Accounts payable recognition',
                ],
            ],
        ], $actor);
    }

    protected function resolveAccountByCode(string $businessId, string $code): \App\Models\ChartOfAccount
    {
        $account = \App\Models\ChartOfAccount::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('code', $code)
            ->first();

        if (! $account) {
            throw new DomainException("Required account {$code} is missing for this business.", 422);
        }

        return $account;
    }

    protected function reverseLotTrackedReceive(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $purchaseItem,
        float $quantity,
        PurchaseReceiveItem $receiveItem,
        PurchaseReceive $lockedReceive,
        ?User $actor = null,
    ): void {
        $lot = StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('product_id', $purchaseItem->product_id)
            ->where('warehouse_id', $purchase->warehouse_id)
            ->where('lot_number', $receiveItem->lot_number)
            ->first();

        $inventoryQuantity = $this->inventoryQuantityFromPurchaseItem($purchaseItem, $quantity);

        if ($lot) {
            $lot->qty_received = number_format(
                max(0, (float) $lot->qty_received - $inventoryQuantity), 4, '.', ''
            );
            $lot->save();
        }

        $this->stockMovementService->record($businessId, [
            'product_id' => $purchaseItem->product_id,
            'variation_id' => $purchaseItem->variation_id,
            'warehouse_id' => $purchase->warehouse_id,
            'lot_id' => $lot?->id,
            'type' => 'adjustment_out',
            'quantity' => $inventoryQuantity,
            'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
            'reference_type' => PurchaseReceive::class,
            'reference_id' => $lockedReceive->id,
            'notes' => 'Purchase receive record deleted',
        ], $actor);
    }

    protected function reverseSerialTrackedReceive(
        string $businessId,
        PurchaseItem $purchaseItem,
        PurchaseReceiveItem $receiveItem,
        PurchaseReceive $lockedReceive,
        ?User $actor = null,
    ): void {
        $serialNumbers = $receiveItem->serial_numbers ?? [];

        foreach ($serialNumbers as $serialNumber) {
            $serial = StockSerial::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('product_id', $purchaseItem->product_id)
                ->where('serial_number', trim((string) $serialNumber))
                ->first();

            if (! $serial) {
                continue;
            }

            $this->stockMovementService->record($businessId, [
                'product_id' => $purchaseItem->product_id,
                'variation_id' => $purchaseItem->variation_id,
                'warehouse_id' => $lockedReceive->purchase->warehouse_id,
                'serial_id' => $serial->id,
                'type' => 'adjustment_out',
                'quantity' => 1,
                'unit_cost' => $this->baseUnitCostFromPurchaseItem($purchaseItem),
                'reference_type' => PurchaseReceive::class,
                'reference_id' => $lockedReceive->id,
                'notes' => 'Purchase receive record deleted',
            ], $actor);

            $serial->delete();
        }
    }

    protected function generateReceiveNumber(string $businessId): string
    {
        $prefix = 'REC-'.now()->format('Y').'-';

        $lastNumber = PurchaseReceive::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('receive_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('receive_number')
            ->value('receive_number');

        $next = $lastNumber === null
            ? 1
            : ((int) substr($lastNumber, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $next);
    }

    protected function receiveItem(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $item,
        array $receiveLine,
        PurchaseReceive $purchaseReceive,
        ?User $actor = null,
    ): void {
        $quantity = round((float) $receiveLine['quantity'], 4);
        $originalQty = round((float) $item->quantity, 4);
        $remainingQty = round($originalQty - (float) $item->received_quantity, 4);

        if ($quantity > $remainingQty) {
            throw new DomainException('Received quantity cannot exceed the remaining purchase quantity.', 422);
        }

        if ($quantity === 0.0) {
            return;
        }

        $product = $item->product;

        if (! $product) {
            throw new DomainException('Purchase item product is missing.', 422);
        }

        $this->validatePurchaseItemSubUnit($item);
        $inventoryQuantity = $this->inventoryQuantityFromPurchaseItem($item, $quantity);

        PurchaseReceiveItem::create([
            'purchase_receive_id' => $purchaseReceive->id,
            'purchase_item_id' => $item->id,
            'quantity' => $quantity,
            'lot_number' => $receiveLine['lot_number'] ?? null,
            'manufacture_date' => $receiveLine['manufacture_date'] ?? null,
            'expiry_date' => $receiveLine['expiry_date'] ?? null,
            'warranty_expires' => $receiveLine['warranty_expires'] ?? null,
            'serial_numbers' => isset($receiveLine['serial_numbers']) ? $receiveLine['serial_numbers'] : null,
            'notes' => $receiveLine['notes'] ?? null,
        ]);

        match ($product->stock_tracking) {
            'lot' => $this->receiveLotTrackedItem($businessId, $purchase, $item, $receiveLine, $quantity, $inventoryQuantity, $actor),
            'serial' => $this->receiveSerialTrackedItem($businessId, $purchase, $item, $receiveLine, $quantity, $inventoryQuantity, $actor),
            default => $this->recordReceiptMovement($businessId, $purchase, $item, $inventoryQuantity, $actor, $receiveLine['notes'] ?? null),
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
        float $inventoryQuantity,
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
                'unit_cost' => $this->baseUnitCostFromPurchaseItem($item),
                'qty_received' => number_format($inventoryQuantity, 4, '.', ''),
                'qty_on_hand' => 0,
                'qty_reserved' => 0,
                'status' => 'active',
                'notes' => $receiveLine['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);
        } else {
            $lot->qty_received = number_format((float) $lot->qty_received + $inventoryQuantity, 4, '.', '');
            $lot->save();
        }

        $this->recordReceiptMovement($businessId, $purchase, $item, $inventoryQuantity, $actor, $receiveLine['notes'] ?? null, $lot->id);
    }

    protected function receiveSerialTrackedItem(
        string $businessId,
        Purchase $purchase,
        PurchaseItem $item,
        array $receiveLine,
        float $quantity,
        float $inventoryQuantity,
        ?User $actor = null,
    ): void {
        $serialNumbers = array_values($receiveLine['serial_numbers'] ?? []);

        if (count($serialNumbers) !== (int) $inventoryQuantity || round($inventoryQuantity, 4) !== (float) ((int) $inventoryQuantity)) {
            throw new DomainException('Serial-tracked purchase items require one serial number per base unit received.', 422);
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
            'unit_cost' => $this->baseUnitCostFromPurchaseItem($item),
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

    protected function validateSubUnitEligibility(Product $product, ?SubUnit $subUnit): void
    {
        // Restriction removed: Tracked products (lot/serial) can now be purchased in sub-units.
        // For serial tracking, we will validate that the converted base quantity is an integer during receive.
    }

    protected function validatePurchaseItemSubUnit(PurchaseItem $item): void
    {
        $subUnit = $item->relationLoaded('subUnit')
            ? $item->subUnit
            : ($item->sub_unit_id ? SubUnit::query()->find($item->sub_unit_id) : null);

        if ($subUnit === null) {
            return;
        }

        $product = $item->product;
        $variation = $item->variation;

        if (! $product) {
            throw new DomainException('Purchase item product is missing.', 422);
        }

        $expectedSubUnitId = $variation?->sub_unit_id ?: $product->sub_unit_id;

        if (! $expectedSubUnitId || (string) $expectedSubUnitId !== (string) $subUnit->id) {
            throw new DomainException('Purchase item sub unit is no longer configured for this product line.', 422);
        }

        $this->validateSubUnitEligibility($product, $subUnit);
    }

    protected function conversionFactorFromSubUnit(?SubUnit $subUnit): float
    {
        $factor = (float) ($subUnit?->conversion_factor ?? 1);

        return $factor > 0 ? $factor : 1.0;
    }

    protected function inventoryQuantityFromPurchaseItem(PurchaseItem $item, float $quantity): float
    {
        $subUnit = $item->relationLoaded('subUnit')
            ? $item->subUnit
            : ($item->sub_unit_id ? SubUnit::query()->find($item->sub_unit_id) : null);

        return round($quantity * $this->conversionFactorFromSubUnit($subUnit), 4);
    }

    protected function baseUnitCostFromPurchaseItem(PurchaseItem $item): float
    {
        $subUnit = $item->relationLoaded('subUnit')
            ? $item->subUnit
            : ($item->sub_unit_id ? SubUnit::query()->find($item->sub_unit_id) : null);

        return round((float) $item->unit_cost / $this->conversionFactorFromSubUnit($subUnit), 4);
    }

    protected function loadPurchase(Purchase $purchase): Purchase
    {
        return $purchase->load(['branch', 'warehouse.branch', 'supplier', 'creator', 'receiver', 'returns', 'items.purchase', 'items.product.unit', 'items.variation', 'items.subUnit', 'items.taxRate', 'payments.paymentAccount', 'payments.replacedPayment', 'payments.reverser', 'receives.items', 'receives.creator']);
    }
}
