<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['branch']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'code' => $this->code,
            'type' => $this->type,
            'is_active' => $this->is_active,
            'is_default' => $this->is_default,
            'allow_negative_stock' => $this->allow_negative_stock,
            'branch' => $this->whenLoaded('branch', fn () => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'code' => $this->branch->code,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
