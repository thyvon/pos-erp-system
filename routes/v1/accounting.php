<?php

use App\Http\Controllers\Api\V1\Accounting\ChartOfAccountController;
use App\Http\Controllers\Api\V1\Accounting\FiscalYearController;
use App\Http\Controllers\Api\V1\Accounting\JournalController;
use App\Http\Controllers\Api\V1\Accounting\PaymentAccountController;
use App\Models\ChartOfAccount;
use App\Models\FiscalYear;
use App\Models\Journal;
use App\Models\PaymentAccount;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('accounting/chart-of-accounts', [ChartOfAccountController::class, 'index'])->middleware('can:viewAny,'.ChartOfAccount::class);
    Route::post('accounting/chart-of-accounts', [ChartOfAccountController::class, 'store'])->middleware('can:create,'.ChartOfAccount::class);
    Route::get('accounting/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'show'])->middleware('can:view,chartOfAccount');
    Route::put('accounting/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'update'])->middleware('can:update,chartOfAccount');
    Route::delete('accounting/chart-of-accounts/{chartOfAccount}', [ChartOfAccountController::class, 'destroy'])->middleware('can:delete,chartOfAccount');

    Route::get('accounting/journals', [JournalController::class, 'index'])->middleware('can:viewAny,'.Journal::class);
    Route::post('accounting/journals', [JournalController::class, 'store'])->middleware('can:create,'.Journal::class);
    Route::get('accounting/journals/{journal}', [JournalController::class, 'show'])->middleware('can:view,journal');
    Route::post('accounting/journals/{journal}/reverse', [JournalController::class, 'reverse'])->middleware('can:reverse,journal');

    Route::get('accounting/payment-accounts', [PaymentAccountController::class, 'index'])->middleware('can:viewAny,'.PaymentAccount::class);
    Route::post('accounting/payment-accounts', [PaymentAccountController::class, 'store'])->middleware('can:create,'.PaymentAccount::class);
    Route::get('accounting/payment-accounts/{paymentAccount}', [PaymentAccountController::class, 'show'])->middleware('can:view,paymentAccount');
    Route::put('accounting/payment-accounts/{paymentAccount}', [PaymentAccountController::class, 'update'])->middleware('can:update,paymentAccount');
    Route::delete('accounting/payment-accounts/{paymentAccount}', [PaymentAccountController::class, 'destroy'])->middleware('can:delete,paymentAccount');
    Route::post('accounting/payment-accounts/transfer', [PaymentAccountController::class, 'transfer'])->middleware('can:transfer,'.PaymentAccount::class);

    Route::get('accounting/fiscal-years', [FiscalYearController::class, 'index'])->middleware('can:viewAny,'.FiscalYear::class);
    Route::post('accounting/fiscal-years', [FiscalYearController::class, 'store'])->middleware('can:create,'.FiscalYear::class);
    Route::get('accounting/fiscal-years/{fiscalYear}', [FiscalYearController::class, 'show'])->middleware('can:view,fiscalYear');
    Route::put('accounting/fiscal-years/{fiscalYear}', [FiscalYearController::class, 'update'])->middleware('can:update,fiscalYear');
    Route::delete('accounting/fiscal-years/{fiscalYear}', [FiscalYearController::class, 'destroy'])->middleware('can:delete,fiscalYear');
};
