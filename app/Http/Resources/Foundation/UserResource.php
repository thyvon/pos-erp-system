<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['business', 'roles', 'permissions']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim(($this->first_name ?? '').' '.($this->last_name ?? '')),
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'status' => $this->status,
            'max_discount' => $this->max_discount,
            'commission_percentage' => $this->commission_percentage,
            'sales_target_amount' => $this->sales_target_amount,
            'last_login_at' => $this->last_login_at,
            'preferences' => $this->preferences,
            'business' => $this->whenLoaded('business', fn () => [
                'id' => $this->business?->id,
                'name' => $this->business?->name,
                'legal_name' => $this->business?->legal_name,
                'email' => $this->business?->email,
                'status' => $this->business?->status,
                'currency' => $this->business?->currency,
                'timezone' => $this->business?->timezone,
                'locale' => $this->business?->locale,
            ]),
            'roles' => $this->getRoleNames()->values(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
