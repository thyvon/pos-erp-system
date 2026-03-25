<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaxGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['taxRates']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'tax_rate_count' => $this->taxRates->count(),
            'tax_rate_ids' => $this->taxRates->pluck('id')->values()->all(),
            'tax_rates' => $this->taxRates->map(fn ($taxRate) => [
                'id' => $taxRate->id,
                'name' => $taxRate->name,
                'type' => $taxRate->type,
                'rate' => (float) $taxRate->rate,
            ])->values()->all(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
