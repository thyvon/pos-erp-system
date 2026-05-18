<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockCountEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['product', 'variation', 'stockCountItem.lot', 'creator']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'stock_count_id' => $this->stock_count_id,
            'stock_count_item_id' => $this->stock_count_item_id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'quantity' => $this->quantity,
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
            'lot' => $this->stockCountItem?->lot ? [
                'id' => $this->stockCountItem->lot->id,
                'lot_number' => $this->stockCountItem->lot->lot_number,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
