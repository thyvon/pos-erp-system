<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockCountItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['product', 'variation']);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'system_quantity' => $this->system_quantity,
            'counted_quantity' => $this->counted_quantity,
            'difference' => $this->difference,
            'unit_cost' => $this->unit_cost,
            'product' => $this->whenLoaded('product', fn () => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ] : null),
            'variation' => $this->whenLoaded('variation', fn () => $this->variation ? [
                'id' => $this->variation->id,
                'name' => $this->variation->name,
                'sku' => $this->variation->sku,
            ] : null),
        ];
    }
}
