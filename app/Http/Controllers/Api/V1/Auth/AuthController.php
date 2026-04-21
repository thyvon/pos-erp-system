<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Models\User;
use App\Services\Auth\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Foundation\UserResource;

class AuthController extends BaseApiController
{
    public function __construct(protected AuthService $authService)
    {
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = $this->authService->authenticate($validated['email'], $validated['password']);

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user' => new UserResource($user->fresh(['business', 'roles', 'permissions', 'branches', 'defaultBranch'])),
        ], __('Login successful.'));
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $request->user()?->currentAccessToken()?->delete();

        $this->authService->logout($user);

        return $this->success(null, __('Logout successful.'));
    }

    public function me(Request $request)
    {
        return $this->success(
            new UserResource($request->user()->load(['business', 'roles', 'permissions', 'branches', 'defaultBranch']))
        );
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        $user = $this->authService->updatePassword(
            $request->user(),
            $validated['current_password'],
            $validated['new_password']
        );

        return $this->success(new UserResource($user), __('Password updated successfully.'));
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'locale' => ['required', 'in:en,km'],
        ]);

        $user = $request->user();
        $preferences = $user->preferences ?? [];
        $preferences['locale'] = $validated['locale'];

        $user = $this->authService->updatePreferences($user, $preferences);

        return $this->success(
            new UserResource($user),
            __('Language updated successfully.')
        );
    }

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink([
            'email' => $validated['email'],
        ]);

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error(__($status), 400);
        }

        return $this->success(null, __($status));
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error(__($status), 400);
        }

        $this->authService->recordPasswordReset(
            User::query()->where('email', $validated['email'])->first()
        );

        return $this->success(null, __($status));
    }
}
