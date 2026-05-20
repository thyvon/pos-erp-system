<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Inventory\StockLevelResource;
use App\Models\StockLevel;
use App\Services\Inventory\StockLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockLevelController extends BaseApiController
{
    public function __construct(protected StockLevelService $stockLevelService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockLevel::class);

        $stockLevels = $this->stockLevelService->paginate($request->only([
            'search',
            'warehouse_id',
            'product_id',
            'variation_id',
            'per_page',
        ]), $request->user());

        return $this->paginated($stockLevels, StockLevelResource::class);
    }

    public function show(StockLevel $stockLevel): JsonResponse
    {
        $this->authorize('view', $stockLevel);

        return $this->success(new StockLevelResource($stockLevel->load(['product', 'variation', 'warehouse.branch'])));
    }
}
