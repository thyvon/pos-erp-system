<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreWarehouseRequest;
use App\Http\Requests\Foundation\UpdateWarehouseRequest;
use App\Http\Resources\Foundation\WarehouseResource;
use App\Models\Warehouse;
use App\Services\Foundation\WarehouseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends BaseApiController
{
    public function __construct(protected WarehouseService $warehouseService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $warehouses = $this->warehouseService->paginate($request->only([
            'search',
            'type',
            'branch_id',
            'per_page',
        ]));

        return $this->paginated($warehouses, WarehouseResource::class);
    }

    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->warehouseService->create($request->validated());

        return $this->success(new WarehouseResource($warehouse), 'Warehouse created successfully.', 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return $this->success(new WarehouseResource($warehouse->load(['branch'])));
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): JsonResponse
    {
        $warehouse = $this->warehouseService->update($warehouse, $request->validated());

        return $this->success(new WarehouseResource($warehouse), 'Warehouse updated successfully.');
    }

    public function destroy(Warehouse $warehouse): JsonResponse
    {
        $this->warehouseService->delete($warehouse);

        return $this->success(null, 'Warehouse deleted successfully.');
    }
}
