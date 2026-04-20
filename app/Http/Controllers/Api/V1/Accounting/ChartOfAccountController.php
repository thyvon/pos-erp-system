<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Accounting\StoreChartOfAccountRequest;
use App\Http\Requests\Accounting\UpdateChartOfAccountRequest;
use App\Http\Resources\Accounting\ChartOfAccountResource;
use App\Models\ChartOfAccount;
use App\Services\Accounting\ChartOfAccountService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChartOfAccountController extends BaseApiController
{
    public function __construct(protected ChartOfAccountService $chartOfAccounts)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ChartOfAccount::class);

        $items = $this->chartOfAccounts->paginate($request->only([
            'search',
            'type',
            'status',
            'per_page',
        ]));

        return $this->paginated($items, ChartOfAccountResource::class, [
            'summary' => $this->chartOfAccounts->summary(),
        ]);
    }

    public function store(StoreChartOfAccountRequest $request): JsonResponse
    {
        $this->authorize('create', ChartOfAccount::class);

        $account = $this->chartOfAccounts->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new ChartOfAccountResource($account), 'Chart of account created successfully.', 201);
    }

    public function show(ChartOfAccount $chartOfAccount): JsonResponse
    {
        $this->authorize('view', $chartOfAccount);

        return $this->success(new ChartOfAccountResource(
            $chartOfAccount->load(['parent'])->loadCount(['children', 'journalEntries', 'paymentAccounts'])
        ));
    }

    public function update(UpdateChartOfAccountRequest $request, ChartOfAccount $chartOfAccount): JsonResponse
    {
        $this->authorize('update', $chartOfAccount);

        $account = $this->chartOfAccounts->update(
            $request->user()->business_id,
            $chartOfAccount,
            $request->validated(),
            $request->user()
        );

        return $this->success(new ChartOfAccountResource($account), 'Chart of account updated successfully.');
    }

    public function destroy(Request $request, ChartOfAccount $chartOfAccount): JsonResponse
    {
        $this->authorize('delete', $chartOfAccount);

        $this->chartOfAccounts->delete(
            $request->user()->business_id,
            $chartOfAccount,
            $request->user()
        );

        return $this->success(null, 'Chart of account deleted successfully.');
    }
}
