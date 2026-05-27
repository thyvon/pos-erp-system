<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CambodiaAddressDivisionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->code,
            'name_en' => $this->name_en ?? '',
            'name_km' => $this->name_km ?? '',
            'province_id' => $this->province_id,
            'district_id' => $this->district_id,
            'commune_id' => $this->commune_id,
            'type' => $this->type,
            'parent_code' => $this->parent_code,
            'synced_at' => $this->synced_at,
        ];
    }
}
