<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Jobs\Foundation\SendUserInviteJob;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use App\Models\Warehouse;
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
        $roles = $this->extractRoles($data, true);
        $directPermissions = array_values(array_unique($data['direct_permissions'] ?? []));
        $branchIds = array_values(array_unique($data['branch_ids'] ?? []));
        $defaultBranchId = $data['default_branch_id'] ?? null;
        $warehouseIds = array_values(array_unique($data['warehouse_ids'] ?? []));
        unset($data['role'], $data['roles'], $data['direct_permissions'], $data['branch_ids'], $data['default_branch_id'], $data['warehouse_ids']);

        $this->ensureRestrictedRolesCannotBeAssigned($roles);

        $business = $this->resolveBusiness();
        $this->ensureUserLimitNotExceeded($business);
        [$branchIds, $defaultBranchId] = $this->normalizeBranchAccess($business, $branchIds, $defaultBranchId);
        $warehouseIds = $this->normalizeWarehouseAccess($business, $warehouseIds, $branchIds);

        $data['business_id'] = $data['business_id'] ?? $business->id;
        $data['default_branch_id'] = $defaultBranchId;
        $data['password'] = Hash::make($data['password']);

        $user = DB::transaction(function () use ($data, $roles, $directPermissions, $branchIds, $warehouseIds): User {
            /** @var User $user */
            $user = $this->users->create($data);
            $user->syncRoles($roles);
            $user->syncPermissions($directPermissions);
            $user->branches()->sync($branchIds);
            $user->warehouses()->sync($warehouseIds);

            return $user->load(['business', 'roles', 'permissions', 'branches', 'defaultBranch', 'warehouses']);
        });

        $this->writeCreateAuditLogs($user, $actor, $business->id);
        SendUserInviteJob::dispatch($user);

        return $user;
    }

    public function update(User $user, array $data, ?User $actor = null): User
    {
        $before = $this->userAuditState($user);
        $roles = $this->extractRoles($data, false);
        $directPermissions = array_key_exists('direct_permissions', $data)
            ? array_values(array_unique($data['direct_permissions'] ?? []))
            : null;
        $branchIds = array_key_exists('branch_ids', $data)
            ? array_values(array_unique($data['branch_ids'] ?? []))
            : null;
        $defaultBranchId = $data['default_branch_id'] ?? null;
        $warehouseIds = array_key_exists('warehouse_ids', $data)
            ? array_values(array_unique($data['warehouse_ids'] ?? []))
            : null;
        unset($data['role'], $data['roles'], $data['direct_permissions'], $data['branch_ids'], $data['default_branch_id'], $data['warehouse_ids']);

        if ($roles !== null) {
            $this->ensureRestrictedRolesCannotBeAssigned($roles);
        }

        if (($data['status'] ?? null) !== null && $data['status'] !== 'active') {
            $this->ensureNotLastAdmin($user, $roles, $data['status']);
        }

        if ($branchIds !== null) {
            [$branchIds, $defaultBranchId] = $this->normalizeBranchAccess(
                $this->resolveBusiness(),
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

        if ($warehouseIds !== null) {
            $warehouseIds = $this->normalizeWarehouseAccess(
                $this->resolveBusiness(),
                $warehouseIds ?? [],
                $branchIds ?? $user->accessibleBranchIds()
            );
        }

        $updatedUser = DB::transaction(function () use ($user, $data, $roles, $directPermissions, $branchIds, $warehouseIds): User {
            /** @var User $updatedUser */
            $updatedUser = $this->users->update($user, $data);

            if ($roles !== null) {
                $this->ensureNotLastAdmin($updatedUser, $roles, $updatedUser->status);
                $updatedUser->syncRoles($roles);
            }

            if ($directPermissions !== null) {
                $updatedUser->syncPermissions($directPermissions);
            }

            if ($branchIds !== null) {
                $updatedUser->branches()->sync($branchIds ?? []);
            }

            if ($warehouseIds !== null) {
                $updatedUser->warehouses()->sync($warehouseIds);
            }

            return $updatedUser->load(['business', 'roles', 'permissions', 'branches', 'defaultBranch', 'warehouses']);
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
            'warehouses' => Warehouse::query()
                ->where('business_id', $business->id)
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'is_default', 'is_active'])
                ->map(fn (Warehouse $warehouse) => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'code' => $warehouse->code,
                    'is_default' => $warehouse->is_default,
                    'is_active' => $warehouse->is_active,
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
            'roles' => [$role],
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

    protected function ensureNotLastAdmin(User $user, ?array $nextRoles = null, ?string $nextStatus = null): void
    {
        if (! $user->hasRole('admin')) {
            return;
        }

        $finalRoles = $nextRoles ?? $user->getRoleNames()->all();
        $finalStatus = $nextStatus ?? $user->status;

        if (in_array('admin', $finalRoles, true) && $finalStatus === 'active') {
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

    protected function ensureRestrictedRolesCannotBeAssigned(array $roles): void
    {
        if (in_array('super_admin', $roles, true)) {
            throw new DomainException('The super_admin role can only be assigned through seeders.', 422);
        }
    }

    protected function normalizeBranchAccess(
        Business $business,
        array $branchIds,
        ?string $defaultBranchId
    ): array {
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

    protected function normalizeWarehouseAccess(Business $business, array $warehouseIds, array $allowedBranchIds): array
    {
        if ($warehouseIds === []) {
            return [];
        }

        $validWarehouseIds = Warehouse::query()
            ->where('business_id', $business->id)
            ->whereIn('branch_id', $allowedBranchIds)
            ->whereIn('id', $warehouseIds)
            ->pluck('id')
            ->values()
            ->all();

        $invalidCount = count($warehouseIds) - count($validWarehouseIds);

        if ($invalidCount > 0) {
            throw new DomainException("{$invalidCount} warehouse(s) are invalid or not in assigned branches.", 422);
        }

        return $validWarehouseIds;
    }

    protected function extractRoles(array $data, bool $required): ?array
    {
        if (array_key_exists('roles', $data)) {
            return array_values(array_unique(array_filter((array) $data['roles'])));
        }

        if (array_key_exists('role', $data) && filled($data['role'])) {
            return [(string) $data['role']];
        }

        return $required ? [] : null;
    }

    protected function userAuditState(User $user): array
    {
        $user->loadMissing(['roles', 'permissions', 'branches', 'defaultBranch']);

        $branchIds = $user->branches->modelKeys();
        sort($branchIds);
        $permissions = $user->permissions->pluck('name')->all();
        sort($permissions);
        $roles = $user->getRoleNames()->all();
        sort($roles);

        return [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'roles' => $roles,
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
            ['roles' => $state['roles']]
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

        if (($before['roles'] ?? []) !== ($after['roles'] ?? [])) {
            $this->auditLogger->log(
                'role_assigned',
                User::class,
                $updatedUser->id,
                $actor,
                $updatedUser->business_id,
                ['roles' => $before['roles'] ?? []],
                ['roles' => $after['roles'] ?? []],
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
