<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Accounting\StoreExchangeRateRequest;
use App\Http\Requests\Accounting\UpdateExchangeRateRequest;
use App\Http\Resources\Accounting\ExchangeRateResource;
use App\Models\ExchangeRate;
use App\Services\Accounting\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeRateController extends BaseApiController
{
    public function __construct(protected ExchangeRateService $exchangeRates)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExchangeRate::class);

        $items = $this->exchangeRates->paginate($request->only([
            'search',
            'from_currency',
            'to_currency',
            'is_default',
            'per_page',
        ]));

        return $this->paginated($items, ExchangeRateResource::class, [
            'summary' => $this->exchangeRates->summary(),
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExchangeRate::class);

        $rate = $this->exchangeRates->defaultRate(
            $request->user()->business_id,
            (string) $request->query('from_currency', 'USD'),
            (string) $request->query('to_currency', 'KHR')
        );

        return $this->success($rate ? new ExchangeRateResource($rate) : null);
    }

    public function store(StoreExchangeRateRequest $request): JsonResponse
    {
        $this->authorize('create', ExchangeRate::class);

        $rate = $this->exchangeRates->create(
            $request->user()->business_id,
            $request->validated()
        );

        return $this->success(new ExchangeRateResource($rate), 'Exchange rate created successfully.', 201);
    }

    public function show(ExchangeRate $exchangeRate): JsonResponse
    {
        $this->authorize('view', $exchangeRate);

        return $this->success(new ExchangeRateResource($exchangeRate));
    }

    public function update(UpdateExchangeRateRequest $request, ExchangeRate $exchangeRate): JsonResponse
    {
        $this->authorize('update', $exchangeRate);

        $rate = $this->exchangeRates->update(
            $request->user()->business_id,
            $exchangeRate,
            $request->validated()
        );

        return $this->success(new ExchangeRateResource($rate), 'Exchange rate updated successfully.');
    }

    public function destroy(Request $request, ExchangeRate $exchangeRate): JsonResponse
    {
        $this->authorize('delete', $exchangeRate);

        $this->exchangeRates->delete($request->user()->business_id, $exchangeRate);

        return $this->success(null, 'Exchange rate deleted successfully.');
    }
}
