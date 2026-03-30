<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class ProductVariationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'product_id' => $this->product_id,
            'name' => $this->name,
            'variation_value_ids' => array_values($this->variation_value_ids ?? []),
            'sku' => $this->sku,
            'image_url' => $this->primaryImage?->publicUrl(),
            'sub_unit_id' => $this->sub_unit_id,
            'conversion_unit' => $this->whenLoaded('subUnit', fn () => $this->subUnit ? $this->subUnit->name : null, null),
            'conversion_factor' => $this->whenLoaded('subUnit', fn () => $this->subUnit && $this->subUnit->conversion_factor !== null ? (string) $this->subUnit->conversion_factor : '1.0000', '1.0000'),
            'selling_price' => $this->selling_price !== null ? (string) $this->selling_price : null,
            'purchase_price' => $this->purchase_price !== null ? (string) $this->purchase_price : null,
            'sub_unit_selling_price' => $this->sub_unit_selling_price !== null ? (string) $this->sub_unit_selling_price : null,
            'sub_unit_purchase_price' => $this->sub_unit_purchase_price !== null ? (string) $this->sub_unit_purchase_price : null,
            'minimum_selling_price' => $this->minimum_selling_price !== null ? (string) $this->minimum_selling_price : null,
            'profit_margin' => $this->profit_margin !== null ? (string) $this->profit_margin : null,
            'is_active' => (bool) $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
