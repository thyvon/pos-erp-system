<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Exports\StockOpeningBalanceTemplateExport;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Inventory\ImportStockOpeningBalanceRequest;
use App\Http\Requests\Inventory\StoreStockOpeningBalanceRequest;
use App\Http\Resources\Inventory\StockOpeningBalanceResource;
use App\Imports\StockOpeningBalanceImport;
use App\Models\StockOpeningBalance;
use App\Services\Inventory\StockOpeningBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StockOpeningBalanceController extends BaseApiController
{
    public function __construct(protected StockOpeningBalanceService $openingBalances)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StockOpeningBalance::class);

        $balances = $this->openingBalances->paginate($request->only([
            'search',
            'warehouse_id',
            'date_from',
            'date_to',
            'per_page',
        ]), $request->user());

        return $this->paginated($balances, StockOpeningBalanceResource::class);
    }

    public function store(StoreStockOpeningBalanceRequest $request): JsonResponse
    {
        $this->authorize('create', StockOpeningBalance::class);

        $balance = $this->openingBalances->create(
            $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new StockOpeningBalanceResource($balance), 'Stock opening balance created successfully.', 201);
    }

    public function show(StockOpeningBalance $stockOpeningBalance): JsonResponse
    {
        $this->authorize('view', $stockOpeningBalance);

        return $this->success(new StockOpeningBalanceResource(
            $stockOpeningBalance->load(['warehouse.branch', 'creator', 'items.product', 'items.variation', 'items.lot', 'items.serial'])
        ));
    }

    public function downloadTemplate(): BinaryFileResponse
    {
        $this->authorize('create', StockOpeningBalance::class);

        return Excel::download(new StockOpeningBalanceTemplateExport, 'opening-stock-import-template.xlsx');
    }

    public function import(ImportStockOpeningBalanceRequest $request): JsonResponse
    {
        $this->authorize('create', StockOpeningBalance::class);

        $data = $request->validated();

        $import = new StockOpeningBalanceImport(
            (string) $request->user()->business_id,
            $this->openingBalances,
            $data['warehouse_id'],
            $data['date'],
            $data['notes'] ?? null,
            $request->user()
        );

        Excel::import($import, $request->file('file'));

        return $this->success([
            'imported' => $import->getImportedCount(),
            'skipped' => $import->getSkippedCount(),
            'errors' => $import->getErrors(),
        ], 'Import completed.');
    }
}
