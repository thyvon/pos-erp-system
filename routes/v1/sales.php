<?php

use App\Http\Controllers\Api\V1\Sales\CashRegisterController;
use App\Http\Controllers\Api\V1\Sales\QuotationController;
use App\Http\Controllers\Api\V1\Sales\SaleReturnController;
use App\Http\Controllers\Api\V1\Sales\SaleController;
use App\Models\CashRegister;
use App\Models\Sale;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('sales', [SaleController::class, 'index'])->middleware('can:viewAny,'.Sale::class);
    Route::post('sales', [SaleController::class, 'store'])->middleware('can:create,'.Sale::class);
    Route::get('sales/{sale}', [SaleController::class, 'show'])->middleware('can:view,sale');
    Route::put('sales/{sale}', [SaleController::class, 'update'])->middleware('can:update,sale');
    Route::delete('sales/{sale}', [SaleController::class, 'destroy'])->middleware('can:delete,sale');
    Route::post('sales/{sale}/confirm', [SaleController::class, 'confirm'])->middleware('can:confirm,sale');
    Route::post('sales/{sale}/complete', [SaleController::class, 'complete'])->middleware('can:complete,sale');
    Route::post('sales/{sale}/cancel', [SaleController::class, 'cancel'])->middleware('can:cancel,sale');
    Route::post('sales/{sale}/payments', [SaleController::class, 'recordPayment'])->middleware('can:recordPayment,sale');
    Route::post('sales/{sale}/returns', [SaleReturnController::class, 'store'])->middleware('can:recordReturn,sale');

    Route::get('sale-returns', [SaleReturnController::class, 'index'])->middleware('can:viewAny,'.\App\Models\SaleReturn::class);
    Route::get('sale-returns/{saleReturn}', [SaleReturnController::class, 'show'])->middleware('can:view,saleReturn');

    Route::get('quotations', [QuotationController::class, 'index'])->middleware('can:viewAnyQuotation');
    Route::post('quotations', [QuotationController::class, 'store'])->middleware('can:createQuotation');
    Route::get('quotations/{quotation}', [QuotationController::class, 'show'])->middleware('can:viewQuotation,quotation');
    Route::post('quotations/{quotation}/convert', [QuotationController::class, 'convert'])->middleware('can:convertQuotation,quotation');
    Route::post('quotations/{quotation}/cancel', [QuotationController::class, 'cancel'])->middleware('can:cancelQuotation,quotation');

    Route::get('cash-registers', [CashRegisterController::class, 'index'])->middleware('can:viewAny,'.CashRegister::class);
    Route::post('cash-registers', [CashRegisterController::class, 'store'])->middleware('can:create,'.CashRegister::class);
    Route::get('cash-registers/{cashRegister}', [CashRegisterController::class, 'show'])->middleware('can:view,cashRegister');
    Route::put('cash-registers/{cashRegister}', [CashRegisterController::class, 'update'])->middleware('can:update,cashRegister');
    Route::delete('cash-registers/{cashRegister}', [CashRegisterController::class, 'destroy'])->middleware('can:delete,cashRegister');
    Route::post('cash-registers/{cashRegister}/open-session', [CashRegisterController::class, 'openSession'])->middleware('can:openSession,cashRegister');
    Route::post('cash-register-sessions/{session}/close', [CashRegisterController::class, 'closeSession']);
};
