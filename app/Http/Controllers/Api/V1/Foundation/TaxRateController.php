<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreTaxRateRequest;
use App\Http\Requests\Foundation\UpdateTaxRateRequest;
use App\Http\Resources\Foundation\TaxRateResource;
use App\Models\TaxRate;
use App\Services\Foundation\TaxRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaxRateController extends BaseApiController
{
    public function __construct(protected TaxRateService $taxRates)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TaxRate::class);

        $items = $this->taxRates->paginate($request->only([
            'search',
            'type',
            'is_active',
            'per_page',
        ]));

        return $this->paginated($items, TaxRateResource::class);
    }

    public function store(StoreTaxRateRequest $request): JsonResponse
    {
        $this->authorize('create', TaxRate::class);

        $taxRate = $this->taxRates->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new TaxRateResource($taxRate), 'Tax rate created successfully.', 201);
    }

    public function show(TaxRate $taxRate): JsonResponse
    {
        $this->authorize('view', $taxRate);

        return $this->success(new TaxRateResource($taxRate));
    }

    public function update(UpdateTaxRateRequest $request, TaxRate $taxRate): JsonResponse
    {
        $this->authorize('update', $taxRate);

        $taxRate = $this->taxRates->update(
            (string) $request->user()->business_id,
            $taxRate,
            $request->validated(),
            $request->user()
        );

        return $this->success(new TaxRateResource($taxRate), 'Tax rate updated successfully.');
    }

    public function destroy(Request $request, TaxRate $taxRate): JsonResponse
    {
        $this->authorize('delete', $taxRate);

        $this->taxRates->delete(
            (string) $request->user()->business_id,
            $taxRate,
            $request->user()
        );

        return $this->success(null, 'Tax rate deleted successfully.');
    }
}
