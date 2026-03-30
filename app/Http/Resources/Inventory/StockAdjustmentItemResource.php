<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockAdjustmentItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['product', 'variation']);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'lot_id' => $this->lot_id,
            'serial_id' => $this->serial_id,
            'direction' => $this->direction,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'notes' => $this->notes,
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
