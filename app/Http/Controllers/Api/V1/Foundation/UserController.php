<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreUserRequest;
use App\Http\Requests\Foundation\UpdateUserRequest;
use App\Http\Resources\Foundation\UserResource;
use App\Models\User;
use App\Services\Foundation\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends BaseApiController
{
    public function __construct(protected UserService $userService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->paginate($request->only([
            'search',
            'status',
            'role',
            'per_page',
        ]));

        return $this->paginated($users, UserResource::class);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return $this->success(new UserResource($user), 'User created successfully.', 201);
    }

    public function show(User $user): JsonResponse
    {
        return $this->success(new UserResource($user->load(['business', 'roles', 'permissions'])));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->userService->update($user, $request->validated());

        return $this->success(new UserResource($user), 'User updated successfully.');
    }

    public function destroy(User $user): JsonResponse
    {
        $this->userService->destroy($user);

        return $this->success(null, 'User deleted successfully.');
    }
}
