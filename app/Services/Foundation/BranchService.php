<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\Branch;
use App\Models\Business;
use App\Repositories\Foundation\BranchRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BranchService
{
    public function __construct(protected BranchRepository $branches)
    {
    }

    public function paginate(array $filters, ?array $accessibleBranchIds = null): LengthAwarePaginator
    {
        return $this->branches->paginateFiltered($filters, $accessibleBranchIds);
    }

    public function create(Business $business, array $data, ?string $assignToUserId = null): Branch
    {
        return DB::transaction(function () use ($business, $data, $assignToUserId): Branch {
            $business = $this->lockBusiness($business);
            $this->ensureBranchLimitNotExceeded($business);
            $data['business_id'] = $business->id;

            if (blank($data['code'] ?? null)) {
                $data['code'] = $this->generateCode($business);
            }

            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultBranches($business);
            } elseif (! $this->branchQueryForBusiness($business)->lockForUpdate()->exists()) {
                $data['is_default'] = true;
            }

            /** @var Branch $branch */
            $branch = $this->branches->create($data);
            $this->assignBranchToUser($branch, $assignToUserId);

            return $branch->load(['manager']);
        });
    }

    public function update(Business $business, Branch $branch, array $data): Branch
    {
        return DB::transaction(function () use ($business, $branch, $data): Branch {
            $this->ensureBranchBelongsToBusiness($business, $branch);

            if (array_key_exists('code', $data) && blank($data['code'])) {
                $data['code'] = $branch->code;
            }

            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultBranches($business, $branch->id);
            }

            /** @var Branch $updatedBranch */
            $updatedBranch = $this->branches->update($branch, $data);

            return $updatedBranch->load(['manager']);
        });
    }

    public function delete(Business $business, Branch $branch): void
    {
        $this->ensureBranchBelongsToBusiness($business, $branch);
        $this->ensureBranchCanBeDeleted($branch);
        $this->branches->delete($branch);
    }

    protected function branchQueryForBusiness(Business $business): Builder
    {
        return Branch::query()->where('business_id', $business->id);
    }

    protected function lockBusiness(Business $business): Business
    {
        $lockedBusiness = Business::query()
            ->whereKey($business->getKey())
            ->lockForUpdate()
            ->first();

        if (! $lockedBusiness instanceof Business) {
            throw new DomainException('Tenant context is required to manage branches.', 422);
        }

        return $lockedBusiness;
    }

    protected function clearDefaultBranches(Business $business, ?string $exceptId = null): void
    {
        $query = $this->branchQueryForBusiness($business)
            ->where('is_default', true)
            ->lockForUpdate();

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        $query->update(['is_default' => false]);
    }

    protected function ensureBranchLimitNotExceeded(Business $business): void
    {
        if ($this->branchQueryForBusiness($business)->lockForUpdate()->count() >= $business->max_branches) {
            throw new DomainException('Your business branch limit has been reached.', 403);
        }
    }

    protected function generateCode(Business $business): string
    {
        $lastCode = $this->branchQueryForBusiness($business)
            ->where('code', 'like', 'BR-%')
            ->lockForUpdate()
            ->orderByDesc('code')
            ->value('code');

        $nextNumber = $lastCode === null
            ? 1
            : ((int) substr($lastCode, 3)) + 1;

        return sprintf('BR-%03d', $nextNumber);
    }

    protected function assignBranchToUser(Branch $branch, ?string $userId): void
    {
        if ($userId === null) {
            return;
        }

        DB::table('branch_user')->updateOrInsert(
            [
                'user_id' => $userId,
                'branch_id' => $branch->id,
            ],
            [
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    protected function ensureBranchBelongsToBusiness(Business $business, Branch $branch): void
    {
        if ((string) $branch->business_id !== (string) $business->id) {
            throw new DomainException('Branch does not belong to the current business.', 422);
        }
    }

    protected function ensureBranchCanBeDeleted(Branch $branch): void
    {
        if ($branch->warehouses()->exists()) {
            throw new DomainException('Branch cannot be deleted because it still has warehouses.', 422);
        }

        if ($branch->users()->exists()) {
            throw new DomainException('Branch cannot be deleted because it is still assigned to users.', 422);
        }

        if (DB::table('users')->where('default_branch_id', $branch->id)->exists()) {
            throw new DomainException('Branch cannot be deleted because it is set as a default branch for users.', 422);
        }
    }
}
