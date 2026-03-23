<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ManagedBusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'legal_name' => $this->legal_name,
            'tax_id' => $this->tax_id,
            'email' => $this->email,
            'phone' => $this->phone,
            'currency' => $this->currency,
            'timezone' => $this->timezone,
            'country' => $this->country,
            'locale' => $this->locale,
            'logo_url' => $this->logo_url,
            'tier' => $this->tier,
            'status' => $this->status,
            'max_users' => $this->max_users,
            'max_branches' => $this->max_branches,
            'address' => $this->address,
            'financial_year' => $this->financial_year,
            'usage' => [
                'users_count' => (int) ($this->users_count ?? 0),
                'branches_count' => (int) ($this->branches_count ?? 0),
                'warehouses_count' => (int) ($this->warehouses_count ?? 0),
            ],
            'owner' => $this->when($this->relationLoaded('users') && $this->users->isNotEmpty(), function () {
                $owner = $this->users->first();

                return [
                    'id' => $owner?->id,
                    'full_name' => trim(($owner?->first_name ?? '').' '.($owner?->last_name ?? '')),
                    'email' => $owner?->email,
                    'phone' => $owner?->phone,
                    'status' => $owner?->status,
                ];
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
