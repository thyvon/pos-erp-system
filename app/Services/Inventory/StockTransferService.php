<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Inventory\StockTransferRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StockTransferService
{
    public function __construct(
        protected StockTransferRepository $transfers,
        protected StockMovementService $stockMovementService,
    ) {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->transfers->paginateFiltered($filters, $user);
    }

    public function create(string $businessId, array $data, ?User $actor = null): StockTransfer
    {
        return DB::transaction(function () use ($businessId, $data, $actor): StockTransfer {
            $fromWarehouse = $this->resolveWarehouse($businessId, $data['from_warehouse_id']);
            $toWarehouse = $this->resolveWarehouse($businessId, $data['to_warehouse_id']);
            $shouldSend = $this->shouldSend($data);

            if ($fromWarehouse->is($toWarehouse)) {
                throw new DomainException('Transfer source and destination warehouses must be different.', 422);
            }

            $this->ensureUserCanCreateTransfer($actor, $fromWarehouse);

            /** @var StockTransfer $transfer */
            $transfer = $this->transfers->create([
                'business_id' => $businessId,
                'from_warehouse_id' => $fromWarehouse->id,
                'to_warehouse_id' => $toWarehouse->id,
                'reference_no' => $this->generateReferenceNumber(),
                'status' => $shouldSend ? 'in_transit' : 'pending',
                'date' => $data['date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
                'sent_by' => $shouldSend ? $actor?->id : null,
                'sent_at' => $shouldSend ? now() : null,
            ]);

            foreach ($data['items'] as $item) {
                $lot = $this->resolveLotInWarehouse($businessId, $fromWarehouse->id, $item['product_id'], $item['variation_id'] ?? null, $item['lot_id'] ?? null);
                $serial = $this->resolveSerialInWarehouse($businessId, $fromWarehouse->id, $item['product_id'], $item['variation_id'] ?? null, $item['serial_id'] ?? null);

                $this->ensureTrackedTransferIsSupported($item, $lot, $serial);

                $transfer->items()->create([
                    'product_id' => $item['product_id'],
                    'variation_id' => $item['variation_id'] ?? null,
                    'lot_id' => $item['lot_id'] ?? null,
                    'serial_id' => $item['serial_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);

                $reservationPayload = [
                    'product_id' => $item['product_id'],
                    'variation_id' => $item['variation_id'] ?? null,
                    'lot_id' => $item['lot_id'] ?? null,
                    'serial_id' => $item['serial_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'warehouse_id' => $fromWarehouse->id,
                ];

                $this->stockMovementService->reserve($businessId, $reservationPayload);
            }

            return $transfer->load(['fromWarehouse.branch', 'toWarehouse.branch', 'creator', 'sender', 'receiver', 'items.product', 'items.variation', 'items.lot', 'items.serial']);
        });
    }

    public function receive(string $businessId, StockTransfer $transfer, ?User $actor = null): StockTransfer
    {
        return DB::transaction(function () use ($businessId, $transfer, $actor): StockTransfer {
            /** @var StockTransfer $lockedTransfer */
            $lockedTransfer = StockTransfer::query()
                ->with(['items', 'toWarehouse', 'fromWarehouse'])
                ->whereKey($transfer->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedTransfer->business_id !== $businessId) {
                throw new DomainException('Selected transfer is invalid for this business.', 422);
            }

            if ($lockedTransfer->status !== 'in_transit') {
                throw new DomainException('Only in-transit transfers can be received.', 422);
            }

            $toWarehouse = $lockedTransfer->toWarehouse;

            if (! $toWarehouse) {
                throw new DomainException('Transfer destination warehouse is missing.', 422);
            }

            $this->ensureUserCanReceiveTransfer($actor, $toWarehouse);

            foreach ($lockedTransfer->items as $item) {
                $this->stockMovementService->consumeReserved($businessId, [
                    'product_id' => $item->product_id,
                    'variation_id' => $item->variation_id,
                    'lot_id' => $item->lot_id,
                    'serial_id' => $item->serial_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->unit_cost ?? 0,
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $lockedTransfer->id,
                    'notes' => $item->notes ?? $lockedTransfer->notes,
                    'warehouse_id' => $lockedTransfer->from_warehouse_id,
                    'type' => 'transfer_out',
                ], $actor);

                $inboundPayload = [
                    'product_id' => $item->product_id,
                    'variation_id' => $item->variation_id,
                    'lot_id' => $item->lot_id,
                    'serial_id' => $item->serial_id,
                    'quantity' => $item->quantity,
                    'unit_cost' => $item->unit_cost ?? 0,
                    'reference_type' => StockTransfer::class,
                    'reference_id' => $lockedTransfer->id,
                    'notes' => $item->notes ?? $lockedTransfer->notes,
                    'warehouse_id' => $toWarehouse->id,
                    'type' => 'transfer_in',
                ];

                if ($item->lot_id && $item->serial_id) {
                    $inboundPayload['lot_id'] = null;
                }

                $this->stockMovementService->record($businessId, $inboundPayload, $actor);
            }

            $lockedTransfer->status = 'received';
            $lockedTransfer->received_by = $actor?->id;
            $lockedTransfer->received_at = now();
            $lockedTransfer->save();

            return $lockedTransfer->load(['fromWarehouse.branch', 'toWarehouse.branch', 'creator', 'sender', 'receiver', 'items.product', 'items.variation', 'items.lot', 'items.serial']);
        });
    }

    public function update(string $businessId, StockTransfer $transfer, array $data, ?User $actor = null): StockTransfer
    {
        return DB::transaction(function () use ($businessId, $transfer, $data, $actor): StockTransfer {
            /** @var StockTransfer $lockedTransfer */
            $lockedTransfer = StockTransfer::query()
                ->with(['items', 'fromWarehouse', 'toWarehouse'])
                ->whereKey($transfer->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedTransfer->business_id !== $businessId) {
                throw new DomainException('Selected transfer is invalid for this business.', 422);
            }

            if (! in_array($lockedTransfer->status, ['pending', 'in_transit'], true)) {
                throw new DomainException('Only pending or in-transit transfers can be edited.', 422);
            }

            $fromWarehouse = $this->resolveWarehouse($businessId, $data['from_warehouse_id']);
            $toWarehouse = $this->resolveWarehouse($businessId, $data['to_warehouse_id']);
            $shouldSend = $this->shouldSend($data) || $lockedTransfer->status === 'in_transit';

            if ($fromWarehouse->is($toWarehouse)) {
                throw new DomainException('Transfer source and destination warehouses must be different.', 422);
            }

            $this->ensureUserCanCreateTransfer($actor, $fromWarehouse);

            foreach ($lockedTransfer->items as $existingItem) {
                $this->releasePendingTransferItem($businessId, $lockedTransfer, $existingItem);
            }

            $lockedTransfer->items()->delete();

            $lockedTransfer->fill([
                'from_warehouse_id' => $fromWarehouse->id,
                'to_warehouse_id' => $toWarehouse->id,
                'date' => $data['date'],
                'notes' => $data['notes'] ?? null,
                'status' => $shouldSend ? 'in_transit' : 'pending',
                'sent_by' => $shouldSend ? ($lockedTransfer->sent_by ?: $actor?->id) : null,
                'sent_at' => $shouldSend ? ($lockedTransfer->sent_at ?: now()) : null,
                'received_by' => null,
                'received_at' => null,
            ]);
            $lockedTransfer->save();

            foreach ($data['items'] as $item) {
                $lot = $this->resolveLotInWarehouse($businessId, $fromWarehouse->id, $item['product_id'], $item['variation_id'] ?? null, $item['lot_id'] ?? null);
                $serial = $this->resolveSerialInWarehouse($businessId, $fromWarehouse->id, $item['product_id'], $item['variation_id'] ?? null, $item['serial_id'] ?? null);

                $this->ensureTrackedTransferIsSupported($item, $lot, $serial);

                $lockedTransfer->items()->create([
                    'product_id' => $item['product_id'],
                    'variation_id' => $item['variation_id'] ?? null,
                    'lot_id' => $item['lot_id'] ?? null,
                    'serial_id' => $item['serial_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);

                $movementPayload = [
                    'product_id' => $item['product_id'],
                    'variation_id' => $item['variation_id'] ?? null,
                    'lot_id' => $item['lot_id'] ?? null,
                    'serial_id' => $item['serial_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'warehouse_id' => $fromWarehouse->id,
                ];

                $this->stockMovementService->reserve($businessId, $movementPayload);
            }

            return $lockedTransfer->load(['fromWarehouse.branch', 'toWarehouse.branch', 'creator', 'sender', 'receiver', 'items.product', 'items.variation', 'items.lot', 'items.serial']);
        });
    }

    public function delete(string $businessId, StockTransfer $transfer, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $transfer): void {
            /** @var StockTransfer $lockedTransfer */
            $lockedTransfer = StockTransfer::query()
                ->with(['items'])
                ->whereKey($transfer->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedTransfer->business_id !== $businessId) {
                throw new DomainException('Selected transfer is invalid for this business.', 422);
            }

            if ($lockedTransfer->status !== 'pending') {
                throw new DomainException('Only pending transfers can be deleted.', 422);
            }

            foreach ($lockedTransfer->items as $existingItem) {
                $this->releasePendingTransferItem($businessId, $lockedTransfer, $existingItem);
            }

            $lockedTransfer->items()->delete();
            $lockedTransfer->delete();
        });
    }

    protected function resolveWarehouse(string $businessId, string $warehouseId): Warehouse
    {
        /** @var Warehouse|null $warehouse */
        $warehouse = Warehouse::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($warehouseId);

        if (! $warehouse) {
            throw new DomainException('Selected warehouse is invalid for this business.', 422);
        }

        return $warehouse;
    }

    protected function ensureUserCanCreateTransfer(?User $user, Warehouse $fromWarehouse): void
    {
        if ($user && $user->hasRole('super_admin')) {
            throw new DomainException('Super admin does not operate on business stock transfers.', 403);
        }

        if ($user && ! $user->hasBranchAccess($fromWarehouse->branch_id)) {
            throw new DomainException('You cannot transfer stock from a warehouse outside your assigned branches.', 403);
        }
    }

    protected function ensureUserCanReceiveTransfer(?User $user, Warehouse $toWarehouse): void
    {
        if ($user && $user->hasRole('super_admin')) {
            throw new DomainException('Super admin does not operate on business stock transfers.', 403);
        }

        if ($user && ! $user->hasBranchAccess($toWarehouse->branch_id)) {
            throw new DomainException('You cannot receive stock into a warehouse outside your assigned branches.', 403);
        }
    }

    protected function resolveLotInWarehouse(
        string $businessId,
        string $warehouseId,
        string $productId,
        ?string $variationId,
        ?string $lotId,
    ): ?StockLot {
        if (! filled($lotId)) {
            return null;
        }

        $query = StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId);

        if ($variationId === null) {
            $query->whereNull('variation_id');
        } else {
            $query->where('variation_id', $variationId);
        }

        /** @var StockLot|null $lot */
        $lot = $query->find($lotId);

        if (! $lot) {
            throw new DomainException('Selected lot is invalid for the source warehouse.', 422);
        }

        return $lot;
    }

    protected function resolveSerialInWarehouse(
        string $businessId,
        string $warehouseId,
        string $productId,
        ?string $variationId,
        ?string $serialId,
    ): ?StockSerial {
        if (! filled($serialId)) {
            return null;
        }

        $query = StockSerial::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId);

        if ($variationId === null) {
            $query->whereNull('variation_id');
        } else {
            $query->where('variation_id', $variationId);
        }

        /** @var StockSerial|null $serial */
        $serial = $query->find($serialId);

        if (! $serial) {
            throw new DomainException('Selected serial is invalid for the source warehouse.', 422);
        }

        return $serial;
    }

    protected function ensureTrackedTransferIsSupported(array $item, ?StockLot $lot, ?StockSerial $serial): void
    {
        $quantity = round((float) $item['quantity'], 4);

        if ($serial && $quantity !== 1.0) {
            throw new DomainException('Serial-tracked transfers must use a quantity of 1.', 422);
        }

        if (! $lot || $serial) {
            return;
        }

        if ((float) $lot->qty_reserved > 0) {
            throw new DomainException('Lots with reserved quantity cannot be transferred to another warehouse.', 422);
        }

        if (round((float) $lot->qty_on_hand - $quantity, 4) !== 0.0) {
            throw new DomainException('Partial lot transfers are not supported by the current lot model.', 422);
        }
    }

    protected function releasePendingTransferItem(
        string $businessId,
        StockTransfer $transfer,
        StockTransferItem $item,
    ): void {
        $reservationPayload = [
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'lot_id' => $item->lot_id,
            'serial_id' => $item->serial_id,
            'quantity' => $item->quantity,
            'warehouse_id' => $transfer->from_warehouse_id,
        ];

        $this->stockMovementService->release($businessId, $reservationPayload);
    }

    protected function shouldSend(array $data): bool
    {
        return filter_var($data['send'] ?? false, FILTER_VALIDATE_BOOLEAN);
    }

    protected function generateReferenceNumber(): string
    {
        $prefix = 'TRF-'.now()->format('Y').'-';
        $lastReference = StockTransfer::withoutGlobalScopes()
            ->where('reference_no', 'like', $prefix.'%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $nextNumber = $lastReference === null
            ? 1
            : ((int) substr($lastReference, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $nextNumber);
    }
}
