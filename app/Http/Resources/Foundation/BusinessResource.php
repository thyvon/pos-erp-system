<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $usersCount = (int) ($this->users_count ?? 0);
        $branchesCount = (int) ($this->branches_count ?? 0);
        $warehousesCount = (int) ($this->warehouses_count ?? 0);

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
                'users_count' => $usersCount,
                'branches_count' => $branchesCount,
                'warehouses_count' => $warehousesCount,
                'remaining_users' => max(0, (int) $this->max_users - $usersCount),
                'remaining_branches' => max(0, (int) $this->max_branches - $branchesCount),
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
