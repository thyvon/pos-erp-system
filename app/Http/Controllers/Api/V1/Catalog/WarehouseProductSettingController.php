<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreWarehouseProductSettingRequest;
use App\Http\Requests\Catalog\UpdateWarehouseProductSettingRequest;
use App\Http\Resources\Catalog\WarehouseProductSettingResource;
use App\Models\WarehouseProductSetting;
use App\Services\Catalog\WarehouseProductSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseProductSettingController extends BaseCatalogController
{
    public function __construct(protected WarehouseProductSettingService $warehouseProductSettings)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', WarehouseProductSetting::class);

        $items = $this->warehouseProductSettings->paginate($request->only([
            'search',
            'warehouse_id',
            'product_id',
            'variation_id',
            'rack_location_id',
            'preferred_supplier_id',
            'is_active',
            'per_page',
        ]), $request->user());

        return $this->paginated($items, WarehouseProductSettingResource::class);
    }

    public function options(Request $request): JsonResponse
    {
        $this->authorize('viewAny', WarehouseProductSetting::class);

        return $this->success(
            WarehouseProductSettingResource::collection($this->warehouseProductSettings->options($request->user()))
        );
    }

    public function store(StoreWarehouseProductSettingRequest $request): JsonResponse
    {
        $this->authorize('create', WarehouseProductSetting::class);

        $setting = $this->warehouseProductSettings->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new WarehouseProductSettingResource($setting), 'Warehouse product setting created successfully.', 201);
    }

    public function show(WarehouseProductSetting $warehouseProductSetting): JsonResponse
    {
        $this->authorize('view', $warehouseProductSetting);

        return $this->success(new WarehouseProductSettingResource($warehouseProductSetting->load([
            'warehouse.branch',
            'product',
            'variation',
            'rackLocation',
            'preferredSupplier',
        ])));
    }

    public function update(
        UpdateWarehouseProductSettingRequest $request,
        WarehouseProductSetting $warehouseProductSetting
    ): JsonResponse {
        $this->authorize('update', $warehouseProductSetting);

        $setting = $this->warehouseProductSettings->update(
            (string) $request->user()->business_id,
            $warehouseProductSetting,
            $request->validated(),
            $request->user()
        );

        return $this->success(new WarehouseProductSettingResource($setting), 'Warehouse product setting updated successfully.');
    }

    public function destroy(Request $request, WarehouseProductSetting $warehouseProductSetting): JsonResponse
    {
        $this->authorize('delete', $warehouseProductSetting);

        $this->warehouseProductSettings->delete(
            (string) $request->user()->business_id,
            $warehouseProductSetting,
            $request->user()
        );

        return $this->success(null, 'Warehouse product setting deleted successfully.');
    }
}
