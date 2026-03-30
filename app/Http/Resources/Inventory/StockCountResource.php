<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockCountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['warehouse.branch', 'creator', 'completer', 'items.product', 'items.variation']);
        $discrepancyCount = $this->items
            ->filter(fn ($item) => $item->counted_quantity !== null && (float) ($item->difference ?? 0) !== 0.0)
            ->count();

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'warehouse_id' => $this->warehouse_id,
            'reference_no' => $this->reference_no,
            'status' => $this->status,
            'date' => optional($this->date)->toDateString(),
            'notes' => $this->notes,
            'discrepancy_count' => $discrepancyCount,
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
            'completer' => $this->completer ? [
                'id' => $this->completer->id,
                'name' => trim($this->completer->first_name.' '.$this->completer->last_name),
            ] : null,
            'items' => StockCountItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
