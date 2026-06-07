<?php

use App\Http\Controllers\Api\V1\Reports\ReportController;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('reports/sales', [ReportController::class, 'sales'])->middleware('can:reports.index');
    Route::get('reports/sales-returns', [ReportController::class, 'salesReturns'])->middleware('can:reports.index');
    Route::get('reports/purchases', [ReportController::class, 'purchases'])->middleware('can:reports.index');
    Route::get('reports/purchase-returns', [ReportController::class, 'purchaseReturns'])->middleware('can:reports.index');
    Route::get('reports/sale-payments', [ReportController::class, 'salePayments'])->middleware('can:reports.index');
    Route::get('reports/purchase-payments', [ReportController::class, 'purchasePayments'])->middleware('can:reports.index');
};
