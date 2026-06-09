<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockOpeningBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['warehouse.branch', 'creator', 'items.product', 'items.variation', 'items.lot', 'items.serial']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'warehouse_id' => $this->warehouse_id,
            'reference_no' => $this->reference_no,
            'date' => $this->date,
            'notes' => $this->notes,
            'warehouse' => $this->warehouse ? [
                'id' => $this->warehouse->id,
                'name' => $this->warehouse->name,
                'branch_id' => $this->warehouse->branch_id,
                'branch_name' => $this->warehouse->branch?->name,
            ] : null,
            'creator' => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim(($this->creator->first_name ?? '').' '.($this->creator->last_name ?? '')) ?: $this->creator->email,
            ] : null,
            'items' => StockOpeningBalanceItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
