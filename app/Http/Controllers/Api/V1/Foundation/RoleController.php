<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreRoleRequest;
use App\Http\Requests\Foundation\UpdateRoleRequest;
use App\Http\Resources\Foundation\RoleResource;
use App\Services\Foundation\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends BaseApiController
{
    public function __construct(protected RoleService $roleService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = $this->roleService->paginate($request->only([
            'search',
            'per_page',
        ]));

        return $this->paginated($roles, RoleResource::class);
    }

    public function options(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        return $this->success($this->roleService->options());
    }

    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        return $this->success(new RoleResource($role->load('permissions')));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $this->authorize('create', Role::class);

        $role = $this->roleService->create($request->validated());

        return $this->success(new RoleResource($role), 'Role created successfully.', 201);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $this->authorize('update', $role);

        $role = $this->roleService->update($role, $request->validated());

        return $this->success(new RoleResource($role), 'Role updated successfully.');
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        $this->roleService->delete($role);

        return $this->success(null, 'Role deleted successfully.');
    }
}
