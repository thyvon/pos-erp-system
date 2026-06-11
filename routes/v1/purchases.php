<?php

use App\Http\Controllers\Api\V1\Purchases\PurchaseController;
use App\Http\Controllers\Api\V1\Purchases\PurchaseReturnController;
use App\Models\Purchase;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('purchases', [PurchaseController::class, 'index'])->middleware('can:viewAny,'.Purchase::class);
    Route::post('purchases', [PurchaseController::class, 'store'])->middleware('can:create,'.Purchase::class);
    Route::get('purchases/next-lot-number', [PurchaseController::class, 'nextLotNumber'])->middleware('can:create,'.Purchase::class);
    Route::get('purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('can:view,purchase');
    Route::put('purchases/{purchase}', [PurchaseController::class, 'update'])->middleware('can:update,purchase');
    Route::delete('purchases/{purchase}', [PurchaseController::class, 'destroy'])->middleware('can:delete,purchase');
    Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->middleware('can:receive,purchase');
    Route::get('purchases/{purchase}/receives/{purchaseReceive}', [PurchaseController::class, 'showReceive'])->middleware('can:manageReceives,purchase');
    Route::put('purchases/{purchase}/receives/{purchaseReceive}', [PurchaseController::class, 'updateReceive'])->middleware('can:manageReceives,purchase');
    Route::delete('purchases/{purchase}/receives/{purchaseReceive}', [PurchaseController::class, 'deleteReceive'])->middleware('can:manageReceives,purchase');
    Route::delete('purchases/{purchase}/receives/{purchaseReceive}/items/{item}', [PurchaseController::class, 'deleteReceiveItem'])->middleware('can:manageReceives,purchase');
    Route::post('purchases/{purchase}/payments', [PurchaseController::class, 'recordPayment'])->middleware('can:recordPayment,purchase');
    Route::put('purchases/{purchase}/payments/{purchasePayment}', [PurchaseController::class, 'updatePayment'])->middleware('can:updatePayment,purchase');
    Route::delete('purchases/{purchase}/payments/{purchasePayment}', [PurchaseController::class, 'deletePayment'])->middleware('can:deletePayment,purchase');

    Route::get('purchase-returns', [PurchaseReturnController::class, 'index'])->middleware('can:purchases.return');
    Route::get('purchase-returns/{purchaseReturn}', [PurchaseReturnController::class, 'show'])->middleware('can:purchases.return');
    Route::post('purchases/{purchase}/returns', [PurchaseReturnController::class, 'store'])->middleware('can:purchases.return');
};
