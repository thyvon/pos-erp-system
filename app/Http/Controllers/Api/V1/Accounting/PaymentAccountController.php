<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Accounting\StorePaymentAccountRequest;
use App\Http\Requests\Accounting\TransferPaymentAccountRequest;
use App\Http\Requests\Accounting\UpdatePaymentAccountRequest;
use App\Http\Resources\Accounting\JournalResource;
use App\Http\Resources\Accounting\PaymentAccountResource;
use App\Models\PaymentAccount;
use App\Services\Accounting\PaymentAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentAccountController extends BaseApiController
{
    public function __construct(protected PaymentAccountService $paymentAccounts)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', PaymentAccount::class);

        $items = $this->paymentAccounts->paginate($request->only([
            'search',
            'type',
            'status',
            'per_page',
        ]));

        return $this->paginated($items, PaymentAccountResource::class, [
            'summary' => $this->paymentAccounts->summary(),
        ]);
    }

    public function store(StorePaymentAccountRequest $request): JsonResponse
    {
        $this->authorize('create', PaymentAccount::class);

        $account = $this->paymentAccounts->create(
            $request->user()->business_id,
            $request->validated()
        );

        return $this->success(new PaymentAccountResource($account), 'Payment account created successfully.', 201);
    }

    public function show(PaymentAccount $paymentAccount): JsonResponse
    {
        $this->authorize('view', $paymentAccount);

        return $this->success(new PaymentAccountResource($paymentAccount->load(['chartOfAccount'])->loadCount('transactions')));
    }

    public function update(UpdatePaymentAccountRequest $request, PaymentAccount $paymentAccount): JsonResponse
    {
        $this->authorize('update', $paymentAccount);

        $account = $this->paymentAccounts->update(
            $request->user()->business_id,
            $paymentAccount,
            $request->validated()
        );

        return $this->success(new PaymentAccountResource($account), 'Payment account updated successfully.');
    }

    public function destroy(Request $request, PaymentAccount $paymentAccount): JsonResponse
    {
        $this->authorize('delete', $paymentAccount);

        $this->paymentAccounts->delete($request->user()->business_id, $paymentAccount);

        return $this->success(null, 'Payment account deleted successfully.');
    }

    public function transfer(TransferPaymentAccountRequest $request): JsonResponse
    {
        $this->authorize('transfer', PaymentAccount::class);

        $result = $this->paymentAccounts->transfer(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success([
            'journal' => new JournalResource($result['journal']),
            'from_account' => new PaymentAccountResource($result['from_account']),
            'to_account' => new PaymentAccountResource($result['to_account']),
        ], 'Payment account transfer completed successfully.');
    }
}
