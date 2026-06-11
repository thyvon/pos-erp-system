<?php

namespace App\Http\Resources\Purchases;

use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseReceiveResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'purchase_id' => $this->purchase_id,
            'receive_number' => $this->receive_number,
            'received_at' => $this->received_at?->toISOString(),
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim(($this->creator->first_name ?? '') . ' ' . ($this->creator->last_name ?? '')),
            ] : null),
            'items' => PurchaseReceiveItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->when($this->items_count !== null, $this->items_count),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
