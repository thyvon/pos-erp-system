<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleReturnItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['saleItem.product', 'saleItem.variation', 'lot']);

        return [
            'id' => $this->id,
            'sale_return_id' => $this->sale_return_id,
            'sale_item_id' => $this->sale_item_id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'quantity' => $this->quantity !== null ? (string) $this->quantity : null,
            'unit_price' => $this->unit_price !== null ? (string) $this->unit_price : null,
            'unit_cost' => $this->unit_cost !== null ? (string) $this->unit_cost : null,
            'total_amount' => $this->total_amount !== null ? (string) $this->total_amount : null,
            'serial_ids' => $this->serial_ids,
            'product' => $this->saleItem?->product ? [
                'id' => $this->saleItem->product->id,
                'name' => $this->saleItem->product->name,
            ] : null,
            'variation' => $this->saleItem?->variation ? [
                'id' => $this->saleItem->variation->id,
                'name' => $this->saleItem->variation->name,
            ] : null,
            'lot' => $this->lot ? [
                'id' => $this->lot->id,
                'lot_number' => $this->lot->lot_number,
            ] : null,
        ];
    }
}
