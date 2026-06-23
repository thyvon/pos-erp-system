<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockCount;
use App\Models\StockCountEntry;
use App\Models\StockCountItem;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Inventory\StockCountRepository;
use App\Services\Foundation\EditWindowService;
use App\Support\Audit\AuditLogger;
use App\Support\Database\PostgresAdvisoryLock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StockCountService
{
    protected const STATUS_IN_PROGRESS = 'in_progress';

    protected const STATUS_COMPLETED = 'completed';

    protected const RESPONSE_RELATIONS = [
        'warehouse.branch',
        'creator',
        'completer',
        'items.product',
        'items.variation',
        'items.lot',
    ];

    public function __construct(
        protected StockCountRepository $counts,
        protected StockMovementService $stockMovementService,
        protected AuditLogger $auditLogger,
        protected EditWindowService $editWindow,
    ) {}

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

        return $this->counts->paginateItems($count, $filters);
    }

    public function paginateEntries(StockCount $count, array $filters, ?User $user = null): LengthAwarePaginator
    {
        if ($user) {
            $this->ensureBelongsToBusiness($user->business_id, $count);
        }

        $count->loadMissing('warehouse');
        $this->ensureUserCanAccessWarehouse($user, $count->warehouse);

        return $this->counts->paginateEntries($count, $filters);
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
                'status' => self::STATUS_IN_PROGRESS,
                'date' => $data['date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            $this->seedCurrentStockItems($count, $businessId, $warehouse->id);
            $this->seedCountItems($count, $businessId, $warehouse->id, $data['items'] ?? []);

            $count = $this->loadCountForResponse($count);
            $this->auditCountStarted($businessId, $count, $actor);

            return $count;
        });
    }

    public function recordEntry(string $businessId, StockCount $count, array $data, ?User $actor = null): StockCount
    {
        return DB::transaction(function () use ($businessId, $count, $data, $actor): StockCount {
            $count = $this->lockCountForUpdate($count, ['warehouse']);
            $this->ensureCountIsManageable($businessId, $count, $actor);
            $this->assertCountStatus($count, [self::STATUS_IN_PROGRESS], 'Only in-progress stock counts can accept entries.');
            $this->assertCountWithinEditWindow($count);

            $selection = $this->resolveCountItemSelection($businessId, $count->warehouse_id, $data);
            $quantity = $this->normalizeEntryQuantity($data['quantity']);

            $countItem = $this->findOrCreateCountItem(
                $count,
                $businessId,
                $count->warehouse_id,
                $selection['product_id'],
                $selection['variation_id'],
                $selection['lot_id'],
                $data['unit_cost'] ?? 0
            );

            $this->incrementCountedQuantity($countItem, $quantity);
            $this->updateItemUnitCostWhenPresent($countItem, $data);
            $this->recordEntryDelta($businessId, $count, $countItem, $quantity, $actor);

            $count = $this->loadCountForResponse($count, refresh: true);
            $this->auditEntryRecorded($businessId, $count, $countItem, $quantity, $actor);

            return $count;
        });
    }

    public function updateEntry(
        string $businessId,
        StockCount $count,
        StockCountEntry $entry,
        array $data,
        ?User $actor = null
    ): StockCount {
        return DB::transaction(function () use ($businessId, $count, $entry, $data, $actor): StockCount {
            $count = $this->lockCountForUpdate($count, ['warehouse']);
            $this->ensureCountIsManageable($businessId, $count, $actor);
            $this->assertCountStatus($count, [self::STATUS_IN_PROGRESS], 'Only in-progress stock counts can update entries.');
            $this->assertCountWithinEditWindow($count);

            $entry = $this->lockEntryForUpdate($count, $entry);
            $countItem = $this->lockCountItemForUpdate($count, $entry->stockCountItem);

            $oldQuantity = round((float) $entry->quantity, 4);
            $newQuantity = $this->normalizeEntryQuantity($data['quantity']);
            $delta = round($newQuantity - $oldQuantity, 4);

            if ($delta !== 0.0) {
                $this->incrementCountedQuantity($countItem, $delta);
            }

            $entry->quantity = $newQuantity;
            $entry->save();

            $count = $this->loadCountForResponse($count, refresh: true);
            $this->auditEntryUpdated($businessId, $count, $countItem, $oldQuantity, $newQuantity, $delta, $actor);

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
            $count = $this->lockCountForUpdate($count, ['warehouse']);
            $this->ensureCountIsManageable($businessId, $count, $actor);
            $this->assertCountStatus(
                $count,
                [self::STATUS_IN_PROGRESS, self::STATUS_COMPLETED],
                'Only in-progress or completed stock counts can be edited.'
            );
            $this->assertCountWithinEditWindow($count);

            $countItem = $this->lockCountItemForUpdate($count, $countItem);
            $targetQuantity = $this->normalizeCountedQuantity($data['counted_quantity']);
            $wasUncounted = $countItem->counted_quantity === null;
            $currentQuantity = $this->currentCountedQuantity($countItem);
            $delta = round($targetQuantity - $currentQuantity, 4);

            if ($delta === 0.0 && ! $wasUncounted) {
                return $this->loadCountForResponse($count, refresh: true);
            }

            $countItem->counted_quantity = $targetQuantity;
            $countItem->save();

            if ($delta !== 0.0) {
                $this->recordEntryDelta($businessId, $count, $countItem, $delta, $actor);
            }

            if ($count->status === self::STATUS_COMPLETED && $delta !== 0.0) {
                $this->recordCorrectionMovement($businessId, $count, $countItem, $delta, 'Stock count post-completion correction', $actor);
            }

            $count = $this->loadCountForResponse($count, refresh: true);
            $this->auditItemUpdated($businessId, $count, $countItem, $currentQuantity, $targetQuantity, $delta, $actor);

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
            $count = $this->lockCountForUpdate($count, ['warehouse']);
            $this->ensureCountIsManageable($businessId, $count, $actor);
            $this->assertCountStatus($count, [self::STATUS_IN_PROGRESS], 'Only in-progress stock counts can remove counted lines.');
            $this->assertCountWithinEditWindow($count);

            $countItem = $this->lockCountItemForUpdate($count, $countItem);
            $auditPayload = $this->removedItemAuditPayload($count, $countItem);

            $countItem->entries()->delete();
            $countItem->delete();

            $count = $this->loadCountForResponse($count, refresh: true);
            $this->auditCountEvent('stock_count_item_removed', $businessId, $count, $actor, $auditPayload);

            return $count;
        });
    }

    public function delete(string $businessId, StockCount $count, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $count, $actor): void {
            $count = $this->lockCountForUpdate($count, ['warehouse']);
            $this->ensureCountIsManageable($businessId, $count, $actor);
            $this->assertCountStatus($count, [self::STATUS_IN_PROGRESS], 'Only in-progress stock counts can be deleted.');
            $this->assertCountWithinEditWindow($count);

            $auditPayload = [
                'warehouse_id' => $count->warehouse_id,
                'reference_no' => $count->reference_no,
                'item_count' => $count->items()->count(),
                'entry_count' => $count->entries()->count(),
            ];

            $countId = $count->id;

            $count->entries()->delete();
            $count->items()->delete();
            $count->delete();

            $this->auditLogger->log(
                'stock_count_deleted',
                StockCount::class,
                $countId,
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
            $count = $this->lockCountForUpdate($count, ['warehouse', 'items']);
            $this->ensureCountIsManageable($businessId, $count, $actor);
            $this->assertCountStatus($count, [self::STATUS_IN_PROGRESS], 'Only in-progress stock counts can be completed.');
            $this->assertCountWithinEditWindow($count);

            $discrepancyCount = $this->postCompletionCorrections($businessId, $count, $data, $actor);

            $count->status = self::STATUS_COMPLETED;
            $count->completed_by = $actor?->id;
            $count->save();

            $count = $this->loadCountForResponse($count, refresh: true);
            $this->auditCountCompleted($businessId, $count, $discrepancyCount, $actor);

            return $count;
        });
    }

    protected function seedCountItems(StockCount $count, string $businessId, string $warehouseId, array $items): void
    {
        foreach ($items as $item) {
            $selection = $this->resolveCountItemSelection($businessId, $warehouseId, $item);

            $this->findOrCreateCountItem(
                $count,
                $businessId,
                $warehouseId,
                $selection['product_id'],
                $selection['variation_id'],
                $selection['lot_id'],
                $item['unit_cost'] ?? 0
            );
        }
    }

    protected function seedCurrentStockItems(StockCount $count, string $businessId, string $warehouseId): void
    {
        StockLevel::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->where('quantity', '!=', 0)
            ->orderBy('product_id')
            ->orderBy('variation_id')
            ->chunkById(100, function ($levels) use ($count, $businessId, $warehouseId): void {
                foreach ($levels as $level) {
                    $this->findOrCreateCountItem(
                        $count,
                        $businessId,
                        $warehouseId,
                        $level->product_id,
                        $level->variation_id,
                        null,
                        0
                    );
                }
            });
    }

    protected function postCompletionCorrections(string $businessId, StockCount $count, array $data, ?User $actor): int
    {
        $payloadById = collect($data['items'] ?? [])->keyBy('id');
        $discrepancyCount = 0;

        foreach ($count->items as $item) {
            if ($payloadById->has($item->id)) {
                $payload = $payloadById->get($item->id);
                $item->counted_quantity = array_key_exists('counted_quantity', $payload)
                    ? $this->nullableCountedQuantity($payload['counted_quantity'])
                    : $item->counted_quantity;
                $item->save();
            }

            $difference = $this->countItemDifference($item);

            if ($difference === null || $difference === 0.0) {
                continue;
            }

            $discrepancyCount++;
            $this->recordCorrectionMovement($businessId, $count, $item, $difference, 'Stock count correction', $actor);
        }

        return $discrepancyCount;
    }

    protected function recordCorrectionMovement(
        string $businessId,
        StockCount $count,
        StockCountItem $item,
        float $difference,
        string $notes,
        ?User $actor,
    ): void {
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
            'notes' => $notes,
        ], $actor);
    }

    protected function recordEntryDelta(
        string $businessId,
        StockCount $count,
        StockCountItem $item,
        float $quantity,
        ?User $actor,
    ): void {
        $count->entries()->create([
            'business_id' => $businessId,
            'stock_count_item_id' => $item->id,
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'quantity' => $quantity,
            'unit_cost' => $item->unit_cost,
            'created_by' => $actor?->id,
        ]);
    }

    protected function incrementCountedQuantity(StockCountItem $item, float $quantity): void
    {
        $newCountedQuantity = round($this->currentCountedQuantity($item) + $quantity, 4);

        if ($newCountedQuantity < 0) {
            throw new DomainException('Counted quantity cannot become negative.', 422);
        }

        $item->counted_quantity = $newCountedQuantity;
        $item->save();
    }

    protected function updateItemUnitCostWhenPresent(StockCountItem $item, array $data): void
    {
        if (! array_key_exists('unit_cost', $data) || $data['unit_cost'] === null) {
            return;
        }

        $item->unit_cost = round((float) $data['unit_cost'], 4);
        $item->save();
    }

    protected function normalizeEntryQuantity(mixed $quantity): float
    {
        $quantity = round((float) $quantity, 4);

        if ($quantity < 0) {
            throw new DomainException('Count quantity cannot be negative.', 422);
        }

        return $quantity;
    }

    protected function normalizeCountedQuantity(mixed $quantity): float
    {
        return round((float) $quantity, 4);
    }

    protected function nullableCountedQuantity(mixed $quantity): ?float
    {
        return $quantity === null ? null : $this->normalizeCountedQuantity($quantity);
    }

    protected function currentCountedQuantity(StockCountItem $item): float
    {
        return round((float) ($item->counted_quantity ?? 0), 4);
    }

    protected function countItemDifference(StockCountItem $item): ?float
    {
        if ($item->counted_quantity === null) {
            return null;
        }

        return round((float) $item->counted_quantity - (float) $item->system_quantity, 4);
    }

    protected function assertCountWithinEditWindow(StockCount $count): void
    {
        $this->editWindow->assertWithinWindow(
            $count->date ?? $count->created_at,
            'stock',
            'count_edit_lifetime_days',
            'This stock count is outside the allowed edit lifetime.',
        );
    }

    protected function assertCountStatus(StockCount $count, array $allowedStatuses, string $message): void
    {
        if (! in_array($count->status, $allowedStatuses, true)) {
            throw new DomainException($message, 422);
        }
    }

    protected function lockCountForUpdate(StockCount $count, array $relations = []): StockCount
    {
        /** @var StockCount $lockedCount */
        $lockedCount = StockCount::query()
            ->with($relations)
            ->whereKey($count->id)
            ->lockForUpdate()
            ->firstOrFail();

        return $lockedCount;
    }

    protected function lockCountItemForUpdate(StockCount $count, StockCountItem $countItem): StockCountItem
    {
        $this->ensureCountItemBelongsToCount($count, $countItem);

        /** @var StockCountItem $lockedItem */
        $lockedItem = StockCountItem::query()
            ->whereKey($countItem->id)
            ->lockForUpdate()
            ->firstOrFail();

        return $lockedItem;
    }

    protected function lockEntryForUpdate(StockCount $count, StockCountEntry $entry): StockCountEntry
    {
        $this->ensureEntryBelongsToCount($count, $entry);

        /** @var StockCountEntry $lockedEntry */
        $lockedEntry = StockCountEntry::query()
            ->with('stockCountItem')
            ->whereKey($entry->id)
            ->lockForUpdate()
            ->firstOrFail();

        $this->ensureEntryBelongsToCount($count, $lockedEntry);

        return $lockedEntry;
    }

    protected function loadCountForResponse(StockCount $count, bool $refresh = false): StockCount
    {
        if ($refresh) {
            $count->refresh();
        }

        return $count->load(self::RESPONSE_RELATIONS);
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

    protected function resolveCountItemSelection(string $businessId, string $warehouseId, array $data): array
    {
        $selection = [
            'product_id' => $data['product_id'],
            'variation_id' => $data['variation_id'] ?? null,
            'lot_id' => $data['lot_id'] ?? null,
        ];

        $this->ensureValidCountItemSelection(
            $businessId,
            $warehouseId,
            $selection['product_id'],
            $selection['variation_id'],
            $selection['lot_id']
        );

        return $selection;
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
        $query = $count->items()->where('product_id', $productId);

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

    protected function ensureCountIsManageable(string $businessId, StockCount $count, ?User $user): void
    {
        $this->ensureBelongsToBusiness($businessId, $count);
        $count->loadMissing('warehouse');
        $this->ensureUserCanAccessWarehouse($user, $count->warehouse);
    }

    protected function ensureCountItemBelongsToCount(StockCount $count, StockCountItem $countItem): void
    {
        if ((string) $countItem->stock_count_id !== (string) $count->id) {
            throw new DomainException('Selected stock count item does not belong to this count session.', 422);
        }
    }

    protected function ensureEntryBelongsToCount(StockCount $count, StockCountEntry $entry): void
    {
        if ((string) $entry->stock_count_id !== (string) $count->id) {
            throw new DomainException('Selected stock count entry does not belong to this count session.', 422);
        }
    }

    protected function ensureUserCanAccessWarehouse(?User $user, ?Warehouse $warehouse): void
    {
        if (! $warehouse) {
            throw new DomainException('Stock count warehouse is missing.', 422);
        }

        if ($user && ! $user->hasBranchAccess($warehouse->branch_id)) {
            throw new DomainException('You cannot manage stock counts outside your assigned branches.', 403);
        }
    }

    protected function ensureBelongsToBusiness(string $businessId, StockCount $count): void
    {
        if ((string) $count->business_id !== $businessId) {
            throw new DomainException('Stock count does not belong to the current business.', 422);
        }
    }

    protected function removedItemAuditPayload(StockCount $count, StockCountItem $item): array
    {
        return [
            'warehouse_id' => $count->warehouse_id,
            'reference_no' => $count->reference_no,
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'lot_id' => $item->lot_id,
            'counted_quantity' => round((float) ($item->counted_quantity ?? 0), 4),
            'system_quantity' => round((float) ($item->system_quantity ?? 0), 4),
        ];
    }

    protected function auditCountStarted(string $businessId, StockCount $count, ?User $actor): void
    {
        $this->auditCountEvent('stock_count_started', $businessId, $count, $actor, [
            'warehouse_id' => $count->warehouse_id,
            'reference_no' => $count->reference_no,
        ]);
    }

    protected function auditEntryRecorded(
        string $businessId,
        StockCount $count,
        StockCountItem $item,
        float $quantity,
        ?User $actor,
    ): void {
        $this->auditCountEvent('stock_count_entry_recorded', $businessId, $count, $actor, [
            'warehouse_id' => $count->warehouse_id,
            'reference_no' => $count->reference_no,
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'quantity' => $quantity,
            'counted_quantity' => $item->counted_quantity,
        ]);
    }

    protected function auditEntryUpdated(
        string $businessId,
        StockCount $count,
        StockCountItem $item,
        float $oldQuantity,
        float $newQuantity,
        float $delta,
        ?User $actor,
    ): void {
        $this->auditCountEvent('stock_count_entry_updated', $businessId, $count, $actor, [
            'warehouse_id' => $count->warehouse_id,
            'reference_no' => $count->reference_no,
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'old_quantity' => $oldQuantity,
            'new_quantity' => $newQuantity,
            'delta' => $delta,
            'counted_quantity' => $item->counted_quantity,
        ]);
    }

    protected function auditItemUpdated(
        string $businessId,
        StockCount $count,
        StockCountItem $item,
        float $oldQuantity,
        float $newQuantity,
        float $delta,
        ?User $actor,
    ): void {
        $this->auditCountEvent('stock_count_item_updated', $businessId, $count, $actor, [
            'warehouse_id' => $count->warehouse_id,
            'reference_no' => $count->reference_no,
            'product_id' => $item->product_id,
            'variation_id' => $item->variation_id,
            'old_counted_quantity' => $oldQuantity,
            'new_counted_quantity' => $newQuantity,
            'delta' => $delta,
        ]);
    }

    protected function auditCountCompleted(string $businessId, StockCount $count, int $discrepancyCount, ?User $actor): void
    {
        $this->auditCountEvent('stock_count_completed', $businessId, $count, $actor, [
            'warehouse_id' => $count->warehouse_id,
            'reference_no' => $count->reference_no,
            'discrepancy_count' => $discrepancyCount,
        ]);
    }

    protected function auditCountEvent(string $event, string $businessId, StockCount $count, ?User $actor, array $payload): void
    {
        $this->auditLogger->log(
            $event,
            StockCount::class,
            $count->id,
            $actor,
            $businessId,
            null,
            $payload
        );
    }

    protected function generateReferenceNumber(): string
    {
        PostgresAdvisoryLock::acquire('stock-count-number:'.now()->format('Y'));

        $prefix = 'SC-'.now()->format('Y').'-';
        $lastReference = StockCount::withoutGlobalScopes()
            ->whereLike('reference_no', $prefix.'%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $nextNumber = $lastReference === null
            ? 1
            : ((int) substr($lastReference, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $nextNumber);
    }
}
