<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubUnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'parent_unit_id' => $this->parent_unit_id,
            'name' => $this->name,
            'short_name' => $this->short_name,
            'conversion_factor' => (string) $this->conversion_factor,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
