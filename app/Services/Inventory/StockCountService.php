<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockCount;
use App\Models\StockCountItem;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Inventory\StockCountRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StockCountService
{
    public function __construct(
        protected StockCountRepository $counts,
        protected StockMovementService $stockMovementService,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->counts->paginateFiltered($filters, $user);
    }

    public function paginateItems(StockCount $count, array $filters, ?User $user = null): LengthAwarePaginator
    {
        if ($user) {
            $this->ensureBelongsToBusiness($user->business_id, $count);
        }

        $count->loadMissing('warehouse');
        $this->ensureUserCanAccessWarehouse($user, $count->warehouse);

        $perPage = (int) ($filters['per_page'] ?? 25);
        $perPage = max(1, min($perPage, 100));
        $search = trim((string) ($filters['search'] ?? ''));

        $query = $count->items()
            ->with(['product', 'variation', 'lot'])
            ->orderByRaw('case when counted_quantity is null then 1 else 0 end')
            ->orderBy('product_id')
            ->orderBy('variation_id')
            ->orderBy('lot_id');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->whereHas('product', function ($productQuery) use ($search): void {
                        $productQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    })
                    ->orWhereHas('variation', function ($variationQuery) use ($search): void {
                        $variationQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    })
                    ->orWhereHas('lot', function ($lotQuery) use ($search): void {
                        $lotQuery->where('lot_number', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage);
    }

    public function create(string $businessId, array $data, ?User $actor = null): StockCount
    {
        return DB::transaction(function () use ($businessId, $data, $actor): StockCount {
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id']);
            $this->ensureUserCanAccessWarehouse($actor, $warehouse);

            /** @var StockCount $count */
            $count = $this->counts->create([
                'business_id' => $businessId,
                'warehouse_id' => $warehouse->id,
                'reference_no' => $this->generateReferenceNumber(),
                'status' => 'in_progress',
                'date' => $data['date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            foreach ($data['items'] ?? [] as $item) {
                $this->findOrCreateCountItem(
                    $count,
                    $businessId,
                    $warehouse->id,
                    $item['product_id'],
                    $item['variation_id'] ?? null,
                    $item['lot_id'] ?? null,
                    $item['unit_cost'] ?? 0
                );
            }

            $count = $count->load(['warehouse.branch', 'creator']);

            $this->auditLogger->log(
                'stock_count_started',
                StockCount::class,
                $count->id,
                $actor,
                $businessId,
                null,
                [
                    'warehouse_id' => $count->warehouse_id,
                    'reference_no' => $count->reference_no,
                ]
            );

            return $count;
        });
    }

    public function recordEntry(string $businessId, StockCount $count, array $data, ?User $actor = null): StockCount
    {
        return DB::transaction(function () use ($businessId, $count, $data, $actor): StockCount {
            $this->ensureBelongsToBusiness($businessId, $count);
            /** @var StockCount $lockedCount */
            $lockedCount = StockCount::query()->whereKey($count->id)->lockForUpdate()->firstOrFail();
            $count = $lockedCount->loadMissing('warehouse');
            $this->ensureUserCanAccessWarehouse($actor, $count->warehouse);

            if ($count->status !== 'in_progress') {
                throw new DomainException('Only in-progress stock counts can accept entries.', 422);
            }

            $variationId = $data['variation_id'] ?? null;
            $lotId = $data['lot_id'] ?? null;
            $this->ensureValidCountItemSelection($businessId, $count->warehouse_id, $data['product_id'], $variationId, $lotId);

            $quantity = round((float) $data['quantity'], 4);

            if ($quantity === 0.0) {
                throw new DomainException('Count quantity cannot be zero.', 422);
            }

            $countItem = $this->findOrCreateCountItem(
                $count,
                $businessId,
                $count->warehouse_id,
                $data['product_id'],
                $variationId,
                $lotId,
                $data['unit_cost'] ?? 0
            );

            $newCountedQuantity = round((float) ($countItem->counted_quantity ?? 0) + $quantity, 4);

            if ($newCountedQuantity < 0) {
                throw new DomainException('Counted quantity cannot become negative.', 422);
            }

            $countItem->counted_quantity = $newCountedQuantity;

            if (array_key_exists('unit_cost', $data) && $data['unit_cost'] !== null) {
                $countItem->unit_cost = round((float) $data['unit_cost'], 4);
            }

            $countItem->save();

            $count->entries()->create([
                'business_id' => $businessId,
                'stock_count_item_id' => $countItem->id,
                'product_id' => $countItem->product_id,
                'variation_id' => $countItem->variation_id,
                'quantity' => $quantity,
                'unit_cost' => $countItem->unit_cost,
                'created_by' => $actor?->id,
            ]);

            $count = $count->refresh()->load(['warehouse.branch', 'creator', 'completer']);

            $this->auditLogger->log(
                'stock_count_entry_recorded',
                StockCount::class,
                $count->id,
                $actor,
                $businessId,
                null,
                [
                    'warehouse_id' => $count->warehouse_id,
                    'reference_no' => $count->reference_no,
                    'product_id' => $countItem->product_id,
                    'variation_id' => $countItem->variation_id,
                    'quantity' => $quantity,
                    'counted_quantity' => $countItem->counted_quantity,
                ]
            );

            return $count;
        });
    }

    public function updateItemCountedQuantity(
        string $businessId,
        StockCount $count,
        StockCountItem $countItem,
        array $data,
        ?User $actor = null
    ): StockCount {
        return DB::transaction(function () use ($businessId, $count, $countItem, $data, $actor): StockCount {
            $this->ensureBelongsToBusiness($businessId, $count);
            /** @var StockCount $lockedCount */
            $lockedCount = StockCount::query()->whereKey($count->id)->lockForUpdate()->firstOrFail();
            $count = $lockedCount->loadMissing('warehouse');
            $this->ensureUserCanAccessWarehouse($actor, $count->warehouse);
            $this->ensureCountItemBelongsToCount($count, $countItem);

            if ($count->status !== 'in_progress') {
                throw new DomainException('Only in-progress stock counts can be edited.', 422);
            }

            $targetQuantity = round((float) $data['counted_quantity'], 4);
            $currentQuantity = round((float) ($countItem->counted_quantity ?? 0), 4);
            $delta = round($targetQuantity - $currentQuantity, 4);

            if ($delta === 0.0) {
                return $count->refresh()->load(['warehouse.branch', 'creator', 'completer']);
            }

            $countItem->counted_quantity = $targetQuantity;
            $countItem->save();

            $count->entries()->create([
                'business_id' => $businessId,
                'stock_count_item_id' => $countItem->id,
                'product_id' => $countItem->product_id,
                'variation_id' => $countItem->variation_id,
                'quantity' => $delta,
                'unit_cost' => $countItem->unit_cost,
                'created_by' => $actor?->id,
            ]);

            $count = $count->refresh()->load(['warehouse.branch', 'creator', 'completer']);

            $this->auditLogger->log(
                'stock_count_item_updated',
                StockCount::class,
                $count->id,
                $actor,
                $businessId,
                null,
                [
                    'warehouse_id' => $count->warehouse_id,
                    'reference_no' => $count->reference_no,
                    'product_id' => $countItem->product_id,
                    'variation_id' => $countItem->variation_id,
                    'old_counted_quantity' => $currentQuantity,
                    'new_counted_quantity' => $targetQuantity,
                    'delta' => $delta,
                ]
            );

            return $count;
        });
    }

    public function removeItem(
        string $businessId,
        StockCount $count,
        StockCountItem $countItem,
        ?User $actor = null
    ): StockCount {
        return DB::transaction(function () use ($businessId, $count, $countItem, $actor): StockCount {
            $this->ensureBelongsToBusiness($businessId, $count);
            /** @var StockCount $lockedCount */
            $lockedCount = StockCount::query()->whereKey($count->id)->lockForUpdate()->firstOrFail();
            $count = $lockedCount->loadMissing('warehouse');
            $this->ensureUserCanAccessWarehouse($actor, $count->warehouse);
            $this->ensureCountItemBelongsToCount($count, $countItem);

            if ($count->status !== 'in_progress') {
                throw new DomainException('Only in-progress stock counts can remove counted lines.', 422);
            }

            $auditPayload = [
                'warehouse_id' => $count->warehouse_id,
                'reference_no' => $count->reference_no,
                'product_id' => $countItem->product_id,
                'variation_id' => $countItem->variation_id,
                'lot_id' => $countItem->lot_id,
                'counted_quantity' => round((float) ($countItem->counted_quantity ?? 0), 4),
                'system_quantity' => round((float) ($countItem->system_quantity ?? 0), 4),
            ];

            $countItem->entries()->delete();
            $countItem->delete();

            $count = $count->refresh()->load(['warehouse.branch', 'creator', 'completer']);

            $this->auditLogger->log(
                'stock_count_item_removed',
                StockCount::class,
                $count->id,
                $actor,
                $businessId,
                null,
                $auditPayload
            );

            return $count;
        });
    }

    public function delete(string $businessId, StockCount $count, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $count, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $count);

            /** @var StockCount $lockedCount */
            $lockedCount = StockCount::query()
                ->whereKey($count->id)
                ->lockForUpdate()
                ->firstOrFail();

            $count = $lockedCount->loadMissing('warehouse');
            $this->ensureUserCanAccessWarehouse($actor, $count->warehouse);

            if ($count->status !== 'in_progress') {
                throw new DomainException('Only in-progress stock counts can be deleted.', 422);
            }

            $itemCount = $count->items()->count();
            $entryCount = $count->entries()->count();

            $auditPayload = [
                'warehouse_id' => $count->warehouse_id,
                'reference_no' => $count->reference_no,
                'item_count' => $itemCount,
                'entry_count' => $entryCount,
            ];

            $count->entries()->delete();
            $count->items()->delete();
            $count->delete();

            $this->auditLogger->log(
                'stock_count_deleted',
                StockCount::class,
                $lockedCount->id,
                $actor,
                $businessId,
                null,
                $auditPayload
            );
        });
    }

    public function complete(string $businessId, StockCount $count, array $data, ?User $actor = null): StockCount
    {
        return DB::transaction(function () use ($businessId, $count, $data, $actor): StockCount {
            $this->ensureBelongsToBusiness($businessId, $count);

            /** @var StockCount $lockedCount */
            $lockedCount = StockCount::query()
                ->whereKey($count->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedCount->status !== 'in_progress') {
                throw new DomainException('Only in-progress stock counts can be completed.', 422);
            }

            $count = $lockedCount->load(['warehouse', 'items']);
            $this->ensureUserCanAccessWarehouse($actor, $count->warehouse);

            $payloadById = collect($data['items'] ?? [])->keyBy('id');
            $discrepancyCount = 0;

            foreach ($count->items as $item) {
                if ($payloadById->has($item->id)) {
                    $countedQuantity = $payloadById[$item->id]['counted_quantity'];
                    $countedQuantity = $countedQuantity === null ? null : round((float) $countedQuantity, 4);

                    $item->counted_quantity = $countedQuantity;
                    $item->save();
                }

                if ($item->counted_quantity === null) {
                    continue;
                }

                $difference = round((float) $item->counted_quantity - (float) $item->system_quantity, 4);

                if ($difference === 0.0) {
                    continue;
                }

                $discrepancyCount++;

                $this->stockMovementService->record($businessId, [
                    'product_id' => $item->product_id,
                    'variation_id' => $item->variation_id,
                    'lot_id' => $item->lot_id,
                    'warehouse_id' => $count->warehouse_id,
                    'type' => 'stock_count_correction',
                    'direction' => $difference > 0 ? 'in' : 'out',
                    'quantity' => abs($difference),
                    'unit_cost' => $item->unit_cost,
                    'reference_type' => StockCount::class,
                    'reference_id' => $count->id,
                    'notes' => 'Stock count correction',
                ], $actor);
            }

            $count->status = 'completed';
            $count->completed_by = $actor?->id;
            $count->save();

            $count = $count->refresh()->load(['warehouse.branch', 'creator', 'completer']);

            $this->auditLogger->log(
                'stock_count_completed',
                StockCount::class,
                $count->id,
                $actor,
                $businessId,
                null,
                [
                    'warehouse_id' => $count->warehouse_id,
                    'reference_no' => $count->reference_no,
                    'discrepancy_count' => $discrepancyCount,
                ]
            );

            return $count;
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

    protected function resolveSystemQuantity(
        string $businessId,
        string $warehouseId,
        string $productId,
        ?string $variationId,
        ?string $lotId,
    ): string {
        if ($lotId !== null) {
            /** @var StockLot|null $lot */
            $lot = StockLot::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('id', $lotId)
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->first();

            if (! $lot) {
                throw new DomainException('Selected lot is invalid for this warehouse stock count.', 422);
            }

            return number_format((float) $lot->qty_on_hand, 4, '.', '');
        }

        $query = StockLevel::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->where('product_id', $productId);

        if ($variationId === null) {
            $query->whereNull('variation_id');
        } else {
            $query->where('variation_id', $variationId);
        }

        $quantity = $query->value('quantity');

        return number_format((float) ($quantity ?? 0), 4, '.', '');
    }

    protected function findOrCreateCountItem(
        StockCount $count,
        string $businessId,
        string $warehouseId,
        string $productId,
        ?string $variationId,
        ?string $lotId,
        float|int|string|null $unitCost = 0,
    ): StockCountItem {
        $query = $count->items()
            ->where('product_id', $productId);

        if ($variationId === null) {
            $query->whereNull('variation_id');
        } else {
            $query->where('variation_id', $variationId);
        }

        if ($lotId === null) {
            $query->whereNull('lot_id');
        } else {
            $query->where('lot_id', $lotId);
        }

        /** @var StockCountItem|null $item */
        $item = $query->lockForUpdate()->first();

        if ($item) {
            if ($unitCost !== null) {
                $item->unit_cost = round((float) $unitCost, 4);
                $item->save();
            }

            return $item;
        }

        return $count->items()->create([
            'product_id' => $productId,
            'variation_id' => $variationId,
            'lot_id' => $lotId,
            'system_quantity' => $this->resolveSystemQuantity($businessId, $warehouseId, $productId, $variationId, $lotId),
            'counted_quantity' => null,
            'unit_cost' => round((float) ($unitCost ?? 0), 4),
        ]);
    }

    protected function ensureValidCountItemSelection(
        string $businessId,
        string $warehouseId,
        string $productId,
        ?string $variationId,
        ?string $lotId,
    ): void {
        $productExists = Product::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('id', $productId)
            ->exists();

        if (! $productExists) {
            throw new DomainException('Selected product is invalid for this business.', 422);
        }

        if ($variationId !== null) {
            $variationExists = ProductVariation::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('id', $variationId)
                ->where('product_id', $productId)
                ->exists();

            if (! $variationExists) {
                throw new DomainException('Selected variation is invalid for the chosen product.', 422);
            }
        }

        if ($lotId === null) {
            return;
        }

        $lotQuery = StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('id', $lotId)
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId);

        if ($variationId === null) {
            $lotQuery->whereNull('variation_id');
        } else {
            $lotQuery->where('variation_id', $variationId);
        }

        if (! $lotQuery->exists()) {
            throw new DomainException('Selected lot is invalid for the chosen product and warehouse.', 422);
        }
    }

    protected function ensureCountItemBelongsToCount(StockCount $count, StockCountItem $countItem): void
    {
        if ((string) $countItem->stock_count_id !== (string) $count->id) {
            throw new DomainException('Selected stock count item does not belong to this count session.', 422);
        }
    }

    protected function ensureUserCanAccessWarehouse(?User $user, Warehouse $warehouse): void
    {
        if ($user && ! $user->hasRole('super_admin') && ! $user->hasBranchAccess($warehouse->branch_id)) {
            throw new DomainException('You cannot manage stock counts outside your assigned branches.', 403);
        }
    }

    protected function ensureBelongsToBusiness(string $businessId, StockCount $count): void
    {
        if ((string) $count->business_id !== $businessId) {
            throw new DomainException('Stock count does not belong to the current business.', 422);
        }
    }

    protected function generateReferenceNumber(): string
    {
        $prefix = 'SC-'.now()->format('Y').'-';
        $lastReference = StockCount::withoutGlobalScopes()
            ->where('reference_no', 'like', $prefix.'%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $nextNumber = $lastReference === null
            ? 1
            : ((int) substr($lastReference, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $nextNumber);
    }
}
