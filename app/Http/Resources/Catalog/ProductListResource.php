<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class ProductListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'brand_id' => $this->brand_id,
            'name' => $this->name,
            'sku' => $this->sku,
            'image_url' => $this->primaryImage?->publicUrl(),
            'conversion_sub_unit_id' => $this->conversion_sub_unit_id,
            'conversion_unit' => $this->whenLoaded('conversionSubUnit', fn () => $this->conversionSubUnit ? $this->conversionSubUnit->name : null, null),
            'conversion_factor' => $this->whenLoaded('conversionSubUnit', fn () => $this->conversionSubUnit && $this->conversionSubUnit->conversion_factor !== null ? (string) $this->conversionSubUnit->conversion_factor : '1.0000', '1.0000'),
            'type' => $this->type,
            'stock_tracking' => $this->stock_tracking,
            'selling_price' => $this->selling_price !== null ? (string) $this->selling_price : null,
            'purchase_price' => $this->purchase_price !== null ? (string) $this->purchase_price : null,
            'sub_unit_selling_price' => $this->sub_unit_selling_price !== null ? (string) $this->sub_unit_selling_price : null,
            'sub_unit_purchase_price' => $this->sub_unit_purchase_price !== null ? (string) $this->sub_unit_purchase_price : null,
            'track_inventory' => (bool) $this->track_inventory,
            'is_active' => (bool) $this->is_active,
            'variations_count' => (int) ($this->variations_count ?? 0),
            'combo_items_count' => (int) ($this->combo_items_count ?? 0),
            'variable_selling_price_min' => $this->variable_selling_price_min !== null ? (string) $this->variable_selling_price_min : null,
            'variable_selling_price_max' => $this->variable_selling_price_max !== null ? (string) $this->variable_selling_price_max : null,
            'variable_purchase_price_min' => $this->variable_purchase_price_min !== null ? (string) $this->variable_purchase_price_min : null,
            'variable_purchase_price_max' => $this->variable_purchase_price_max !== null ? (string) $this->variable_purchase_price_max : null,
            'category' => $this->whenLoaded('category', fn () => $this->category ? [
                'id' => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
            ] : null),
        ];
    }
}
