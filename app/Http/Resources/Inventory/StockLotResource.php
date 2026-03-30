<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockLotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['product', 'variation', 'warehouse.branch', 'supplier']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'product_id' => $this->product_id,
            'variation_id' => $this->variation_id,
            'warehouse_id' => $this->warehouse_id,
            'supplier_id' => $this->supplier_id,
            'lot_number' => $this->lot_number,
            'manufacture_date' => optional($this->manufacture_date)->toDateString(),
            'expiry_date' => optional($this->expiry_date)->toDateString(),
            'received_at' => $this->received_at,
            'unit_cost' => $this->unit_cost,
            'qty_received' => $this->qty_received,
            'qty_on_hand' => $this->qty_on_hand,
            'qty_reserved' => $this->qty_reserved,
            'qty_available' => $this->qty_available,
            'status' => $this->status,
            'notes' => $this->notes,
            'product' => $this->product ? [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
            ] : null,
            'variation' => $this->variation ? [
                'id' => $this->variation->id,
                'name' => $this->variation->name,
                'sku' => $this->variation->sku,
            ] : null,
            'warehouse' => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
                'branch_id' => $this->warehouse->branch_id,
                'branch_name' => $this->warehouse->branch?->name,
            ] : null,
            'supplier' => $this->supplier ? [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
