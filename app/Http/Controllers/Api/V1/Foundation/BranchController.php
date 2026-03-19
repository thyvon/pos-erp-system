<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreBranchRequest;
use App\Http\Requests\Foundation\UpdateBranchRequest;
use App\Http\Resources\Foundation\BranchResource;
use App\Models\Branch;
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
        $branches = $this->branchService->paginate($request->only([
            'search',
            'is_active',
            'per_page',
        ]));

        return $this->paginated($branches, BranchResource::class);
    }

    public function store(StoreBranchRequest $request): JsonResponse
    {
        $branch = $this->branchService->create($request->validated());

        return $this->success(new BranchResource($branch), 'Branch created successfully.', 201);
    }

    public function show(Branch $branch): JsonResponse
    {
        return $this->success(new BranchResource($branch->load(['manager'])));
    }

    public function update(UpdateBranchRequest $request, Branch $branch): JsonResponse
    {
        $branch = $this->branchService->update($branch, $request->validated());

        return $this->success(new BranchResource($branch), 'Branch updated successfully.');
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $this->branchService->delete($branch);

        return $this->success(null, 'Branch deleted successfully.');
    }
}
