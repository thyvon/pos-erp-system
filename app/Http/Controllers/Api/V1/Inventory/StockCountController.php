<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\CompleteStockCountRequest;
use App\Http\Requests\Inventory\StoreStockCountRequest;
use App\Http\Requests\Inventory\StoreStockCountEntryRequest;
use App\Http\Requests\Inventory\UpdateStockCountItemRequest;
use App\Http\Resources\Inventory\StockCountResource;
use App\Models\StockCount;
use App\Models\StockCountItem;
use App\Services\Inventory\StockCountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockCountController extends BaseApiController
{
    public function __construct(protected StockCountService $countService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockCount::class);

        $counts = $this->countService->paginate($request->only([
            'search',
            'warehouse_id',
            'status',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($counts, StockCountResource::class);
    }

    public function store(StoreStockCountRequest $request): JsonResponse
    {
        $this->authorize('create', StockCount::class);

        $count = $this->countService->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockCountResource($count), 'Stock count started successfully.', 201);
    }

    public function show(StockCount $stockCount): JsonResponse
    {
        $this->authorize('view', $stockCount);

        return $this->success(new StockCountResource(
            $stockCount->load(['warehouse.branch', 'creator', 'completer', 'items.product', 'items.variation'])
        ));
    }

    public function addEntry(StoreStockCountEntryRequest $request, StockCount $stockCount): JsonResponse
    {
        $this->authorize('record', $stockCount);

        $count = $this->countService->recordEntry(
            $request->user()->business_id,
            $stockCount,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockCountResource($count), 'Count entry recorded successfully.');
    }

    public function updateItem(UpdateStockCountItemRequest $request, StockCount $stockCount, StockCountItem $stockCountItem): JsonResponse
    {
        $this->authorize('record', $stockCount);

        $count = $this->countService->updateItemCountedQuantity(
            $request->user()->business_id,
            $stockCount,
            $stockCountItem,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockCountResource($count), 'Counted quantity updated successfully.');
    }

    public function complete(CompleteStockCountRequest $request, StockCount $stockCount): JsonResponse
    {
        $this->authorize('complete', $stockCount);

        $count = $this->countService->complete(
            $request->user()->business_id,
            $stockCount,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockCountResource($count), 'Stock count completed successfully.');
    }
}
