<?php

namespace App\Http\Controllers\Api\V1\Purchases;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Purchases\DeletePurchasePaymentRequest;
use App\Http\Requests\Purchases\ReceivePurchaseRequest;
use App\Http\Requests\Purchases\StorePurchasePaymentRequest;
use App\Http\Requests\Purchases\StorePurchaseRequest;
use App\Http\Requests\Purchases\UpdatePurchasePaymentRequest;
use App\Http\Requests\Purchases\UpdatePurchaseRequest;
use App\Http\Resources\Purchases\PurchasePaymentResource;
use App\Http\Resources\Purchases\PurchaseResource;
use App\Http\Resources\Accounting\JournalResource;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use App\Services\Purchases\PurchasePaymentService;
use App\Services\Purchases\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends BaseApiController
{
    public function __construct(protected PurchaseService $purchases)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Purchase::class);

        $purchases = $this->purchases->paginate($request->only([
            'search',
            'branch_id',
            'warehouse_id',
            'supplier_id',
            'status',
            'payment_status',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($purchases, PurchaseResource::class);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $this->authorize('create', Purchase::class);

        $purchase = $this->purchases->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PurchaseResource($purchase), 'Purchase created successfully.', 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $this->authorize('view', $purchase);

        return $this->success(new PurchaseResource(
            $purchase->load(['branch', 'warehouse.branch', 'supplier', 'creator', 'receiver', 'items.product.unit', 'items.variation', 'items.subUnit', 'items.taxRate', 'payments.paymentAccount', 'payments.replacedPayment', 'payments.reverser'])
        ));
    }

    public function update(UpdatePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('update', $purchase);

        $purchase = $this->purchases->update(
            $request->user()->business_id,
            $purchase,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PurchaseResource($purchase), 'Purchase updated successfully.');
    }

    public function destroy(Request $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('delete', $purchase);

        $this->purchases->delete($request->user()->business_id, $purchase, $request->user());

        return $this->success(null, 'Purchase deleted successfully.');
    }

    public function receive(ReceivePurchaseRequest $request, Purchase $purchase): JsonResponse
    {
        $this->authorize('receive', $purchase);

        $purchase = $this->purchases->receive(
            $request->user()->business_id,
            $purchase,
            $request->validated(),
            $request->user()
        );

        return $this->success(new PurchaseResource($purchase), 'Purchase received successfully.');
    }

    public function recordPayment(StorePurchasePaymentRequest $request, Purchase $purchase, PurchasePaymentService $purchasePayments): JsonResponse
    {
        $this->authorize('recordPayment', $purchase);

        $result = $purchasePayments->record(
            $request->user()->business_id,
            $purchase,
            $request->validated(),
            $request->user()
        );

        return $this->success([
            'purchase' => new PurchaseResource($result['purchase']),
            'payment' => new PurchasePaymentResource($result['payment']),
            'payments' => PurchasePaymentResource::collection($result['payments']),
            'journal' => new JournalResource($result['journal']),
            'journals' => JournalResource::collection($result['journals']),
        ], 'Purchase payment recorded successfully.', 201);
    }

    public function updatePayment(
        UpdatePurchasePaymentRequest $request,
        Purchase $purchase,
        PurchasePayment $purchasePayment,
        PurchasePaymentService $purchasePayments
    ): JsonResponse {
        $this->authorize('updatePayment', $purchase);

        $result = $purchasePayments->correct(
            $request->user()->business_id,
            $purchase,
            $purchasePayment,
            $request->validated(),
            $request->user()
        );

        return $this->success([
            'purchase' => new PurchaseResource($result['purchase']),
            'payment' => new PurchasePaymentResource($result['payment']),
            'reversed_payment' => new PurchasePaymentResource($result['reversed_payment']),
            'journal' => new JournalResource($result['journal']),
            'reversal_journal' => new JournalResource($result['reversal_journal']),
        ], 'Purchase payment updated successfully.');
    }

    public function deletePayment(
        DeletePurchasePaymentRequest $request,
        Purchase $purchase,
        PurchasePayment $purchasePayment,
        PurchasePaymentService $purchasePayments
    ): JsonResponse {
        $this->authorize('deletePayment', $purchase);

        $result = $purchasePayments->remove(
            $request->user()->business_id,
            $purchase,
            $purchasePayment,
            $request->validated()['reason'] ?? 'Payment line removed',
            $request->user()
        );

        return $this->success([
            'purchase' => new PurchaseResource($result['purchase']),
            'reversed_payment' => new PurchasePaymentResource($result['reversed_payment']),
            'reversal_journal' => new JournalResource($result['reversal_journal']),
        ], 'Purchase payment deleted successfully.');
    }
}
