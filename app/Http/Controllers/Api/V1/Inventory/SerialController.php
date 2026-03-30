<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\WriteOffSerialRequest;
use App\Http\Resources\Inventory\StockSerialResource;
use App\Models\StockSerial;
use App\Services\Inventory\SerialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SerialController extends BaseApiController
{
    public function __construct(protected SerialService $serialService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockSerial::class);

        $serials = $this->serialService->paginate($request->only([
            'search',
            'warehouse_id',
            'product_id',
            'status',
            'per_page',
        ]), $request->user());

        return $this->paginated($serials, StockSerialResource::class);
    }

    public function show(StockSerial $stockSerial): JsonResponse
    {
        $this->authorize('view', $stockSerial);

        return $this->success(new StockSerialResource($stockSerial->load(['product', 'variation', 'warehouse.branch', 'supplier'])));
    }

    public function writeOff(WriteOffSerialRequest $request, StockSerial $stockSerial): JsonResponse
    {
        $this->authorize('writeOff', $stockSerial);

        $serial = $this->serialService->writeOff(
            $request->user()->business_id,
            $stockSerial,
            $request->validated()['reason'],
            $request->user()
        );

        return $this->success(new StockSerialResource($serial), 'Serial written off successfully.');
    }
}
