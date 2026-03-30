<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['warehouse.branch', 'creator', 'items.product', 'items.variation']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'warehouse_id' => $this->warehouse_id,
            'reference_no' => $this->reference_no,
            'date' => optional($this->date)->toDateString(),
            'reason' => $this->reason,
            'notes' => $this->notes,
            'warehouse' => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
                'branch_id' => $this->warehouse->branch_id,
                'branch_name' => $this->warehouse->branch?->name,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim($this->creator->first_name.' '.$this->creator->last_name),
            ] : null,
            'items' => StockAdjustmentItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
