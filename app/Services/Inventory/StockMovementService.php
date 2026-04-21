<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\StockMovement;
use App\Models\StockSerial;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\Audit\AuditLogger;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class StockMovementService
{
    protected const INBOUND_TYPES = [
        'opening_stock',
        'purchase_receipt',
        'sale_return',
        'adjustment_in',
        'transfer_in',
        'manufacturing_in',
    ];

    protected const OUTBOUND_TYPES = [
        'sale',
        'purchase_return',
        'adjustment_out',
        'transfer_out',
        'combo_deduction',
        'manufacturing_out',
    ];

    public function __construct(protected AuditLogger $auditLogger)
    {
    }

    public function record(string $businessId, array $data, ?User $actor = null): StockMovement
    {
        return DB::transaction(function () use ($businessId, $data, $actor): StockMovement {
            $quantity = $this->normalizeQuantity($data['quantity'] ?? null);
            $type = (string) ($data['type'] ?? '');

            if ($quantity <= 0) {
                throw new DomainException('Stock movement quantity must be greater than zero.', 422);
            }

            $context = $this->resolveContext($businessId, $data, $type);
            $delta = $this->resolveQuantityDelta($type, $quantity, $data['direction'] ?? null);
            $level = $this->lockStockLevel(
                $businessId,
                $context['product']->id,
                $context['variation']?->id,
                $context['warehouse']->id
            );

            $this->ensureOnHandCanChange($level, $delta, $context['warehouse']);
            $this->ensureTrackedInventoryCanChange($context, $type, $quantity, $delta);

            $level->quantity = $this->formatDecimal($level->quantity + $delta);
            $level->save();
            $this->syncTrackedInventoryAfterMovement($context, $type, $quantity, $delta);

            /** @var StockMovement $movement */
            $movement = StockMovement::withoutGlobalScopes()->create([
                'business_id' => $businessId,
                'product_id' => $context['product']->id,
                'variation_id' => $context['variation']?->id,
                'warehouse_id' => $context['warehouse']->id,
                'lot_id' => $context['lot']?->id,
                'serial_id' => $context['serial']?->id,
                'type' => $type,
                'quantity' => $this->formatDecimal($quantity),
                'unit_cost' => $this->formatDecimal($data['unit_cost'] ?? 0),
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            $this->writeAuditLog($movement, $businessId, $actor, $level, $type);

            return $movement->refresh();
        });
    }

    public function reserve(string $businessId, array $data): StockLevel
    {
        return DB::transaction(function () use ($businessId, $data): StockLevel {
            $quantity = $this->normalizeQuantity($data['quantity'] ?? null);

            if ($quantity <= 0) {
                throw new DomainException('Reserved quantity must be greater than zero.', 422);
            }

            $context = $this->resolveContext($businessId, $data, 'reserve');
            $level = $this->lockStockLevel(
                $businessId,
                $context['product']->id,
                $context['variation']?->id,
                $context['warehouse']->id
            );

            $availableQuantity = (float) $level->quantity - (float) $level->reserved_quantity;

            if (! $context['warehouse']->allow_negative_stock && $availableQuantity < $quantity) {
                throw new DomainException('Not enough available stock to reserve that quantity.', 422);
            }

            $level->reserved_quantity = $this->formatDecimal((float) $level->reserved_quantity + $quantity);
            $level->save();
            $this->syncTrackedInventoryAfterReservation($context, $quantity);

            return $level->refresh();
        });
    }

    public function release(string $businessId, array $data): StockLevel
    {
        return DB::transaction(function () use ($businessId, $data): StockLevel {
            $quantity = $this->normalizeQuantity($data['quantity'] ?? null);

            if ($quantity <= 0) {
                throw new DomainException('Released quantity must be greater than zero.', 422);
            }

            $context = $this->resolveContext($businessId, $data, 'release');
            $level = $this->lockStockLevel(
                $businessId,
                $context['product']->id,
                $context['variation']?->id,
                $context['warehouse']->id
            );

            if ((float) $level->reserved_quantity < $quantity) {
                throw new DomainException('Cannot release more reserved stock than currently held.', 422);
            }

            $level->reserved_quantity = $this->formatDecimal((float) $level->reserved_quantity - $quantity);
            $level->save();
            $this->syncTrackedInventoryAfterRelease($context, $quantity);

            return $level->refresh();
        });
    }

    public function consumeReserved(string $businessId, array $data, ?User $actor = null): StockMovement
    {
        return DB::transaction(function () use ($businessId, $data, $actor): StockMovement {
            $quantity = $this->normalizeQuantity($data['quantity'] ?? null);
            $type = (string) ($data['type'] ?? 'sale');

            if ($quantity <= 0) {
                throw new DomainException('Consumed quantity must be greater than zero.', 422);
            }

            if (! in_array($type, self::OUTBOUND_TYPES, true)) {
                throw new DomainException('Reserved stock can only be consumed by outbound movement types.', 422);
            }

            $context = $this->resolveContext($businessId, $data, $type);
            $level = $this->lockStockLevel(
                $businessId,
                $context['product']->id,
                $context['variation']?->id,
                $context['warehouse']->id
            );

            if ((float) $level->reserved_quantity < $quantity) {
                throw new DomainException('Cannot consume more reserved stock than currently held.', 422);
            }

            $this->ensureTrackedInventoryCanChange($context, $type, $quantity, -1 * $quantity);
            $level->reserved_quantity = $this->formatDecimal((float) $level->reserved_quantity - $quantity);
            $level->quantity = $this->formatDecimal((float) $level->quantity - $quantity);
            $level->save();
            $this->syncTrackedInventoryAfterReservedConsumption($context, $type, $quantity);

            /** @var StockMovement $movement */
            $movement = StockMovement::withoutGlobalScopes()->create([
                'business_id' => $businessId,
                'product_id' => $context['product']->id,
                'variation_id' => $context['variation']?->id,
                'warehouse_id' => $context['warehouse']->id,
                'lot_id' => $context['lot']?->id,
                'serial_id' => $context['serial']?->id,
                'type' => $type,
                'quantity' => $this->formatDecimal($quantity),
                'unit_cost' => $this->formatDecimal($data['unit_cost'] ?? 0),
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $actor?->id,
            ]);

            $this->writeAuditLog($movement, $businessId, $actor, $level, $type);

            return $movement->refresh();
        });
    }

    protected function resolveContext(string $businessId, array $data, ?string $type = null): array
    {
        try {
            /** @var Product $product */
            $product = Product::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->findOrFail($data['product_id']);
        } catch (ModelNotFoundException) {
            throw new DomainException('Selected product is invalid for this business.', 422);
        }

        if (! $product->track_inventory) {
            throw new DomainException('This product is not configured for inventory tracking.', 422);
        }

        try {
            /** @var Warehouse $warehouse */
            $warehouse = Warehouse::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->findOrFail($data['warehouse_id']);
        } catch (ModelNotFoundException) {
            throw new DomainException('Selected warehouse is invalid for this business.', 422);
        }

        $variation = null;

        if (filled($data['variation_id'] ?? null)) {
            try {
                /** @var ProductVariation $variation */
                $variation = ProductVariation::withoutGlobalScopes()
                    ->where('business_id', $businessId)
                    ->where('product_id', $product->id)
                    ->findOrFail($data['variation_id']);
            } catch (ModelNotFoundException) {
                throw new DomainException('Selected variation is invalid for this product.', 422);
            }
        }

        $lot = null;

        if (filled($data['lot_id'] ?? null)) {
            try {
                $query = StockLot::withoutGlobalScopes()
                    ->where('business_id', $businessId)
                    ->where('product_id', $product->id);

                if ($variation === null) {
                    $query->whereNull('variation_id');
                } else {
                    $query->where('variation_id', $variation->id);
                }

                if ($type !== 'transfer_in') {
                    $query->where('warehouse_id', $warehouse->id);
                }

                /** @var StockLot $lot */
                $lot = $query->findOrFail($data['lot_id']);
            } catch (ModelNotFoundException) {
                throw new DomainException('Selected lot is invalid for this product and warehouse.', 422);
            }
        }

        $serial = null;

        if (filled($data['serial_id'] ?? null)) {
            try {
                $query = StockSerial::withoutGlobalScopes()
                    ->where('business_id', $businessId)
                    ->where('product_id', $product->id);

                if ($variation === null) {
                    $query->whereNull('variation_id');
                } else {
                    $query->where('variation_id', $variation->id);
                }

                if (! in_array($type, self::INBOUND_TYPES, true) && $type !== 'transfer_in') {
                    $query->where('warehouse_id', $warehouse->id);
                }

                /** @var StockSerial $serial */
                $serial = $query->findOrFail($data['serial_id']);
            } catch (ModelNotFoundException) {
                throw new DomainException('Selected serial is invalid for this product.', 422);
            }
        }

        return compact('product', 'variation', 'warehouse', 'lot', 'serial');
    }

    protected function lockStockLevel(
        string $businessId,
        string $productId,
        ?string $variationId,
        string $warehouseId,
    ): StockLevel {
        $query = StockLevel::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('product_id', $productId)
            ->where('warehouse_id', $warehouseId);

        if ($variationId === null) {
            $query->whereNull('variation_id');
        } else {
            $query->where('variation_id', $variationId);
        }

        /** @var StockLevel|null $level */
        $level = $query->lockForUpdate()->first();

        if ($level) {
            return $level;
        }

        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $businessId,
            'product_id' => $productId,
            'variation_id' => $variationId,
            'warehouse_id' => $warehouseId,
            'quantity' => 0,
            'reserved_quantity' => 0,
        ]);

        /** @var StockLevel $level */
        $level = $query->lockForUpdate()->firstOrFail();

        return $level;
    }

    protected function resolveQuantityDelta(string $type, float $quantity, mixed $direction = null): float
    {
        if (in_array($type, self::INBOUND_TYPES, true)) {
            return $quantity;
        }

        if (in_array($type, self::OUTBOUND_TYPES, true)) {
            return -1 * $quantity;
        }

        if ($type === 'stock_count_correction') {
            if ($direction === 'in') {
                return $quantity;
            }

            if ($direction === 'out') {
                return -1 * $quantity;
            }

            throw new DomainException('Stock count corrections must specify a direction of in or out.', 422);
        }

        throw new DomainException('Unsupported stock movement type supplied.', 422);
    }

    protected function ensureOnHandCanChange(StockLevel $level, float $delta, Warehouse $warehouse): void
    {
        if ($delta >= 0) {
            return;
        }

        $nextQuantity = (float) $level->quantity + $delta;

        if (! $warehouse->allow_negative_stock && $nextQuantity < 0) {
            throw new DomainException('This warehouse does not allow negative stock.', 422);
        }
    }

    protected function ensureTrackedInventoryCanChange(array $context, string $type, float $quantity, float $delta): void
    {
        /** @var StockLot|null $lot */
        $lot = $context['lot'];
        /** @var StockSerial|null $serial */
        $serial = $context['serial'];

        if ($serial && $quantity !== 1.0) {
            throw new DomainException('Serial-tracked movements must use a quantity of 1.', 422);
        }

        if ($lot && $delta < 0 && round((float) $lot->qty_on_hand + $delta, 4) < 0) {
            throw new DomainException('Not enough quantity is available in the selected lot.', 422);
        }

        if (! $serial || $delta >= 0) {
            return;
        }

        if ((string) $serial->warehouse_id !== (string) $context['warehouse']->id) {
            throw new DomainException('Selected serial is not currently stored in the chosen warehouse.', 422);
        }

        if (in_array($serial->status, ['sold', 'written_off'], true)) {
            throw new DomainException('Selected serial is no longer available for stock movements.', 422);
        }
    }

    protected function syncTrackedInventoryAfterMovement(array $context, string $type, float $quantity, float $delta): void
    {
        if ($context['lot'] instanceof StockLot) {
            $this->syncLotAfterMovement($context['lot'], $context['warehouse'], $type, $delta);
        }

        if ($context['serial'] instanceof StockSerial) {
            $this->syncSerialAfterMovement($context['serial'], $context['warehouse'], $type, $delta);
        }
    }

    protected function syncTrackedInventoryAfterReservation(array $context, float $quantity): void
    {
        if ($context['lot'] instanceof StockLot) {
            $nextReserved = round((float) $context['lot']->qty_reserved + $quantity, 4);

            if ($nextReserved > (float) $context['lot']->qty_on_hand) {
                throw new DomainException('Cannot reserve more lot quantity than is currently on hand.', 422);
            }

            $context['lot']->qty_reserved = $this->formatDecimal($nextReserved);
            $context['lot']->save();
        }

        if ($context['serial'] instanceof StockSerial) {
            if ($quantity !== 1.0) {
                throw new DomainException('Serial reservations must use a quantity of 1.', 422);
            }

            if ((string) $context['serial']->warehouse_id !== (string) $context['warehouse']->id) {
                throw new DomainException('Selected serial is not currently stored in the chosen warehouse.', 422);
            }

            $context['serial']->status = 'reserved';
            $context['serial']->save();
        }
    }

    protected function syncTrackedInventoryAfterRelease(array $context, float $quantity): void
    {
        if ($context['lot'] instanceof StockLot) {
            if ((float) $context['lot']->qty_reserved < $quantity) {
                throw new DomainException('Cannot release more lot quantity than is currently reserved.', 422);
            }

            $context['lot']->qty_reserved = $this->formatDecimal((float) $context['lot']->qty_reserved - $quantity);
            $context['lot']->save();
        }

        if ($context['serial'] instanceof StockSerial) {
            if ($quantity !== 1.0) {
                throw new DomainException('Serial releases must use a quantity of 1.', 422);
            }

            $context['serial']->status = 'in_stock';
            $context['serial']->save();
        }
    }

    protected function syncTrackedInventoryAfterReservedConsumption(array $context, string $type, float $quantity): void
    {
        if ($context['lot'] instanceof StockLot) {
            if ((float) $context['lot']->qty_reserved < $quantity) {
                throw new DomainException('Cannot consume more reserved lot quantity than is currently held.', 422);
            }

            $context['lot']->qty_reserved = $this->formatDecimal((float) $context['lot']->qty_reserved - $quantity);
            $context['lot']->qty_on_hand = $this->formatDecimal((float) $context['lot']->qty_on_hand - $quantity);
            $this->refreshLotStatus($context['lot']);
            $context['lot']->save();
        }

        if ($context['serial'] instanceof StockSerial) {
            if ($quantity !== 1.0) {
                throw new DomainException('Serial consumption must use a quantity of 1.', 422);
            }

            $this->applySerialStatus($context['serial'], $context['warehouse'], $type, -1 * $quantity);
            $context['serial']->save();
        }
    }

    protected function syncLotAfterMovement(StockLot $lot, Warehouse $warehouse, string $type, float $delta): void
    {
        if ($type === 'transfer_in' && (string) $lot->warehouse_id !== (string) $warehouse->id) {
            if ((float) $lot->qty_on_hand !== 0.0 || (float) $lot->qty_reserved !== 0.0) {
                throw new DomainException('Partial lot transfers are not supported by the current lot model.', 422);
            }

            $lot->warehouse_id = $warehouse->id;
        }

        $lot->qty_on_hand = $this->formatDecimal((float) $lot->qty_on_hand + $delta);
        $this->refreshLotStatus($lot);
        $lot->save();
    }

    protected function refreshLotStatus(StockLot $lot): void
    {
        if (in_array($lot->status, ['expired', 'recalled', 'quarantine'], true)) {
            return;
        }

        $lot->status = (float) $lot->qty_on_hand > 0 ? 'active' : 'depleted';
    }

    protected function syncSerialAfterMovement(StockSerial $serial, Warehouse $warehouse, string $type, float $delta): void
    {
        $this->applySerialStatus($serial, $warehouse, $type, $delta);
        $serial->save();
    }

    protected function applySerialStatus(StockSerial $serial, Warehouse $warehouse, string $type, float $delta): void
    {
        if ($delta > 0) {
            $serial->warehouse_id = $warehouse->id;
            $serial->status = 'in_stock';

            return;
        }

        match ($type) {
            'sale' => $this->moveSerialOutOfWarehouse($serial, 'sold', true),
            'purchase_return' => $this->moveSerialOutOfWarehouse($serial, 'returned'),
            'adjustment_out', 'combo_deduction', 'manufacturing_out', 'stock_count_correction' => $this->moveSerialOutOfWarehouse($serial, 'written_off'),
            'transfer_out' => $serial->status = 'transferred',
            default => null,
        };
    }

    protected function moveSerialOutOfWarehouse(StockSerial $serial, string $status, bool $markSoldAt = false): void
    {
        $serial->warehouse_id = null;
        $serial->status = $status;

        if ($markSoldAt) {
            $serial->sold_at = now();
        }
    }

    protected function writeAuditLog(
        StockMovement $movement,
        string $businessId,
        ?User $actor,
        StockLevel $level,
        string $type,
    ): void {
        $event = match ($type) {
            'adjustment_in', 'adjustment_out', 'stock_count_correction' => 'stock_adjusted',
            'transfer_in', 'transfer_out' => 'stock_transferred',
            default => null,
        };

        if ($event === null) {
            return;
        }

        $this->auditLogger->log(
            $event,
            StockMovement::class,
            $movement->id,
            $actor,
            $businessId,
            null,
            [
                'movement_type' => $movement->type,
                'product_id' => $movement->product_id,
                'variation_id' => $movement->variation_id,
                'warehouse_id' => $movement->warehouse_id,
                'quantity' => $movement->quantity,
                'unit_cost' => $movement->unit_cost,
                'reference_type' => $movement->reference_type,
                'reference_id' => $movement->reference_id,
                'stock_level_quantity' => $level->quantity,
                'stock_level_reserved_quantity' => $level->reserved_quantity,
            ]
        );
    }

    protected function normalizeQuantity(mixed $value): float
    {
        return round((float) $value, 4);
    }

    protected function formatDecimal(float|int|string|null $value): string
    {
        return number_format((float) $value, 4, '.', '');
    }
}
