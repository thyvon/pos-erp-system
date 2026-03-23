<?php

namespace App\Services\Foundation;

use App\Models\Business;
use App\Models\Branch;
use App\Exceptions\Domain\DomainException;
use App\Repositories\Foundation\BranchRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BranchService
{
    public function __construct(protected BranchRepository $branches)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->branches->paginateFiltered($filters);
    }

    public function create(array $data): Branch
    {
        return DB::transaction(function () use ($data): Branch {
            $business = $this->resolveBusiness();
            $this->ensureBranchLimitNotExceeded($business);

            if (blank($data['code'] ?? null)) {
                $data['code'] = $this->generateCode();
            }

            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultBranches();
            } elseif (! Branch::query()->exists()) {
                $data['is_default'] = true;
            }

            /** @var Branch $branch */
            $branch = $this->branches->create($data);
            auth()->user()?->branches()->syncWithoutDetaching([$branch->id]);

            return $branch->load(['manager']);
        });
    }

    public function update(Branch $branch, array $data): Branch
    {
        return DB::transaction(function () use ($branch, $data): Branch {
            if (array_key_exists('code', $data) && blank($data['code'])) {
                $data['code'] = $branch->code;
            }

            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultBranches($branch->id);
            }

            /** @var Branch $updatedBranch */
            $updatedBranch = $this->branches->update($branch, $data);

            return $updatedBranch->load(['manager']);
        });
    }

    public function delete(Branch $branch): void
    {
        $this->branches->delete($branch);
    }

    protected function resolveBusiness(): Business
    {
        $business = app()->bound('tenant')
            ? app('tenant')
            : auth()->user()?->business;

        if (! $business instanceof Business) {
            throw new DomainException('Tenant context is required to manage branches.', 422);
        }

        return $business;
    }

    protected function clearDefaultBranches(?string $exceptId = null): void
    {
        $query = Branch::query()->where('is_default', true);

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        $query->update(['is_default' => false]);
    }

    protected function ensureBranchLimitNotExceeded(Business $business): void
    {
        if (Branch::query()->count() >= $business->max_branches) {
            throw new DomainException('Your business branch limit has been reached.', 403);
        }
    }

    protected function generateCode(): string
    {
        $lastCode = Branch::query()
            ->where('code', 'like', 'BR-%')
            ->orderByDesc('code')
            ->value('code');

        $nextNumber = $lastCode === null
            ? 1
            : ((int) substr($lastCode, 3)) + 1;

        return sprintf('BR-%03d', $nextNumber);
    }
}
