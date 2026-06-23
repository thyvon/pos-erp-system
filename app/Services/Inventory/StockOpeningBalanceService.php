<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockLot;
use App\Models\StockMovement;
use App\Models\StockOpeningBalance;
use App\Models\StockSerial;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BranchAccess;
use App\Support\Database\PostgresAdvisoryLock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StockOpeningBalanceService
{
    public function __construct(protected StockMovementService $stockMovementService) {}

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = StockOpeningBalance::query()
            ->with(['warehouse.branch', 'creator'])
            ->when(filled($filters['search'] ?? null), function ($query) use ($filters): void {
                $search = trim((string) $filters['search']);

                $query->where(function ($inner) use ($search): void {
                    $inner
                        ->whereLike('reference_no', "%{$search}%")
                        ->orWhereLike('notes', "%{$search}%");
                });
            })
            ->when(
                filled($filters['warehouse_id'] ?? null),
                fn ($query) => $query->where('warehouse_id', $filters['warehouse_id'])
            )
            ->when(
                filled($filters['date_from'] ?? null),
                fn ($query) => $query->whereDate('date', '>=', $filters['date_from'])
            )
            ->when(
                filled($filters['date_to'] ?? null),
                fn ($query) => $query->whereDate('date', '<=', $filters['date_to'])
            )
            ->whereHas('warehouse', function ($warehouseQuery) use ($user): void {
                BranchAccess::scopeBranchQuery($warehouseQuery, $user, 'branch_id');
            })
            ->orderByDesc('date')
            ->orderByDesc('created_at');

        return $query->paginate($perPage)->withQueryString();
    }

    public function create(string $businessId, array $data, ?User $actor = null): StockOpeningBalance
    {
        return DB::transaction(function () use ($businessId, $data, $actor): StockOpeningBalance {
            $warehouse = $this->resolveWarehouse($businessId, $data['warehouse_id']);
            $this->ensureUserCanAccessWarehouse($actor, $warehouse);
            $resolvedItems = $this->resolveItems($businessId, $warehouse, $data['items']);
            $this->ensureNoExistingStockHistory($businessId, $warehouse, $resolvedItems);

            /** @var StockOpeningBalance $openingBalance */
            $openingBalance = StockOpeningBalance::query()->create([
                'business_id' => $businessId,
                'warehouse_id' => $warehouse->id,
                'reference_no' => $this->generateReferenceNumber(),
                'date' => $data['date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            foreach ($resolvedItems as $item) {
                $lot = $this->prepareLot($businessId, $warehouse, $item, $actor);
                $serial = $this->prepareSerial($businessId, $warehouse, $item, $actor);

                $openingBalance->items()->create([
                    'product_id' => $item['product']->id,
                    'variation_id' => $item['variation']?->id,
                    'lot_id' => $lot?->id,
                    'serial_id' => $serial?->id,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'lot_number' => $item['lot_number'],
                    'manufacture_date' => $item['manufacture_date'],
                    'expiry_date' => $item['expiry_date'],
                    'serial_number' => $item['serial_number'],
                    'warranty_expires' => $item['warranty_expires'],
                    'notes' => $item['notes'],
                ]);

                $this->stockMovementService->record($businessId, [
                    'product_id' => $item['product']->id,
                    'variation_id' => $item['variation']?->id,
                    'warehouse_id' => $warehouse->id,
                    'lot_id' => $lot?->id,
                    'serial_id' => $serial?->id,
                    'type' => 'opening_stock',
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'reference_type' => StockOpeningBalance::class,
                    'reference_id' => $openingBalance->id,
                    'notes' => $item['notes'] ?? $data['notes'] ?? null,
                ], $actor);
            }

            return $openingBalance->load(['warehouse.branch', 'creator', 'items.product', 'items.variation', 'items.lot', 'items.serial']);
        });
    }

    protected function resolveItems(string $businessId, Warehouse $warehouse, array $items): Collection
    {
        return collect($items)->map(function (array $item) use ($businessId, $warehouse): array {
            $product = $this->resolveProduct($businessId, $item['product_id']);
            $variation = $this->resolveVariation($businessId, $product, $item['variation_id'] ?? null);
            $quantity = round((float) $item['quantity'], 4);
            $unitCost = round((float) ($item['unit_cost'] ?? 0), 4);
            $lotNumber = $this->nullableString($item['lot_number'] ?? null);
            $serialNumber = $this->nullableString($item['serial_number'] ?? null);

            if ($product->type === 'variable' && $variation === null) {
                throw new DomainException("Variable product {$product->name} requires a variation.", 422);
            }

            if ($product->stock_tracking === 'lot' && $lotNumber === null) {
                throw new DomainException("Lot-tracked product {$product->name} requires a lot number.", 422);
            }

            if ($product->stock_tracking === 'serial') {
                if ($serialNumber === null) {
                    throw new DomainException("Serial-tracked product {$product->name} requires a serial number.", 422);
                }

                if ($quantity !== 1.0) {
                    throw new DomainException('Serial opening balance lines must have a quantity of 1.', 422);
                }
            }

            if ($product->stock_tracking !== 'lot' && $lotNumber !== null) {
                throw new DomainException('Lot number can only be used with lot-tracked products.', 422);
            }

            if ($product->stock_tracking !== 'serial' && $serialNumber !== null) {
                throw new DomainException('Serial number can only be used with serial-tracked products.', 422);
            }

            $this->ensureWarehouseOwnsProductContext($warehouse, $product);

            return [
                'product' => $product,
                'variation' => $variation,
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'lot_number' => $lotNumber,
                'manufacture_date' => $item['manufacture_date'] ?? null,
                'expiry_date' => $item['expiry_date'] ?? null,
                'serial_number' => $serialNumber,
                'warranty_expires' => $item['warranty_expires'] ?? null,
                'notes' => $item['notes'] ?? null,
            ];
        });
    }

    protected function ensureNoExistingStockHistory(string $businessId, Warehouse $warehouse, Collection $items): void
    {
        $keys = $items
            ->map(fn (array $item) => $item['product']->id.'|'.($item['variation']?->id ?? ''))
            ->unique()
            ->values();

        foreach ($keys as $key) {
            [$productId, $variationId] = explode('|', $key, 2);

            $query = StockMovement::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->where('warehouse_id', $warehouse->id)
                ->where('product_id', $productId);

            $variationId === ''
                ? $query->whereNull('variation_id')
                : $query->where('variation_id', $variationId);

            if ($query->exists()) {
                throw new DomainException('Opening balance can only be entered before stock history exists for the selected product and warehouse.', 422);
            }
        }
    }

    protected function prepareLot(string $businessId, Warehouse $warehouse, array $item, ?User $actor): ?StockLot
    {
        if ($item['product']->stock_tracking !== 'lot') {
            return null;
        }

        /** @var StockLot|null $existing */
        $existing = StockLot::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('lot_number', $item['lot_number'])
            ->first();

        if ($existing && (
            (string) $existing->product_id !== (string) $item['product']->id
            || (string) ($existing->variation_id ?? '') !== (string) ($item['variation']?->id ?? '')
            || (string) $existing->warehouse_id !== (string) $warehouse->id
        )) {
            throw new DomainException('Lot number already exists for another product, variation, or warehouse.', 422);
        }

        $lot = $existing ?? StockLot::withoutGlobalScopes()->create([
            'business_id' => $businessId,
            'product_id' => $item['product']->id,
            'variation_id' => $item['variation']?->id,
            'warehouse_id' => $warehouse->id,
            'lot_number' => $item['lot_number'],
            'manufacture_date' => $item['manufacture_date'],
            'expiry_date' => $item['expiry_date'],
            'received_at' => now(),
            'unit_cost' => number_format((float) $item['unit_cost'], 4, '.', ''),
            'qty_received' => 0,
            'qty_on_hand' => 0,
            'qty_reserved' => 0,
            'status' => 'active',
            'notes' => $item['notes'],
            'created_by' => $actor?->id,
        ]);

        $lot->qty_received = number_format((float) $lot->qty_received + (float) $item['quantity'], 4, '.', '');
        $lot->unit_cost = number_format((float) $item['unit_cost'], 4, '.', '');
        $lot->save();

        return $lot;
    }

    protected function prepareSerial(string $businessId, Warehouse $warehouse, array $item, ?User $actor): ?StockSerial
    {
        if ($item['product']->stock_tracking !== 'serial') {
            return null;
        }

        if (StockSerial::withoutGlobalScopes()->where('business_id', $businessId)->where('serial_number', $item['serial_number'])->exists()) {
            throw new DomainException('Serial number already exists in this business.', 422);
        }

        return StockSerial::withoutGlobalScopes()->create([
            'business_id' => $businessId,
            'product_id' => $item['product']->id,
            'variation_id' => $item['variation']?->id,
            'warehouse_id' => null,
            'serial_number' => $item['serial_number'],
            'status' => 'transferred',
            'unit_cost' => number_format((float) $item['unit_cost'], 4, '.', ''),
            'warranty_expires' => $item['warranty_expires'],
            'received_at' => now(),
            'notes' => $item['notes'],
            'created_by' => $actor?->id,
        ]);
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

    protected function resolveProduct(string $businessId, string $productId): Product
    {
        /** @var Product|null $product */
        $product = Product::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->find($productId);

        if (! $product || ! $product->track_inventory) {
            throw new DomainException('Selected product is invalid for opening stock.', 422);
        }

        return $product;
    }

    protected function resolveVariation(string $businessId, Product $product, ?string $variationId): ?ProductVariation
    {
        if (! filled($variationId)) {
            return null;
        }

        /** @var ProductVariation|null $variation */
        $variation = ProductVariation::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('product_id', $product->id)
            ->find($variationId);

        if (! $variation) {
            throw new DomainException('Selected variation is invalid for this product.', 422);
        }

        return $variation;
    }

    protected function ensureWarehouseOwnsProductContext(Warehouse $warehouse, Product $product): void
    {
        if ((string) $warehouse->business_id !== (string) $product->business_id) {
            throw new DomainException('Selected warehouse is invalid for this product.', 422);
        }
    }

    protected function ensureUserCanAccessWarehouse(?User $user, Warehouse $warehouse): void
    {
        if ($user && ! $user->hasBranchAccess($warehouse->branch_id)) {
            throw new DomainException('You cannot enter opening stock outside your assigned branches.', 403);
        }
    }

    protected function generateReferenceNumber(): string
    {
        PostgresAdvisoryLock::acquire('stock-opening-number:'.now()->format('Y'));

        $prefix = 'OPEN-'.now()->format('Y').'-';
        $lastReference = StockOpeningBalance::withoutGlobalScopes()
            ->whereLike('reference_no', $prefix.'%')
            ->orderByDesc('reference_no')
            ->value('reference_no');

        $nextNumber = $lastReference === null
            ? 1
            : ((int) substr($lastReference, strlen($prefix))) + 1;

        return sprintf('%s%05d', $prefix, $nextNumber);
    }

    protected function nullableString(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));

        return $text === '' ? null : $text;
    }
}
