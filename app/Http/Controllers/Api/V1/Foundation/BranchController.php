<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreBranchRequest;
use App\Http\Requests\Foundation\UpdateBranchRequest;
use App\Http\Resources\Foundation\BranchResource;
use App\Models\Branch;
use App\Models\Business;
use App\Services\Foundation\BranchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends BaseApiController
{
    public function __construct(protected BranchService $branchService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Branch::class);

        $branches = $this->branchService->paginate($request->only([
            'search',
            'is_active',
            'per_page',
        ]), $request->user());

        return $this->paginated($branches, BranchResource::class);
    }

    public function store(StoreBranchRequest $request): JsonResponse
    {
        $this->authorize('create', Branch::class);

        $branch = $this->branchService->create(
            $this->currentBusiness(),
            $request->validated(),
            $request->user()?->getAuthIdentifier()
        );

        return $this->success(new BranchResource($branch), 'Branch created successfully.', 201);
    }

    public function show(Branch $branch): JsonResponse
    {
        $this->authorize('view', $branch);

        return $this->success(new BranchResource($branch->load(['manager'])));
    }

    public function update(UpdateBranchRequest $request, Branch $branch): JsonResponse
    {
        $this->authorize('update', $branch);

        $branch = $this->branchService->update($this->currentBusiness(), $branch, $request->validated());

        return $this->success(new BranchResource($branch), 'Branch updated successfully.');
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $this->authorize('delete', $branch);

        $this->branchService->delete($this->currentBusiness(), $branch);

        return $this->success(null, 'Branch deleted successfully.');
    }

    protected function currentBusiness(): Business
    {
        $tenant = app()->bound('tenant') ? app('tenant') : null;

        if (! $tenant instanceof Business) {
            throw new DomainException('Tenant context is required to manage branches.', 422);
        }

        return $tenant;
    }
}
