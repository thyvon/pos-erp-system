<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Jobs\Foundation\SendUserInviteJob;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use App\Repositories\Foundation\UserRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserService
{
    public function __construct(
        protected UserRepository $users,
        protected AuditLogger $auditLogger,
    ) {}

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->users->paginateFiltered($filters);
    }

    public function create(array $data, ?User $actor = null): User
    {
        $role = $data['role'];
        $directPermissions = array_values(array_unique($data['direct_permissions'] ?? []));
        $branchIds = array_values(array_unique($data['branch_ids'] ?? []));
        $defaultBranchId = $data['default_branch_id'] ?? null;
        unset($data['role'], $data['direct_permissions'], $data['branch_ids'], $data['default_branch_id']);

        $this->ensureRestrictedRoleCannotBeAssigned($role);

        $business = $this->resolveBusiness();
        $this->ensureUserLimitNotExceeded($business);
        [$branchIds, $defaultBranchId] = $this->normalizeBranchAccess($business, $role, $branchIds, $defaultBranchId);

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

        $this->writeCreateAuditLogs($user, $actor, $business->id);
        SendUserInviteJob::dispatch($user);

        return $user;
    }

    public function update(User $user, array $data, ?User $actor = null): User
    {
        $before = $this->userAuditState($user);
        $role = $data['role'] ?? null;
        $effectiveRole = $role ?? $before['role'];
        $directPermissions = array_key_exists('direct_permissions', $data)
            ? array_values(array_unique($data['direct_permissions'] ?? []))
            : null;
        $branchIds = array_key_exists('branch_ids', $data)
            ? array_values(array_unique($data['branch_ids'] ?? []))
            : null;
        $defaultBranchId = $data['default_branch_id'] ?? null;
        unset($data['role'], $data['direct_permissions'], $data['branch_ids'], $data['default_branch_id']);

        if ($role !== null) {
            $this->ensureRestrictedRoleCannotBeAssigned($role);
        }

        if (($data['status'] ?? null) !== null && $data['status'] !== 'active') {
            $this->ensureNotLastAdmin($user, $role, $data['status']);
        }

        $shouldResetBranchAccess = $role !== null && $this->roleUsesGlobalBranchAccess($effectiveRole);

        if ($branchIds !== null || $shouldResetBranchAccess) {
            [$branchIds, $defaultBranchId] = $this->normalizeBranchAccess(
                $this->resolveBusiness(),
                $effectiveRole,
                $branchIds ?? [],
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

        $updatedUser = DB::transaction(function () use ($user, $data, $role, $directPermissions, $branchIds, $shouldResetBranchAccess): User {
            /** @var User $updatedUser */
            $updatedUser = $this->users->update($user, $data);

            if ($role !== null) {
                $this->ensureNotLastAdmin($updatedUser, $role, $updatedUser->status);
                $updatedUser->syncRoles([$role]);
            }

            if ($directPermissions !== null) {
                $updatedUser->syncPermissions($directPermissions);
            }

            if ($branchIds !== null || $shouldResetBranchAccess) {
                $updatedUser->branches()->sync($branchIds ?? []);
            }

            return $updatedUser->load(['business', 'roles', 'permissions', 'branches', 'defaultBranch']);
        });

        $this->writeUpdateAuditLogs($before, $updatedUser, $actor);

        return $updatedUser;
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

    public function destroy(User $user, ?User $actor = null): void
    {
        if ((string) auth()->id() === (string) $user->id) {
            throw new DomainException('You cannot delete your own account.', 422);
        }

        $this->ensureNotLastAdmin($user, null, 'inactive');
        $before = $this->userAuditState($user);

        DB::transaction(function () use ($user): void {
            $user->forceFill(['status' => 'inactive'])->save();
            $this->users->delete($user);
        });

        $this->auditLogger->log(
            'user_deleted',
            User::class,
            $user->id,
            $actor,
            $user->business_id,
            $before,
            null,
        );
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
        if (User::query()->where('business_id', $business->id)->count() >= $business->max_users) {
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
            ->where('business_id', $user->business_id)
            ->where('status', 'active')
            ->whereHas('roles', fn ($query) => $query->where('name', 'admin'))
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

    protected function normalizeBranchAccess(
        Business $business,
        string $role,
        array $branchIds,
        ?string $defaultBranchId
    ): array {
        if ($this->roleUsesGlobalBranchAccess($role)) {
            if ($branchIds !== [] || filled($defaultBranchId)) {
                throw new DomainException('Branch access cannot be assigned to admin roles.', 422);
            }

            return [[], null];
        }

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

    protected function roleUsesGlobalBranchAccess(?string $role): bool
    {
        return in_array($role, ['super_admin', 'admin'], true);
    }

    protected function userAuditState(User $user): array
    {
        $user->loadMissing(['roles', 'permissions', 'branches', 'defaultBranch']);

        $branchIds = $user->branches->modelKeys();
        sort($branchIds);
        $permissions = $user->permissions->pluck('name')->all();
        sort($permissions);

        return [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'role' => $user->getRoleNames()->first(),
            'direct_permissions' => $permissions,
            'branch_ids' => $branchIds,
            'default_branch_id' => $user->default_branch_id,
        ];
    }

    protected function writeCreateAuditLogs(User $user, ?User $actor, string $businessId): void
    {
        $state = $this->userAuditState($user);

        $this->auditLogger->log('user_created', User::class, $user->id, $actor, $businessId, null, $state);
        $this->auditLogger->log(
            'role_assigned',
            User::class,
            $user->id,
            $actor,
            $businessId,
            null,
            ['role' => $state['role']]
        );

        if ($state['branch_ids'] !== [] || $state['default_branch_id'] !== null) {
            $this->auditLogger->log(
                'branch_access_changed',
                User::class,
                $user->id,
                $actor,
                $businessId,
                ['branch_ids' => [], 'default_branch_id' => null],
                [
                    'branch_ids' => $state['branch_ids'],
                    'default_branch_id' => $state['default_branch_id'],
                ]
            );
        }
    }

    protected function writeUpdateAuditLogs(array $before, User $updatedUser, ?User $actor): void
    {
        $after = $this->userAuditState($updatedUser);

        if ($before !== $after) {
            $this->auditLogger->log(
                'user_updated',
                User::class,
                $updatedUser->id,
                $actor,
                $updatedUser->business_id,
                $before,
                $after,
            );
        }

        if (($before['role'] ?? null) !== ($after['role'] ?? null)) {
            $this->auditLogger->log(
                'role_assigned',
                User::class,
                $updatedUser->id,
                $actor,
                $updatedUser->business_id,
                ['role' => $before['role'] ?? null],
                ['role' => $after['role'] ?? null],
            );
        }

        if (($before['status'] ?? null) !== ($after['status'] ?? null)) {
            $this->auditLogger->log(
                'status_changed',
                User::class,
                $updatedUser->id,
                $actor,
                $updatedUser->business_id,
                ['status' => $before['status'] ?? null],
                ['status' => $after['status'] ?? null],
            );
        }

        $beforeBranchState = [
            'branch_ids' => $before['branch_ids'] ?? [],
            'default_branch_id' => $before['default_branch_id'] ?? null,
        ];
        $afterBranchState = [
            'branch_ids' => $after['branch_ids'] ?? [],
            'default_branch_id' => $after['default_branch_id'] ?? null,
        ];

        if ($beforeBranchState !== $afterBranchState) {
            $this->auditLogger->log(
                'branch_access_changed',
                User::class,
                $updatedUser->id,
                $actor,
                $updatedUser->business_id,
                $beforeBranchState,
                $afterBranchState,
            );
        }
    }
}
