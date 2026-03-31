<?php

namespace App\Services\Inventory;

use App\Exceptions\Domain\DomainException;
use App\Models\Product;
use App\Models\ProductVariation;
use App\Models\StockLevel;
use App\Models\StockLot;
use App\Models\StockSerial;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class InventoryProductLookupService
{
    public function search(string $businessId, string $term, ?string $warehouseId = null, ?User $actor = null): Collection
    {
        $term = trim($term);

        if ($term === '') {
            return collect();
        }

        $warehouse = null;

        if ($warehouseId) {
            $warehouse = $this->resolveWarehouse($businessId, $warehouseId);
            $this->ensureUserCanAccessWarehouse($actor, $warehouse);
        }

        return collect()
            ->concat($this->searchSerials($businessId, $term, $warehouse?->id))
            ->concat($this->searchLots($businessId, $term, $warehouse?->id))
            ->concat($this->searchVariations($businessId, $term, $warehouse?->id))
            ->concat($this->searchProducts($businessId, $term, $warehouse?->id))
            ->unique(fn (array $item) => implode(':', [
                $item['product_id'],
                $item['variation_id'] ?? '',
                $item['lot_id'] ?? '',
                $item['serial_id'] ?? '',
            ]))
            ->sortBy([
                ['score', 'asc'],
                ['label', 'asc'],
            ])
            ->take(12)
            ->values()
            ->map(function (array $item): array {
                unset($item['score']);

                return $item;
            });
    }

    protected function searchProducts(string $businessId, string $term, ?string $warehouseId): Collection
    {
        $products = Product::withoutGlobalScopes()
            ->select(['id', 'name', 'sku', 'description', 'purchase_price'])
            ->where('business_id', $businessId)
            ->where('track_inventory', true)
            ->where('is_active', true)
            ->where('type', '!=', 'variable')
            ->where(function ($query) use ($term): void {
                $query
                    ->where('sku', 'like', '%'.$term.'%')
                    ->orWhere('name', 'like', '%'.$term.'%')
                    ->orWhere('description', 'like', '%'.$term.'%');
            })
            ->orderBy('name')
            ->limit(8)
            ->get();

        return $products->map(function (Product $product) use ($term, $businessId, $warehouseId): array {
            [$matchType, $matchValue, $score, $exact] = $this->resolveBestMatch($term, [
                'product_sku' => $product->sku,
                'product_name' => $product->name,
                'product_description' => $product->description,
            ], 300);

            return [
                'lookup_key' => 'product:'.$product->id,
                'product_id' => $product->id,
                'variation_id' => null,
                'lot_id' => null,
                'serial_id' => null,
                'product_name' => $product->name,
                'variation_name' => null,
                'label' => $product->name,
                'sku' => $product->sku,
                'lot_number' => null,
                'serial_number' => null,
                'unit_cost' => $product->purchase_price !== null ? (string) $product->purchase_price : null,
                'ending_quantity' => $this->resolveEndingQuantity($businessId, $warehouseId, $product->id, null),
                'match_type' => $matchType,
                'match_value' => $matchValue,
                'is_exact_match' => $exact,
                'score' => $score,
            ];
        });
    }

    protected function searchVariations(string $businessId, string $term, ?string $warehouseId): Collection
    {
        $variations = ProductVariation::withoutGlobalScopes()
            ->select(['id', 'product_id', 'name', 'sku', 'purchase_price'])
            ->where('business_id', $businessId)
            ->whereHas('product', function ($query) use ($businessId, $term): void {
                $query
                    ->where('business_id', $businessId)
                    ->where('track_inventory', true)
                    ->where('is_active', true)
                    ->where(function ($nested) use ($term): void {
                        $nested
                            ->where('name', 'like', '%'.$term.'%')
                            ->orWhere('description', 'like', '%'.$term.'%');
                    });
            })
            ->orWhere(function ($query) use ($businessId, $term): void {
                $query
                    ->where('business_id', $businessId)
                    ->where(function ($nested) use ($term): void {
                        $nested
                            ->where('sku', 'like', '%'.$term.'%')
                            ->orWhere('name', 'like', '%'.$term.'%');
                    })
                    ->whereHas('product', function ($productQuery) use ($businessId): void {
                        $productQuery
                            ->where('business_id', $businessId)
                            ->where('track_inventory', true)
                            ->where('is_active', true);
                    });
            })
            ->with(['product:id,name,sku,description'])
            ->orderBy('name')
            ->limit(8)
            ->get();

        return $variations->map(function (ProductVariation $variation) use ($term, $businessId, $warehouseId): array {
            $product = $variation->product;
            [$matchType, $matchValue, $score, $exact] = $this->resolveBestMatch($term, [
                'variation_sku' => $variation->sku,
                'variation_name' => $variation->name,
                'product_name' => $product?->name,
                'product_description' => $product?->description,
            ], 200);

            return [
                'lookup_key' => 'variation:'.$variation->id,
                'product_id' => $variation->product_id,
                'variation_id' => $variation->id,
                'lot_id' => null,
                'serial_id' => null,
                'product_name' => $product?->name,
                'variation_name' => $variation->name,
                'label' => trim(($product?->name ?? 'Product').' / '.$variation->name),
                'sku' => $variation->sku ?: $product?->sku,
                'lot_number' => null,
                'serial_number' => null,
                'unit_cost' => $variation->purchase_price !== null ? (string) $variation->purchase_price : null,
                'ending_quantity' => $this->resolveEndingQuantity($businessId, $warehouseId, $variation->product_id, $variation->id),
                'match_type' => $matchType,
                'match_value' => $matchValue,
                'is_exact_match' => $exact,
                'score' => $score,
            ];
        });
    }

    protected function searchLots(string $businessId, string $term, ?string $warehouseId): Collection
    {
        if (! $warehouseId) {
            return collect();
        }

        $lots = StockLot::withoutGlobalScopes()
            ->select(['id', 'product_id', 'variation_id', 'warehouse_id', 'lot_number', 'unit_cost'])
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->where('qty_on_hand', '>', 0)
            ->where('lot_number', 'like', '%'.$term.'%')
            ->with([
                'product:id,name,sku',
                'variation:id,product_id,name,sku',
            ])
            ->orderBy('lot_number')
            ->limit(6)
            ->get();

        return $lots->map(function (StockLot $lot) use ($term, $businessId, $warehouseId): array {
            $product = $lot->product;
            $variation = $lot->variation;
            [$matchType, $matchValue, $score, $exact] = $this->resolveBestMatch($term, [
                'lot' => $lot->lot_number,
            ], 0);

            return [
                'lookup_key' => 'lot:'.$lot->id,
                'product_id' => $lot->product_id,
                'variation_id' => $lot->variation_id,
                'lot_id' => $lot->id,
                'serial_id' => null,
                'product_name' => $product?->name,
                'variation_name' => $variation?->name,
                'label' => trim(($product?->name ?? 'Product').($variation ? ' / '.$variation->name : '')),
                'sku' => $variation?->sku ?: $product?->sku,
                'lot_number' => $lot->lot_number,
                'serial_number' => null,
                'unit_cost' => $lot->unit_cost !== null ? (string) $lot->unit_cost : null,
                'ending_quantity' => $this->resolveEndingQuantity($businessId, $warehouseId, $lot->product_id, $lot->variation_id),
                'match_type' => $matchType,
                'match_value' => $matchValue,
                'is_exact_match' => $exact,
                'score' => $score,
            ];
        });
    }

    protected function searchSerials(string $businessId, string $term, ?string $warehouseId): Collection
    {
        if (! $warehouseId) {
            return collect();
        }

        $serials = StockSerial::withoutGlobalScopes()
            ->select(['id', 'product_id', 'variation_id', 'warehouse_id', 'serial_number', 'unit_cost', 'status'])
            ->where('business_id', $businessId)
            ->where('warehouse_id', $warehouseId)
            ->whereNotIn('status', ['sold', 'written_off'])
            ->where('serial_number', 'like', '%'.$term.'%')
            ->with([
                'product:id,name,sku',
                'variation:id,product_id,name,sku',
            ])
            ->orderBy('serial_number')
            ->limit(6)
            ->get();

        return $serials->map(function (StockSerial $serial) use ($term, $businessId, $warehouseId): array {
            $product = $serial->product;
            $variation = $serial->variation;
            [$matchType, $matchValue, $score, $exact] = $this->resolveBestMatch($term, [
                'serial' => $serial->serial_number,
            ], 0);

            return [
                'lookup_key' => 'serial:'.$serial->id,
                'product_id' => $serial->product_id,
                'variation_id' => $serial->variation_id,
                'lot_id' => null,
                'serial_id' => $serial->id,
                'product_name' => $product?->name,
                'variation_name' => $variation?->name,
                'label' => trim(($product?->name ?? 'Product').($variation ? ' / '.$variation->name : '')),
                'sku' => $variation?->sku ?: $product?->sku,
                'lot_number' => null,
                'serial_number' => $serial->serial_number,
                'unit_cost' => $serial->unit_cost !== null ? (string) $serial->unit_cost : null,
                'ending_quantity' => $this->resolveEndingQuantity($businessId, $warehouseId, $serial->product_id, $serial->variation_id),
                'match_type' => $matchType,
                'match_value' => $matchValue,
                'is_exact_match' => $exact,
                'score' => $score,
            ];
        });
    }

    protected function resolveBestMatch(string $term, array $candidates, int $baseScore): array
    {
        $bestType = 'match';
        $bestValue = $term;
        $bestScore = $baseScore + 99;
        $exact = false;

        foreach ($candidates as $type => $value) {
            if (! $value) {
                continue;
            }

            $candidate = Str::lower((string) $value);
            $query = Str::lower($term);

            if ($candidate === $query) {
                return [$type, (string) $value, $baseScore, true];
            }

            if (Str::startsWith($candidate, $query) && $baseScore + 10 < $bestScore) {
                $bestType = $type;
                $bestValue = (string) $value;
                $bestScore = $baseScore + 10;
            } elseif (Str::contains($candidate, $query) && $baseScore + 20 < $bestScore) {
                $bestType = $type;
                $bestValue = (string) $value;
                $bestScore = $baseScore + 20;
            }
        }

        return [$bestType, $bestValue, $bestScore, $exact];
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
        if ($user && ! $user->hasBranchAccess($warehouse->branch_id)) {
            throw new DomainException('You cannot search inventory outside your assigned branches.', 403);
        }
    }

    protected function resolveEndingQuantity(string $businessId, ?string $warehouseId, string $productId, ?string $variationId): ?string
    {
        if (! $warehouseId) {
            return null;
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

        return number_format((float) ($query->value('quantity') ?? 0), 4, '.', '');
    }
}
