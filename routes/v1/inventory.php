<?php

use App\Http\Controllers\Api\V1\Inventory\InventoryOptionsController;
use App\Http\Controllers\Api\V1\Inventory\InventoryProductLookupController;
use App\Http\Controllers\Api\V1\Inventory\LotController;
use App\Http\Controllers\Api\V1\Inventory\SerialController;
use App\Http\Controllers\Api\V1\Inventory\StockAdjustmentController;
use App\Http\Controllers\Api\V1\Inventory\StockCountController;
use App\Http\Controllers\Api\V1\Inventory\StockTransferController;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('inventory/options', InventoryOptionsController::class)->middleware('can:inventory.index');
    Route::get('inventory/product-lookup', InventoryProductLookupController::class)->middleware('can:inventory.index');

    Route::get('inventory/adjustments', [StockAdjustmentController::class, 'index'])->middleware('can:inventory.index');
    Route::post('inventory/adjustments', [StockAdjustmentController::class, 'store'])->middleware('can:inventory.adjust');
    Route::get('inventory/adjustments/{stockAdjustment}', [StockAdjustmentController::class, 'show'])->middleware('can:inventory.index');

    Route::get('inventory/lots', [LotController::class, 'index'])->middleware('can:inventory.index');
    Route::get('inventory/lots/{stockLot}', [LotController::class, 'show'])->middleware('can:inventory.index');
    Route::post('inventory/lots/{stockLot}/status', [LotController::class, 'updateStatus'])->middleware('can:inventory.adjust');

    Route::get('inventory/serials', [SerialController::class, 'index'])->middleware('can:inventory.index');
    Route::get('inventory/serials/{stockSerial}', [SerialController::class, 'show'])->middleware('can:inventory.index');
    Route::post('inventory/serials/{stockSerial}/write-off', [SerialController::class, 'writeOff'])->middleware('can:inventory.adjust');

    Route::get('inventory/transfers', [StockTransferController::class, 'index'])->middleware('can:inventory.index');
    Route::post('inventory/transfers', [StockTransferController::class, 'store'])->middleware('can:inventory.transfer');
    Route::get('inventory/transfers/{stockTransfer}', [StockTransferController::class, 'show'])->middleware('can:inventory.index');

    Route::get('inventory/counts', [StockCountController::class, 'index'])->middleware('can:inventory.index');
    Route::post('inventory/counts', [StockCountController::class, 'store'])->middleware('can:inventory.count');
    Route::get('inventory/counts/{stockCount}', [StockCountController::class, 'show'])->middleware('can:inventory.index');
    Route::get('inventory/counts/{stockCount}/items', [StockCountController::class, 'items'])->middleware('can:inventory.index');
    Route::post('inventory/counts/{stockCount}/entries', [StockCountController::class, 'addEntry'])->middleware('can:inventory.count');
    Route::post('inventory/counts/{stockCount}/items/{stockCountItem}', [StockCountController::class, 'updateItem'])->middleware('can:inventory.count');
    Route::post('inventory/counts/{stockCount}/complete', [StockCountController::class, 'complete'])->middleware('can:inventory.count');
};
