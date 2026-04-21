<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemLotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing('lot');

        return [
            'id' => $this->id,
            'lot_id' => $this->lot_id,
            'quantity' => $this->quantity !== null ? (string) $this->quantity : null,
            'unit_cost' => $this->unit_cost !== null ? (string) $this->unit_cost : null,
            'lot' => $this->lot ? [
                'id' => $this->lot->id,
                'lot_number' => $this->lot->lot_number,
                'status' => $this->lot->status,
                'expiry_date' => optional($this->lot->expiry_date)->toDateString(),
            ] : null,
        ];
    }
}
