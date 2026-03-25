<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreUnitRequest;
use App\Http\Requests\Catalog\UpdateUnitRequest;
use App\Http\Resources\Catalog\UnitResource;
use App\Models\Unit;
use App\Services\Catalog\UnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends BaseCatalogController
{
    public function __construct(protected UnitService $units)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Unit::class);

        $items = $this->units->paginate($request->only([
            'search',
            'per_page',
        ]));

        return $this->paginated($items, UnitResource::class);
    }

    public function options(): JsonResponse
    {
        $this->authorize('viewAny', Unit::class);

        return $this->success(UnitResource::collection($this->units->options()));
    }

    public function store(StoreUnitRequest $request): JsonResponse
    {
        $this->authorize('create', Unit::class);

        $unit = $this->units->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new UnitResource($unit), 'Unit created successfully.', 201);
    }

    public function show(Unit $unit): JsonResponse
    {
        $this->authorize('view', $unit);

        return $this->success(new UnitResource($unit->load(['subUnits'])->loadCount('subUnits')));
    }

    public function update(UpdateUnitRequest $request, Unit $unit): JsonResponse
    {
        $this->authorize('update', $unit);

        $unit = $this->units->update(
            (string) $request->user()->business_id,
            $unit,
            $request->validated(),
            $request->user()
        );

        return $this->success(new UnitResource($unit), 'Unit updated successfully.');
    }

    public function destroy(Request $request, Unit $unit): JsonResponse
    {
        $this->authorize('delete', $unit);

        $this->units->delete(
            (string) $request->user()->business_id,
            $unit,
            $request->user()
        );

        return $this->success(null, 'Unit deleted successfully.');
    }
}
