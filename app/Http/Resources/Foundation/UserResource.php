<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'default_branch_id' => $this->default_branch_id,
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
            'locale' => data_get($this->preferences, 'locale') ?? $this->business?->locale ?? config('app.locale'),
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
            'direct_permissions' => $this->permissions->pluck('name')->values(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
            /*
             * Scoped roles get [{ id, name }]; admin and super_admin get [] (load all branches via API).
             * Kept alongside full `branches` for existing UI (user forms, branch picker metadata).
             */
            'allowed_branches' => $this->resolveAllowedBranches(),
            'branches' => $this->branches->map(fn ($branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'is_default' => $branch->is_default,
                'is_active' => $branch->is_active,
            ])->values(),
            'branch_ids' => $this->branches->modelKeys(),
            'default_branch' => $this->defaultBranch ? [
                'id' => $this->defaultBranch->id,
                'name' => $this->defaultBranch->name,
                'code' => $this->defaultBranch->code,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * @return list<array{id: string, name: string}>
     */
    protected function resolveAllowedBranches(): array
    {
        if ($this->resource->hasAnyRole(['super_admin', 'admin'])) {
            return [];
        }

        return $this->resource->branches
            ->map(fn ($branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
            ])
            ->values()
            ->all();
    }
}
