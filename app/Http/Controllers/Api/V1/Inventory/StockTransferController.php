<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\StoreStockTransferRequest;
use App\Http\Resources\Inventory\StockTransferResource;
use App\Models\StockTransfer;
use App\Services\Inventory\StockTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockTransferController extends BaseApiController
{
    public function __construct(protected StockTransferService $transferService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockTransfer::class);

        $transfers = $this->transferService->paginate($request->only([
            'search',
            'from_warehouse_id',
            'to_warehouse_id',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($transfers, StockTransferResource::class);
    }

    public function store(StoreStockTransferRequest $request): JsonResponse
    {
        $this->authorize('create', StockTransfer::class);

        $transfer = $this->transferService->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockTransferResource($transfer), 'Stock transfer created successfully.', 201);
    }

    public function show(StockTransfer $stockTransfer): JsonResponse
    {
        $this->authorize('view', $stockTransfer);

        return $this->success(new StockTransferResource(
            $stockTransfer->load(['fromWarehouse.branch', 'toWarehouse.branch', 'creator', 'items.product', 'items.variation'])
        ));
    }
}
