<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockOpeningBalanceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['product', 'variation', 'lot', 'serial']);

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'lot_id' => $this->lot_id,
            'serial_id' => $this->serial_id,
            'quantity' => $this->quantity,
            'unit_cost' => $this->unit_cost,
            'lot_number' => $this->lot_number,
            'manufacture_date' => $this->manufacture_date,
            'expiry_date' => $this->expiry_date,
            'serial_number' => $this->serial_number,
            'warranty_expires' => $this->warranty_expires,
            'notes' => $this->notes,
            'product' => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'stock_tracking' => $this->product->stock_tracking,
            ] : null,
            'variation' => $this->variation ? [
                'id' => $this->variation->id,
                'name' => $this->variation->name,
                'sku' => $this->variation->sku,
            ] : null,
            'lot' => $this->lot ? [
                'id' => $this->lot->id,
                'lot_number' => $this->lot->lot_number,
            ] : null,
            'serial' => $this->serial ? [
                'id' => $this->serial->id,
                'serial_number' => $this->serial->serial_number,
            ] : null,
        ];
    }
}
