<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\StoreStockAdjustmentRequest;
use App\Http\Resources\Inventory\StockAdjustmentResource;
use App\Models\StockAdjustment;
use App\Services\Inventory\StockAdjustmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockAdjustmentController extends BaseApiController
{
    public function __construct(protected StockAdjustmentService $adjustmentService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockAdjustment::class);

        $adjustments = $this->adjustmentService->paginate($request->only([
            'search',
            'warehouse_id',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($adjustments, StockAdjustmentResource::class);
    }

    public function store(StoreStockAdjustmentRequest $request): JsonResponse
    {
        $this->authorize('create', StockAdjustment::class);

        $adjustment = $this->adjustmentService->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockAdjustmentResource($adjustment), 'Stock adjustment created successfully.', 201);
    }

    public function show(StockAdjustment $stockAdjustment): JsonResponse
    {
        $this->authorize('view', $stockAdjustment);

        return $this->success(new StockAdjustmentResource(
            $stockAdjustment->load(['warehouse.branch', 'creator', 'items.product', 'items.variation', 'items.lot', 'items.serial'])
        ));
    }
}
