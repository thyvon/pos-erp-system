<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\StoreStockTransferRequest;
use App\Http\Requests\Inventory\UpdateStockTransferRequest;
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
            'warehouse_id',
            'direction',
            'status',
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
            $stockTransfer->load(['fromWarehouse.branch', 'toWarehouse.branch', 'creator', 'sender', 'receiver', 'items.product', 'items.variation', 'items.lot', 'items.serial'])
        ));
    }

    public function update(UpdateStockTransferRequest $request, StockTransfer $stockTransfer): JsonResponse
    {
        $this->authorize('update', $stockTransfer);

        $transfer = $this->transferService->update(
            $request->user()->business_id,
            $stockTransfer,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockTransferResource($transfer), 'Stock transfer updated successfully.');
    }

    public function destroy(Request $request, StockTransfer $stockTransfer): JsonResponse
    {
        $this->authorize('delete', $stockTransfer);

        $this->transferService->delete(
            $request->user()->business_id,
            $stockTransfer,
            $request->user()
        );

        return $this->success(null, 'Stock transfer deleted successfully.');
    }

    public function receive(Request $request, StockTransfer $stockTransfer): JsonResponse
    {
        $this->authorize('receive', $stockTransfer);

        $transfer = $this->transferService->receive(
            $request->user()->business_id,
            $stockTransfer,
            $request->user()
        );

        return $this->success(new StockTransferResource($transfer), 'Stock transfer received successfully.');
    }
}
