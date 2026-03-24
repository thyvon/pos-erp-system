<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'default_branch_id' => $this->default_branch_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim(($this->first_name ?? '').' '.($this->last_name ?? '')),
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'max_discount' => $this->max_discount,
            'commission_percentage' => $this->commission_percentage,
            'sales_target_amount' => $this->sales_target_amount,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')->values(), []),
            'direct_permissions' => $this->whenLoaded('permissions', fn () => $this->permissions->pluck('name')->values(), []),
            'branches' => $this->whenLoaded('branches', fn () => $this->branches->map(fn ($branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_default' => $branch->is_default,
                'is_active' => $branch->is_active,
            ])->values(), []),
            'branch_ids' => $this->whenLoaded('branches', fn () => $this->branches->modelKeys(), []),
            'default_branch' => $this->whenLoaded('defaultBranch', fn () => $this->defaultBranch ? [
                'id' => $this->defaultBranch->id,
                'name' => $this->defaultBranch->name,
                'code' => $this->defaultBranch->code,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
