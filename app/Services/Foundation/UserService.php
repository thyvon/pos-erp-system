<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Jobs\Foundation\SendUserInviteJob;
use App\Models\Business;
use App\Models\User;
use App\Repositories\Foundation\UserRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(protected UserRepository $users)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->users->paginateFiltered($filters);
    }

    public function create(array $data): User
    {
        $role = $data['role'];
        unset($data['role']);

        $business = $this->resolveBusiness();
        $this->ensureUserLimitNotExceeded($business);

        $data['business_id'] = $data['business_id'] ?? $business->id;
        $data['password'] = Hash::make($data['password']);

        $user = DB::transaction(function () use ($data, $role): User {
            /** @var User $user */
            $user = $this->users->create($data);
            $user->assignRole($role);

            return $user->load(['business', 'roles', 'permissions']);
        });

        SendUserInviteJob::dispatch($user);

        return $user;
    }

    public function update(User $user, array $data): User
    {
        $role = $data['role'] ?? null;
        unset($data['role']);

        if (($data['status'] ?? null) !== null && $data['status'] !== 'active') {
            $this->ensureNotLastAdmin($user, $role, $data['status']);
        }

        if (array_key_exists('password', $data) && filled($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return DB::transaction(function () use ($user, $data, $role): User {
            /** @var User $updatedUser */
            $updatedUser = $this->users->update($user, $data);

            if ($role !== null) {
                $this->ensureNotLastAdmin($updatedUser, $role, $updatedUser->status);
                $updatedUser->syncRoles([$role]);
            }

            return $updatedUser->load(['business', 'roles', 'permissions']);
        });
    }

    public function invite(string $email, string $role): User
    {
        if ($this->users->findByEmail($email) !== null) {
            throw new DomainException('A user with this email already exists.', 422);
        }

        return $this->create([
            'first_name' => 'Invited',
            'last_name' => 'User',
            'email' => $email,
            'password' => Str::password(16),
            'status' => 'inactive',
            'role' => $role,
        ]);
    }

    public function deactivate(User $user): User
    {
        if ((string) auth()->id() === (string) $user->id) {
            throw new DomainException('You cannot deactivate your own account.', 422);
        }

        $this->ensureNotLastAdmin($user, null, 'inactive');

        return $this->update($user, ['status' => 'inactive']);
    }

    public function destroy(User $user): void
    {
        if ((string) auth()->id() === (string) $user->id) {
            throw new DomainException('You cannot delete your own account.', 422);
        }

        $this->ensureNotLastAdmin($user, null, 'inactive');

        DB::transaction(function () use ($user): void {
            $user->forceFill(['status' => 'inactive'])->save();
            $this->users->delete($user);
        });
    }

    protected function resolveBusiness(): Business
    {
        $business = app()->bound('tenant')
            ? app('tenant')
            : auth()->user()?->business;

        if (! $business instanceof Business) {
            throw new DomainException('Tenant context is required to manage users.', 422);
        }

        return $business;
    }

    protected function ensureUserLimitNotExceeded(Business $business): void
    {
        if (User::query()->count() >= $business->max_users) {
            throw new DomainException('Your business user limit has been reached.', 403);
        }
    }

    protected function ensureNotLastAdmin(User $user, ?string $nextRole = null, ?string $nextStatus = null): void
    {
        if (! $user->hasRole('admin')) {
            return;
        }

        $finalRole = $nextRole ?? $user->getRoleNames()->first();
        $finalStatus = $nextStatus ?? $user->status;

        if ($finalRole === 'admin' && $finalStatus === 'active') {
            return;
        }

        $activeAdminCount = User::query()
            ->where('status', 'active')
            ->whereHas('roles', fn ($query) => $query->where('name', 'admin'))
            ->count();

        if ($activeAdminCount <= 1) {
            throw new DomainException('You cannot remove or deactivate the last admin.', 422);
        }
    }
}
