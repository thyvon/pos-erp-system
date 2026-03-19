<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['manager']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'code' => $this->code,
            'type' => $this->type,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'is_default' => $this->is_default,
            'is_active' => $this->is_active,
            'business_hours' => $this->business_hours,
            'invoice_settings' => $this->invoice_settings,
            'manager' => $this->whenLoaded('manager', fn () => $this->manager ? [
                'id' => $this->manager->id,
                'first_name' => $this->manager->first_name,
                'last_name' => $this->manager->last_name,
                'email' => $this->manager->email,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
