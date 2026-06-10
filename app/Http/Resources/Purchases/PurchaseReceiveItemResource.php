<?php

namespace App\Http\Resources\Purchases;

use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseReceiveItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'purchase_receive_id' => $this->purchase_receive_id,
            'purchase_item_id' => $this->purchase_item_id,
            'quantity' => (float) $this->quantity,
            'lot_number' => $this->lot_number,
            'manufacture_date' => $this->manufacture_date?->toDateString(),
            'expiry_date' => $this->expiry_date?->toDateString(),
            'warranty_expires' => $this->warranty_expires?->toDateString(),
            'serial_numbers' => $this->serial_numbers,
            'notes' => $this->notes,
        ];
    }
}
