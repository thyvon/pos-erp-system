<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['sale', 'branch', 'warehouse', 'creator', 'items.saleItem.product', 'items.saleItem.variation', 'items.lot']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'sale_id' => $this->sale_id,
            'branch_id' => $this->branch_id,
            'warehouse_id' => $this->warehouse_id,
            'return_number' => $this->return_number,
            'status' => $this->status,
            'return_date' => optional($this->return_date)->toDateString(),
            'total_amount' => $this->total_amount !== null ? (string) $this->total_amount : null,
            'refund_method' => $this->refund_method,
            'notes' => $this->notes,
            'sale' => $this->sale ? [
                'id' => $this->sale->id,
                'sale_number' => $this->sale->sale_number,
                'status' => $this->sale->status,
            ] : null,
            'branch' => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'code' => $this->branch->code,
            ] : null,
            'warehouse' => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
                'code' => $this->warehouse->code,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'items_count' => (int) ($this->items_count ?? $this->items->count()),
            'items' => SaleReturnItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
