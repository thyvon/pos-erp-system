<?php

namespace App\Services\Auth;

use App\Exceptions\Domain\DomainException;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(protected AuditService $auditService)
    {
    }

    public function authenticate(string $email, string $password): User
    {
        /** @var User|null $user */
        $user = User::query()
            ->with('business')
            ->where('email', $email)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            if ($user) {
                $this->auditService->log(
                    'login_failed',
                    User::class,
                    $user->id,
                    $user,
                    $user->business_id,
                    null,
                    ['email' => $email]
                );
            }

            throw new DomainException(__('Invalid credentials.'), 401);
        }

        if ($user->status !== 'active') {
            throw new DomainException(__('This user account is not active.'), 403);
        }

        if (! $user->hasRole('super_admin') && $user->business?->status !== 'active') {
            throw new DomainException(__('This business is not active.'), 403);
        }

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        $this->auditService->log(
            'login',
            User::class,
            $user->id,
            $user,
            $user->business_id
        );

        return $user->fresh(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);
    }

    public function logout(?User $user): void
    {
        if (! $user) {
            return;
        }

        $this->auditService->log(
            'logout',
            User::class,
            $user->id,
            $user,
            $user->business_id
        );
    }

    public function updatePassword(User $user, string $currentPassword, string $newPassword): User
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => $newPassword,
        ])->save();

        $this->auditService->log(
            'password_changed',
            User::class,
            $user->id,
            $user,
            $user->business_id
        );

        return $user->fresh(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);
    }

    public function updatePreferences(User $user, array $preferences): User
    {
        $user->forceFill([
            'preferences' => $preferences,
        ])->save();

        return $user->fresh(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);
    }

    public function recordPasswordReset(?User $user): void
    {
        if (! $user) {
            return;
        }

        $this->auditService->log(
            'password_reset',
            User::class,
            $user->id,
            $user,
            $user->business_id
        );
    }
}
