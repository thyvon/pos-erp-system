<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StorePriceGroupRequest;
use App\Http\Requests\Catalog\UpdatePriceGroupRequest;
use App\Http\Resources\Catalog\PriceGroupResource;
use App\Models\PriceGroup;
use App\Services\Catalog\PriceGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceGroupController extends BaseCatalogController
{
    public function __construct(protected PriceGroupService $priceGroups)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PriceGroup::class);

        $items = $this->priceGroups->paginate($request->only([
            'search',
            'per_page',
        ]));

        return $this->paginated($items, PriceGroupResource::class);
    }

    public function store(StorePriceGroupRequest $request): JsonResponse
    {
        $this->authorize('create', PriceGroup::class);

        $priceGroup = $this->priceGroups->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PriceGroupResource($priceGroup), 'Price group created successfully.', 201);
    }

    public function show(PriceGroup $priceGroup): JsonResponse
    {
        $this->authorize('view', $priceGroup);

        return $this->success(new PriceGroupResource($priceGroup->loadCount('customerGroups')));
    }

    public function update(UpdatePriceGroupRequest $request, PriceGroup $priceGroup): JsonResponse
    {
        $this->authorize('update', $priceGroup);

        $priceGroup = $this->priceGroups->update(
            (string) $request->user()->business_id,
            $priceGroup,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PriceGroupResource($priceGroup), 'Price group updated successfully.');
    }

    public function destroy(Request $request, PriceGroup $priceGroup): JsonResponse
    {
        $this->authorize('delete', $priceGroup);

        $this->priceGroups->delete(
            (string) $request->user()->business_id,
            $priceGroup,
            $request->user()
        );

        return $this->success(null, 'Price group deleted successfully.');
    }
}
