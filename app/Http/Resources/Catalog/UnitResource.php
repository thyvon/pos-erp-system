<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'short_name' => $this->short_name,
            'allow_decimal' => (bool) $this->allow_decimal,
            'sub_units_count' => (int) ($this->sub_units_count ?? 0),
            'sub_units' => SubUnitResource::collection($this->whenLoaded('subUnits')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
