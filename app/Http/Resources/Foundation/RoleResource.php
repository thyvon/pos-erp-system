<?php

namespace App\Http\Resources\Foundation;

use App\Models\User;
use App\Services\Foundation\RoleService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing('permissions');
        $modelHasRolesTable = config('permission.table_names.model_has_roles', 'model_has_roles');
        $businessId = $request->user()?->business_id;

        $usersCountQuery = DB::table($modelHasRolesTable)
            ->join('users', 'users.id', '=', "{$modelHasRolesTable}.model_id")
            ->where("{$modelHasRolesTable}.role_id", $this->id)
            ->where("{$modelHasRolesTable}.model_type", User::class);

        if ($businessId !== null) {
            $usersCountQuery->where('users.business_id', $businessId);
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'permissions' => $this->permissions->pluck('name')->values(),
            'permissions_count' => $this->permissions->count(),
            'users_count' => $this->users_count ?? $usersCountQuery->count(),
            'is_protected' => in_array($this->name, RoleService::protectedRoleNames(), true),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
