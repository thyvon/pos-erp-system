<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreUserRequest;
use App\Http\Requests\Foundation\UpdateUserRequest;
use App\Http\Resources\Foundation\UserListResource;
use App\Http\Resources\Foundation\UserResource;
use App\Models\User;
use App\Services\Foundation\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseApiController
{
    public function __construct(protected UserService $userService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $users = $this->userService->paginate($request->only([
            'search',
            'status',
            'role',
            'per_page',
        ]));

        return $this->paginated($users, UserListResource::class);
    }

    public function options(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return $this->success($this->userService->accessControlOptions());
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);
        $validated = $request->validated();
        $this->authorizeBranchAccessAssignment($validated, $validated['role']);

        $user = $this->userService->create($validated, $request->user());

        return $this->success(new UserResource($user), 'User created successfully.', 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->success(new UserResource($user->load(['business', 'roles', 'permissions'])));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);
        $validated = $request->validated();
        $this->authorizeBranchAccessAssignment(
            $validated,
            $validated['role'] ?? (string) $user->getRoleNames()->first()
        );

        $user = $this->userService->update($user, $validated, $request->user());

        return $this->success(new UserResource($user), 'User updated successfully.');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->userService->destroy($user, $request->user());

        return $this->success(null, 'User deleted successfully.');
    }

    protected function authorizeBranchAccessAssignment(array $data, string $targetRole): void
    {
        $branchIds = array_values(array_filter(
            (array) ($data['branch_ids'] ?? []),
            static fn ($branchId) => filled($branchId)
        ));
        $defaultBranchId = $data['default_branch_id'] ?? null;

        if ($branchIds === [] && ! filled($defaultBranchId)) {
            return;
        }

        $this->authorize('assignBranchAccess', [User::class, $targetRole]);
    }
}
