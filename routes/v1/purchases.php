<?php

use App\Http\Controllers\Api\V1\Purchases\PurchaseController;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('purchases', [PurchaseController::class, 'index'])->middleware('can:viewAny,'.\App\Models\Purchase::class);
    Route::post('purchases', [PurchaseController::class, 'store'])->middleware('can:create,'.\App\Models\Purchase::class);
    Route::get('purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('can:view,purchase');
    Route::put('purchases/{purchase}', [PurchaseController::class, 'update'])->middleware('can:update,purchase');
    Route::delete('purchases/{purchase}', [PurchaseController::class, 'destroy'])->middleware('can:delete,purchase');
    Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->middleware('can:receive,purchase');
};
