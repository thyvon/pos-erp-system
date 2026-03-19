<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Jobs\Foundation\SendUserInviteJob;
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

        $data['business_id'] = $data['business_id'] ?? $this->resolveBusinessId();
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

        if (array_key_exists('password', $data) && filled($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return DB::transaction(function () use ($user, $data, $role): User {
            /** @var User $updatedUser */
            $updatedUser = $this->users->update($user, $data);

            if ($role !== null) {
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

        return $this->update($user, ['status' => 'inactive']);
    }

    public function destroy(User $user): void
    {
        if ((string) auth()->id() === (string) $user->id) {
            throw new DomainException('You cannot delete your own account.', 422);
        }

        DB::transaction(function () use ($user): void {
            $user->forceFill(['status' => 'inactive'])->save();
            $this->users->delete($user);
        });
    }

    protected function resolveBusinessId(): string
    {
        $businessId = app()->bound('tenant')
            ? app('tenant')?->id
            : auth()->user()?->business_id;

        if (! filled($businessId)) {
            throw new DomainException('Tenant context is required to manage users.', 422);
        }

        return (string) $businessId;
    }
}
