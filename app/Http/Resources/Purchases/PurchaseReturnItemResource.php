<?php

namespace App\Http\Resources\Purchases;

use App\Http\Resources\Catalog\ProductResource;
use App\Http\Resources\Catalog\ProductVariationResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseReturnItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_return_id' => $this->purchase_return_id,
            'purchase_item_id' => $this->purchase_item_id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'total_amount' => $this->total_amount,
            'lot_id' => $this->lot_id,
            'serial_ids' => $this->serial_ids,
            'product' => new ProductResource($this->whenLoaded('product')),
            'variation' => new ProductVariationResource($this->whenLoaded('variation')),
            'lot' => $this->whenLoaded('lot'),
        ];
    }
}
