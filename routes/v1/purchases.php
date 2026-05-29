<?php

use App\Http\Controllers\Api\V1\Purchases\PurchaseController;
use App\Models\Purchase;
use App\Models\PurchasePayment;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('purchases', [PurchaseController::class, 'index'])->middleware('can:viewAny,'.Purchase::class);
    Route::post('purchases', [PurchaseController::class, 'store'])->middleware('can:create,'.Purchase::class);
    Route::get('purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('can:view,purchase');
    Route::put('purchases/{purchase}', [PurchaseController::class, 'update'])->middleware('can:update,purchase');
    Route::delete('purchases/{purchase}', [PurchaseController::class, 'destroy'])->middleware('can:delete,purchase');
    Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->middleware('can:receive,purchase');
    Route::post('purchases/{purchase}/payments', [PurchaseController::class, 'recordPayment'])->middleware('can:recordPayment,purchase');
    Route::put('purchases/{purchase}/payments/{purchasePayment}', [PurchaseController::class, 'updatePayment'])->middleware('can:updatePayment,purchase');
    Route::delete('purchases/{purchase}/payments/{purchasePayment}', [PurchaseController::class, 'deletePayment'])->middleware('can:deletePayment,purchase');
};
