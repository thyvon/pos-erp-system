<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\UpdateLotStatusRequest;
use App\Http\Resources\Inventory\StockLotResource;
use App\Models\StockLot;
use App\Services\Inventory\LotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LotController extends BaseApiController
{
    public function __construct(protected LotService $lotService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockLot::class);

        $lots = $this->lotService->paginate($request->only([
            'search',
            'warehouse_id',
            'product_id',
            'status',
            'per_page',
        ]), $request->user());

        return $this->paginated($lots, StockLotResource::class);
    }

    public function show(StockLot $stockLot): JsonResponse
    {
        $this->authorize('view', $stockLot);

        return $this->success(new StockLotResource($stockLot->load(['product', 'variation', 'warehouse.branch', 'supplier'])));
    }

    public function updateStatus(UpdateLotStatusRequest $request, StockLot $stockLot): JsonResponse
    {
        $this->authorize('updateStatus', $stockLot);

        $lot = $this->lotService->updateStatus(
            $request->user()->business_id,
            $stockLot,
            $request->validated()['status'],
            $request->validated()['reason'] ?? null,
            $request->user()
        );

        return $this->success(new StockLotResource($lot), 'Lot status updated successfully.');
    }
}
