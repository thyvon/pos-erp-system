<?php

namespace App\Services\Foundation;

use App\Models\Branch;
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
            if (($data['is_default'] ?? false) === true) {
                $this->clearDefaultBranches();
            }

            /** @var Branch $branch */
            $branch = $this->branches->create($data);

            return $branch->load(['manager']);
        });
    }

    public function update(Branch $branch, array $data): Branch
    {
        return DB::transaction(function () use ($branch, $data): Branch {
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

    protected function clearDefaultBranches(?string $exceptId = null): void
    {
        $query = Branch::query()->where('is_default', true);

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        $query->update(['is_default' => false]);
    }
}
