<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\StockAdjustment;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Inventory\StockAdjustmentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StockAdjustmentService
{
    public function __construct(
        protected StockAdjustmentRepository $adjustments,
        protected StockMovementService $stockMovementService,
    ) {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->adjustments->paginateFiltered($filters, $user);
    }

    public function create(string $businessId, array $data, ?User $actor = null): StockAdjustment
    {
        return DB::transaction(function () use ($businessId, $data, $actor): StockAdjustment {
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id']);
            $this->ensureUserCanAccessWarehouse($actor, $warehouse);

            /** @var StockAdjustment $adjustment */
            $adjustment = $this->adjustments->create([
                'business_id' => $businessId,
                'warehouse_id' => $warehouse->id,
                'reference_no' => $this->generateReferenceNumber(),
                'date' => $data['date'],
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            foreach ($data['items'] as $item) {
                $adjustment->items()->create([
                    'product_id' => $item['product_id'],
                    'variation_id' => $item['variation_id'] ?? null,
                    'lot_id' => $item['lot_id'] ?? null,
                    'serial_id' => $item['serial_id'] ?? null,
                    'direction' => $item['direction'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);

                $this->stockMovementService->record($businessId, [
                    'product_id' => $item['product_id'],
                    'variation_id' => $item['variation_id'] ?? null,
                    'warehouse_id' => $warehouse->id,
                    'lot_id' => $item['lot_id'] ?? null,
                    'serial_id' => $item['serial_id'] ?? null,
                    'type' => $item['direction'] === 'in' ? 'adjustment_in' : 'adjustment_out',
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'reference_type' => StockAdjustment::class,
                    'reference_id' => $adjustment->id,
                    'notes' => $item['notes'] ?? $data['notes'] ?? null,
                ], $actor);
            }

            return $adjustment->load(['warehouse.branch', 'creator', 'items.product', 'items.variation']);
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

    protected function ensureUserCanAccessWarehouse(?User $user, Warehouse $warehouse): void
    {
        if ($user && ! $user->hasRole('super_admin') && ! $user->hasBranchAccess($warehouse->branch_id)) {
            throw new DomainException('You cannot adjust stock outside your assigned branches.', 403);
        }
    }

    protected function generateReferenceNumber(): string
    {
        $prefix = 'ADJ-'.now()->format('Y').'-';
        $lastReference = StockAdjustment::withoutGlobalScopes()
            ->where('reference_no', 'like', $prefix.'%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $nextNumber = $lastReference === null
            ? 1
            : ((int) substr($lastReference, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $nextNumber);
    }
}
