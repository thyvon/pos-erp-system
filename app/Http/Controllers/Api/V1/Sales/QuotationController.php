<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Sales\CancelSaleRequest;
use App\Http\Requests\Sales\ConvertQuotationRequest;
use App\Http\Requests\Sales\StoreQuotationRequest;
use App\Http\Resources\Sales\SaleResource;
use App\Models\Sale;
use App\Services\Sales\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuotationController extends BaseApiController
{
    public function __construct(protected QuotationService $quotations)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAnyQuotation');

        $items = $this->quotations->paginate($request->only([
            'search',
            'status',
            'branch_id',
            'warehouse_id',
            'customer_id',
            'date_from',
            'date_to',
            'per_page',
        ]));

        return $this->paginated($items, SaleResource::class);
    }

    public function store(StoreQuotationRequest $request): JsonResponse
    {
        $this->authorize('createQuotation');

        $quotation = $this->quotations->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new SaleResource($quotation), 'Quotation created successfully.', 201);
    }

    public function show(Sale $quotation): JsonResponse
    {
        $this->authorize('viewQuotation', $quotation);

        return $this->success(new SaleResource($quotation));
    }

    public function convert(ConvertQuotationRequest $request, Sale $quotation): JsonResponse
    {
        $this->authorize('convertQuotation', $quotation);

        $result = $this->quotations->convert(
            $request->user()->business_id,
            $quotation,
            $request->validated(),
            $request->user()
        );

        return $this->success([
            'quotation' => new SaleResource($result['quotation']),
            'sale' => new SaleResource($result['sale']),
        ], 'Quotation converted successfully.');
    }

    public function cancel(CancelSaleRequest $request, Sale $quotation): JsonResponse
    {
        $this->authorize('cancelQuotation', $quotation);

        $quotation = $this->quotations->cancel(
            $request->user()->business_id,
            $quotation,
            $request->validated()['reason'] ?? null,
            $request->user()
        );

        return $this->success(new SaleResource($quotation), 'Quotation cancelled successfully.');
    }
}
