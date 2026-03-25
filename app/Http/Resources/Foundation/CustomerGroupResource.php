<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing('priceGroup');

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'discount' => (float) $this->discount,
            'price_group_id' => $this->price_group_id,
            'price_group' => $this->priceGroup ? [
                'id' => $this->priceGroup->id,
                'name' => $this->priceGroup->name,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
