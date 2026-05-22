<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeRateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'from_currency' => $this->from_currency,
            'to_currency' => $this->to_currency,
            'rate' => $this->rate !== null ? (string) $this->rate : null,
            'effective_date' => optional($this->effective_date)->toDateString(),
            'is_default' => (bool) $this->is_default,
            'note' => $this->note,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
