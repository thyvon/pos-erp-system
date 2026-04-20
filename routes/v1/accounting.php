<?php

use App\Http\Controllers\Api\V1\Accounting\ChartOfAccountController;
use App\Http\Controllers\Api\V1\Accounting\FiscalYearController;
use App\Http\Controllers\Api\V1\Accounting\JournalController;
use App\Http\Controllers\Api\V1\Accounting\PaymentAccountController;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('accounting/chart-of-accounts', [ChartOfAccountController::class, 'index']);
    Route::post('accounting/chart-of-accounts', [ChartOfAccountController::class, 'store']);
    Route::get('accounting/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'show']);
    Route::put('accounting/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'update']);
    Route::delete('accounting/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'destroy']);

    Route::get('accounting/journals', [JournalController::class, 'index']);
    Route::post('accounting/journals', [JournalController::class, 'store']);
    Route::get('accounting/journals/{journal}', [JournalController::class, 'show']);
    Route::post('accounting/journals/{journal}/reverse', [JournalController::class, 'reverse']);

    Route::get('accounting/payment-accounts', [PaymentAccountController::class, 'index']);
    Route::post('accounting/payment-accounts', [PaymentAccountController::class, 'store']);
    Route::get('accounting/payment-accounts/{paymentAccount}', [PaymentAccountController::class, 'show']);
    Route::put('accounting/payment-accounts/{paymentAccount}', [PaymentAccountController::class, 'update']);
    Route::delete('accounting/payment-accounts/{paymentAccount}', [PaymentAccountController::class, 'destroy']);
    Route::post('accounting/payment-accounts/transfer', [PaymentAccountController::class, 'transfer']);

    Route::get('accounting/fiscal-years', [FiscalYearController::class, 'index']);
    Route::post('accounting/fiscal-years', [FiscalYearController::class, 'store']);
    Route::get('accounting/fiscal-years/{fiscalYear}', [FiscalYearController::class, 'show']);
    Route::put('accounting/fiscal-years/{fiscalYear}', [FiscalYearController::class, 'update']);
    Route::delete('accounting/fiscal-years/{fiscalYear}', [FiscalYearController::class, 'destroy']);
};
