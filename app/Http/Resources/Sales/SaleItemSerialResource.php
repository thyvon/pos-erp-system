<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemSerialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing('serial');

        return [
            'id' => $this->id,
            'serial_id' => $this->serial_id,
            'serial' => $this->serial ? [
                'id' => $this->serial->id,
                'serial_number' => $this->serial->serial_number,
                'status' => $this->serial->status,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
