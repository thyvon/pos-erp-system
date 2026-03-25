<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComboItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'product_id' => $this->product_id,
            'child_product_id' => $this->child_product_id,
            'child_variation_id' => $this->child_variation_id,
            'quantity' => $this->quantity !== null ? (string) $this->quantity : null,
            'child_product' => $this->whenLoaded('childProduct', fn () => $this->childProduct ? [
                'id' => $this->childProduct->id,
                'name' => $this->childProduct->name,
                'sku' => $this->childProduct->sku,
                'type' => $this->childProduct->type,
            ] : null),
            'child_variation' => $this->whenLoaded('childVariation', fn () => $this->childVariation ? [
                'id' => $this->childVariation->id,
                'name' => $this->childVariation->name,
                'sku' => $this->childVariation->sku,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
