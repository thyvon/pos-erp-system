<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Accounting\StoreFiscalYearRequest;
use App\Http\Requests\Accounting\UpdateFiscalYearRequest;
use App\Http\Resources\Accounting\FiscalYearResource;
use App\Models\FiscalYear;
use App\Services\Accounting\FiscalYearService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FiscalYearController extends BaseApiController
{
    public function __construct(protected FiscalYearService $fiscalYears)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FiscalYear::class);

        $items = $this->fiscalYears->paginate($request->only([
            'search',
            'status',
            'per_page',
        ]));

        return $this->paginated($items, FiscalYearResource::class, [
            'summary' => $this->fiscalYears->summary(),
        ]);
    }

    public function store(StoreFiscalYearRequest $request): JsonResponse
    {
        $this->authorize('create', FiscalYear::class);

        $year = $this->fiscalYears->create(
            $request->user()->business_id,
            $request->validated()
        );

        return $this->success(new FiscalYearResource($year), 'Fiscal year created successfully.', 201);
    }

    public function show(FiscalYear $fiscalYear): JsonResponse
    {
        $this->authorize('view', $fiscalYear);

        return $this->success(new FiscalYearResource($fiscalYear->loadCount('journals')));
    }

    public function update(UpdateFiscalYearRequest $request, FiscalYear $fiscalYear): JsonResponse
    {
        $this->authorize('update', $fiscalYear);

        $year = $this->fiscalYears->update(
            $request->user()->business_id,
            $fiscalYear,
            $request->validated()
        );

        return $this->success(new FiscalYearResource($year), 'Fiscal year updated successfully.');
    }

    public function destroy(Request $request, FiscalYear $fiscalYear): JsonResponse
    {
        $this->authorize('delete', $fiscalYear);

        $this->fiscalYears->delete($request->user()->business_id, $fiscalYear);

        return $this->success(null, 'Fiscal year deleted successfully.');
    }
}
