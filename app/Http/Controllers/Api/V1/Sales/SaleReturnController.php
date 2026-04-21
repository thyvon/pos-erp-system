<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Sales\StoreSaleReturnRequest;
use App\Http\Resources\Sales\SaleReturnResource;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Services\Sales\SaleReturnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleReturnController extends BaseApiController
{
    public function __construct(protected SaleReturnService $saleReturns)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SaleReturn::class);

        $items = $this->saleReturns->paginate($request->only([
            'search',
            'sale_id',
            'branch_id',
            'warehouse_id',
            'date_from',
            'date_to',
            'per_page',
        ]));

        return $this->paginated($items, SaleReturnResource::class);
    }

    public function store(StoreSaleReturnRequest $request, Sale $sale): JsonResponse
    {
        $this->authorize('recordReturn', $sale);

        $saleReturn = $this->saleReturns->create(
            $request->user()->business_id,
            $sale,
            $request->validated(),
            $request->user()
        );

        return $this->success(new SaleReturnResource($saleReturn), 'Sale return recorded successfully.', 201);
    }

    public function show(SaleReturn $saleReturn): JsonResponse
    {
        $this->authorize('view', $saleReturn);

        return $this->success(new SaleReturnResource($saleReturn));
    }
}
