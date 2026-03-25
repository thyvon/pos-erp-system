<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreTaxGroupRequest;
use App\Http\Requests\Foundation\UpdateTaxGroupRequest;
use App\Http\Resources\Foundation\TaxGroupResource;
use App\Models\TaxGroup;
use App\Services\Foundation\TaxGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaxGroupController extends BaseApiController
{
    public function __construct(protected TaxGroupService $taxGroups)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TaxGroup::class);

        $items = $this->taxGroups->paginate($request->only([
            'search',
            'is_active',
            'per_page',
        ]));

        return $this->paginated($items, TaxGroupResource::class);
    }

    public function store(StoreTaxGroupRequest $request): JsonResponse
    {
        $this->authorize('create', TaxGroup::class);

        $taxGroup = $this->taxGroups->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new TaxGroupResource($taxGroup), 'Tax group created successfully.', 201);
    }

    public function show(TaxGroup $taxGroup): JsonResponse
    {
        $this->authorize('view', $taxGroup);

        return $this->success(new TaxGroupResource($taxGroup));
    }

    public function update(UpdateTaxGroupRequest $request, TaxGroup $taxGroup): JsonResponse
    {
        $this->authorize('update', $taxGroup);

        $taxGroup = $this->taxGroups->update(
            (string) $request->user()->business_id,
            $taxGroup,
            $request->validated(),
            $request->user()
        );

        return $this->success(new TaxGroupResource($taxGroup), 'Tax group updated successfully.');
    }

    public function destroy(Request $request, TaxGroup $taxGroup): JsonResponse
    {
        $this->authorize('delete', $taxGroup);

        $this->taxGroups->delete(
            (string) $request->user()->business_id,
            $taxGroup,
            $request->user()
        );

        return $this->success(null, 'Tax group deleted successfully.');
    }
}
