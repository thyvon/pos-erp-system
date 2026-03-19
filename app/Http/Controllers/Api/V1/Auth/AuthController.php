<?php

namespace App\Http\Controllers\Api\V1\Auth;

use Throwable;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Foundation\UserResource;

class AuthController extends BaseApiController
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->with('business')
            ->where('email', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->error('Invalid credentials.', 401);
        }

        if ($user->status !== 'active') {
            return $this->error('This user account is not active.', 403);
        }

        if ($user->business?->status !== 'active') {
            return $this->error('This business is not active.', 403);
        }

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        $this->writeAuditLog($user, 'login');

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user' => new UserResource($user->fresh(['business', 'roles', 'permissions'])),
        ], 'Login successful.');
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        $request->user()?->currentAccessToken()?->delete();

        if ($user) {
            $this->writeAuditLog($user, 'logout');
        }

        return $this->success(null, 'Logout successful.');
    }

    public function me(Request $request)
    {
        return $this->success(
            new UserResource($request->user()->load(['business', 'roles', 'permissions']))
        );
    }

    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => $validated['new_password'],
        ])->save();

        return $this->success(new UserResource($user->load(['business', 'roles', 'permissions'])), 'Password updated successfully.');
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

        return $this->success(null, __($status));
    }

    protected function writeAuditLog(User $user, string $event): void
    {
        try {
            if (! Schema::hasTable('audit_logs')) {
                return;
            }

            DB::table('audit_logs')->insert([
                'id' => (string) Str::uuid(),
                'business_id' => $user->business_id,
                'user_id' => $user->id,
                'event' => $event,
                'auditable_type' => User::class,
                'auditable_id' => $user->id,
                'old_values' => null,
                'new_values' => null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created_at' => now(),
            ]);
        } catch (Throwable) {
            // Do not block authentication on audit log write failures during setup.
        }
    }
}
