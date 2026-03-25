<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreRackLocationRequest;
use App\Http\Requests\Catalog\UpdateRackLocationRequest;
use App\Http\Resources\Catalog\RackLocationResource;
use App\Models\RackLocation;
use App\Services\Catalog\RackLocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RackLocationController extends BaseCatalogController
{
    public function __construct(protected RackLocationService $rackLocations)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RackLocation::class);

        $items = $this->rackLocations->paginate($request->only([
            'search',
            'warehouse_id',
            'per_page',
        ]), $request->user());

        return $this->paginated($items, RackLocationResource::class);
    }

    public function options(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RackLocation::class);

        return $this->success(
            RackLocationResource::collection($this->rackLocations->options($request->user()))
        );
    }

    public function store(StoreRackLocationRequest $request): JsonResponse
    {
        $this->authorize('create', RackLocation::class);

        $rackLocation = $this->rackLocations->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new RackLocationResource($rackLocation), 'Rack location created successfully.', 201);
    }

    public function show(RackLocation $rackLocation): JsonResponse
    {
        $this->authorize('view', $rackLocation);

        return $this->success(new RackLocationResource($rackLocation->load(['warehouse.branch'])));
    }

    public function update(UpdateRackLocationRequest $request, RackLocation $rackLocation): JsonResponse
    {
        $this->authorize('update', $rackLocation);

        $rackLocation = $this->rackLocations->update(
            (string) $request->user()->business_id,
            $rackLocation,
            $request->validated(),
            $request->user()
        );

        return $this->success(new RackLocationResource($rackLocation), 'Rack location updated successfully.');
    }

    public function destroy(Request $request, RackLocation $rackLocation): JsonResponse
    {
        $this->authorize('delete', $rackLocation);

        $this->rackLocations->delete(
            (string) $request->user()->business_id,
            $rackLocation,
            $request->user()
        );

        return $this->success(null, 'Rack location deleted successfully.');
    }
}
