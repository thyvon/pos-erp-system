<?php

namespace App\Http\Controllers\Api\V1\Sales;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Sales\CancelSaleRequest;
use App\Http\Requests\Sales\CompleteSaleRequest;
use App\Http\Requests\Sales\ConfirmSaleRequest;
use App\Http\Requests\Sales\StoreSalePaymentRequest;
use App\Http\Requests\Sales\StoreSaleRequest;
use App\Http\Requests\Sales\UpdateSaleRequest;
use App\Http\Resources\Accounting\JournalResource;
use App\Http\Resources\Sales\SalePaymentResource;
use App\Http\Resources\Sales\SaleResource;
use App\Models\Sale;
use App\Services\Sales\SalePaymentService;
use App\Services\Sales\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaleController extends BaseApiController
{
    public function __construct(protected SaleService $sales)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Sale::class);

        $items = $this->sales->paginate($request->only([
            'search',
            'status',
            'type',
            'branch_id',
            'warehouse_id',
            'customer_id',
            'date_from',
            'date_to',
            'per_page',
        ]));

        return $this->paginated($items, SaleResource::class);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $this->authorize('create', Sale::class);

        $sale = $this->sales->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new SaleResource($sale), 'Sale created successfully.', 201);
    }

    public function show(Sale $sale): JsonResponse
    {
        $this->authorize('view', $sale);

        return $this->success(new SaleResource($sale));
    }

    public function update(UpdateSaleRequest $request, Sale $sale): JsonResponse
    {
        $this->authorize('update', $sale);

        $sale = $this->sales->update(
            $request->user()->business_id,
            $sale,
            $request->validated(),
            $request->user()
        );

        return $this->success(new SaleResource($sale), 'Sale updated successfully.');
    }

    public function destroy(Sale $sale): JsonResponse
    {
        $this->authorize('delete', $sale);

        $this->sales->delete(
            request()->user()->business_id,
            $sale,
            request()->user()
        );

        return $this->success(null, 'Sale deleted successfully.');
    }

    public function confirm(ConfirmSaleRequest $request, Sale $sale): JsonResponse
    {
        $this->authorize('confirm', $sale);

        $sale = $this->sales->confirm($request->user()->business_id, $sale, $request->user());

        return $this->success(new SaleResource($sale), 'Sale confirmed successfully.');
    }

    public function complete(CompleteSaleRequest $request, Sale $sale): JsonResponse
    {
        $this->authorize('complete', $sale);

        $sale = $this->sales->complete($request->user()->business_id, $sale, $request->user());

        return $this->success(new SaleResource($sale), 'Sale completed successfully.');
    }

    public function cancel(CancelSaleRequest $request, Sale $sale): JsonResponse
    {
        $this->authorize('cancel', $sale);

        $sale = $this->sales->cancel(
            $request->user()->business_id,
            $sale,
            $request->validated()['reason'] ?? null,
            $request->user()
        );

        return $this->success(new SaleResource($sale), 'Sale cancelled successfully.');
    }

    public function recordPayment(StoreSalePaymentRequest $request, Sale $sale, SalePaymentService $salePayments): JsonResponse
    {
        $this->authorize('recordPayment', $sale);

        $result = $salePayments->record(
            $request->user()->business_id,
            $sale,
            $request->validated(),
            $request->user()
        );

        return $this->success([
            'sale' => new SaleResource($result['sale']),
            'payment' => new SalePaymentResource($result['payment']),
            'journal' => new JournalResource($result['journal']),
        ], 'Sale payment recorded successfully.', 201);
    }
}
