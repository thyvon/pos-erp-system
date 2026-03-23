<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Jobs\Foundation\SendUserInviteJob;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use App\Repositories\Foundation\UserRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(protected UserRepository $users) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->users->paginateFiltered($filters);
    }

    public function create(array $data): User
    {
        $role = $data['role'];
        $directPermissions = array_values(array_unique($data['direct_permissions'] ?? []));
        $branchIds = array_values(array_unique($data['branch_ids'] ?? []));
        $defaultBranchId = $data['default_branch_id'] ?? null;
        unset($data['role']);
        unset($data['direct_permissions'], $data['branch_ids'], $data['default_branch_id']);
        $this->ensureRestrictedRoleCannotBeAssigned($role);

        $business = $this->resolveBusiness();
        $this->ensureUserLimitNotExceeded($business);
        [$branchIds, $defaultBranchId] = $this->normalizeBranchAccess($business, $branchIds, $defaultBranchId);

        $data['business_id'] = $data['business_id'] ?? $business->id;
        $data['default_branch_id'] = $defaultBranchId;
        $data['password'] = Hash::make($data['password']);

        $user = DB::transaction(function () use ($data, $role, $directPermissions, $branchIds): User {
            /** @var User $user */
            $user = $this->users->create($data);
            $user->assignRole($role);
            $user->syncPermissions($directPermissions);
            $user->branches()->sync($branchIds);

            return $user->load(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);
        });

        SendUserInviteJob::dispatch($user);

        return $user;
    }

    public function update(User $user, array $data): User
    {
        $role = $data['role'] ?? null;
        $directPermissions = array_key_exists('direct_permissions', $data)
            ? array_values(array_unique($data['direct_permissions'] ?? []))
            : null;
        $branchIds = array_key_exists('branch_ids', $data)
            ? array_values(array_unique($data['branch_ids'] ?? []))
            : null;
        $defaultBranchId = $data['default_branch_id'] ?? null;
        unset($data['role']);
        unset($data['direct_permissions'], $data['branch_ids'], $data['default_branch_id']);

        if ($role !== null) {
            $this->ensureRestrictedRoleCannotBeAssigned($role);
        }

        if (($data['status'] ?? null) !== null && $data['status'] !== 'active') {
            $this->ensureNotLastAdmin($user, $role, $data['status']);
        }

        if ($branchIds !== null) {
            [$branchIds, $defaultBranchId] = $this->normalizeBranchAccess(
                $this->resolveBusiness(),
                $branchIds,
                $defaultBranchId
            );
            $data['default_branch_id'] = $defaultBranchId;
        } elseif ($defaultBranchId !== null) {
            throw new DomainException('Default branch must be updated together with assigned branches.', 422);
        }

        if (array_key_exists('password', $data) && filled($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        return DB::transaction(function () use ($user, $data, $role, $directPermissions, $branchIds): User {
            /** @var User $updatedUser */
            $updatedUser = $this->users->update($user, $data);

            if ($role !== null) {
                $this->ensureNotLastAdmin($updatedUser, $role, $updatedUser->status);
                $updatedUser->syncRoles([$role]);
            }

            if ($directPermissions !== null) {
                $updatedUser->syncPermissions($directPermissions);
            }

            if ($branchIds !== null) {
                $updatedUser->branches()->sync($branchIds);
            }

            return $updatedUser->load(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);
        });
    }

    public function accessControlOptions(): array
    {
        $business = $this->resolveBusiness();

        return [
            'roles' => $this->users->availableRoles(),
            'permissions' => $this->users->availablePermissions(),
            'branches' => Branch::query()
                ->where('business_id', $business->id)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'is_default', 'is_active'])
                ->map(fn (Branch $branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'is_default' => $branch->is_default,
                    'is_active' => $branch->is_active,
                ])
                ->values()
                ->all(),
        ];
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
            ->whereHas('roles', fn($query) => $query->where('name', 'admin'))
            ->count();

        if ($activeAdminCount <= 1) {
            throw new DomainException('You cannot remove or deactivate the last admin.', 422);
        }
    }

    protected function ensureRestrictedRoleCannotBeAssigned(string $role): void
    {
        if ($role === 'super_admin') {
            throw new DomainException('The super_admin role can only be assigned through seeders.', 422);
        }
    }

    protected function normalizeBranchAccess(Business $business, array $branchIds, ?string $defaultBranchId): array
    {
        $branches = Branch::query()
            ->where('business_id', $business->id)
            ->whereIn('id', $branchIds)
            ->pluck('id')
            ->values()
            ->all();

        if (count($branches) !== count($branchIds)) {
            throw new DomainException('One or more selected branches are invalid for this business.', 422);
        }

        if ($defaultBranchId !== null && ! in_array($defaultBranchId, $branches, true)) {
            throw new DomainException('Default branch must be one of the assigned branches.', 422);
        }

        $defaultBranchId ??= $branches[0] ?? null;

        return [$branches, $defaultBranchId];
    }
}
