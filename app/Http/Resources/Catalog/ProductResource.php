<?php

namespace App\Http\Resources\Catalog;

use App\Http\Resources\Foundation\TaxRateResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'category_id' => $this->category_id,
            'brand_id' => $this->brand_id,
            'unit_id' => $this->unit_id,
            'sub_unit_id' => $this->sub_unit_id,
            'tax_rate_id' => $this->tax_rate_id,
            'rack_location_id' => $this->rack_location_id,
            'variation_template_id' => $this->variation_template_id,
            'variation_template_ids' => array_values($this->variation_template_ids ?? array_filter([$this->variation_template_id])),
            'price_group_id' => $this->price_group_id,
            'name' => $this->name,
            'description' => $this->description,
            'sku' => $this->sku,
            'barcode_type' => $this->barcode_type,
            'conversion_unit' => $this->whenLoaded('subUnit', fn () => $this->subUnit ? $this->subUnit->name : null, null),
            'conversion_factor' => $this->whenLoaded('subUnit', fn () => $this->subUnit && $this->subUnit->conversion_factor !== null ? (string) $this->subUnit->conversion_factor : '1.0000', '1.0000'),
            'type' => $this->type,
            'stock_tracking' => $this->stock_tracking,
            'has_expiry' => (bool) $this->has_expiry,
            'selling_price' => $this->selling_price !== null ? (string) $this->selling_price : null,
            'purchase_price' => $this->purchase_price !== null ? (string) $this->purchase_price : null,
            'sub_unit_selling_price' => $this->sub_unit_selling_price !== null ? (string) $this->sub_unit_selling_price : null,
            'sub_unit_purchase_price' => $this->sub_unit_purchase_price !== null ? (string) $this->sub_unit_purchase_price : null,
            'minimum_selling_price' => $this->minimum_selling_price !== null ? (string) $this->minimum_selling_price : null,
            'profit_margin' => $this->profit_margin !== null ? (string) $this->profit_margin : null,
            'tax_type' => $this->tax_type,
            'track_inventory' => (bool) $this->track_inventory,
            'alert_quantity' => $this->alert_quantity !== null ? (string) $this->alert_quantity : null,
            'max_stock_level' => $this->max_stock_level !== null ? (string) $this->max_stock_level : null,
            'is_for_selling' => (bool) $this->is_for_selling,
            'is_active' => (bool) $this->is_active,
            'weight' => $this->weight !== null ? (string) $this->weight : null,
            'image_url' => $this->primaryImage?->publicUrl(),
            'custom_fields' => $this->custom_fields ?? [],
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
            'tax_rate' => $this->whenLoaded('taxRate', fn () => $this->taxRate ? new TaxRateResource($this->taxRate) : null),
            'rack_location' => $this->whenLoaded('rackLocation', fn () => $this->rackLocation ? [
                'id' => $this->rackLocation->id,
                'name' => $this->rackLocation->name,
                'code' => $this->rackLocation->code,
                'warehouse' => $this->rackLocation->relationLoaded('warehouse') && $this->rackLocation->warehouse ? [
                    'id' => $this->rackLocation->warehouse->id,
                    'name' => $this->rackLocation->warehouse->name,
                ] : null,
            ] : null),
            'variation_template' => $this->whenLoaded('variationTemplate', fn () => $this->variationTemplate ? new VariationTemplateResource($this->variationTemplate) : null),
            'price_group' => $this->whenLoaded('priceGroup', fn () => $this->priceGroup ? [
                'id' => $this->priceGroup->id,
                'name' => $this->priceGroup->name,
                'is_default' => (bool) $this->priceGroup->is_default,
            ] : null),
            'variations' => ProductVariationResource::collection($this->whenLoaded('variations')),
            'combo_items' => ComboItemResource::collection($this->whenLoaded('comboItems')),
            'variations_count' => (int) ($this->variations_count ?? 0),
            'combo_items_count' => (int) ($this->combo_items_count ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
