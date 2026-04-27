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
            'tax_rate_id' => $this->tax_rate_id,
            'name' => $this->name,
            'sku' => $this->sku,
            'image_url' => $this->primaryImage?->publicUrl(),
            'sub_unit_id' => $this->sub_unit_id,
            'conversion_unit' => $this->whenLoaded('subUnit', fn () => $this->subUnit ? $this->subUnit->name : null, null),
            'conversion_factor' => $this->whenLoaded('subUnit', fn () => $this->subUnit && $this->subUnit->conversion_factor !== null ? (string) $this->subUnit->conversion_factor : '1.0000', '1.0000'),
            'type' => $this->type,
            'stock_tracking' => $this->stock_tracking,
            'selling_price' => $this->selling_price !== null ? (string) $this->selling_price : null,
            'purchase_price' => $this->purchase_price !== null ? (string) $this->purchase_price : null,
            'sub_unit_selling_price' => $this->sub_unit_selling_price !== null ? (string) $this->sub_unit_selling_price : null,
            'sub_unit_purchase_price' => $this->sub_unit_purchase_price !== null ? (string) $this->sub_unit_purchase_price : null,
            'minimum_selling_price' => $this->minimum_selling_price !== null ? (string) $this->minimum_selling_price : null,
            'track_inventory' => (bool) $this->track_inventory,
            'tax_type' => $this->tax_type,
            'is_for_selling' => (bool) $this->is_for_selling,
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
            'unit' => $this->whenLoaded('unit', fn () => $this->unit ? [
                'id' => $this->unit->id,
                'name' => $this->unit->name,
                'short_name' => $this->unit->short_name,
            ] : null),
            'sub_unit' => $this->whenLoaded('subUnit', fn () => $this->subUnit ? [
                'id' => $this->subUnit->id,
                'name' => $this->subUnit->name,
                'short_name' => $this->subUnit->short_name,
                'conversion_factor' => $this->subUnit->conversion_factor !== null ? (string) $this->subUnit->conversion_factor : null,
            ] : null),
            'tax_rate' => $this->whenLoaded('taxRate', fn () => $this->taxRate ? [
                'id' => $this->taxRate->id,
                'name' => $this->taxRate->name,
                'rate' => $this->taxRate->rate !== null ? (string) $this->taxRate->rate : null,
                'type' => $this->taxRate->type,
            ] : null),
        ];
    }
}
