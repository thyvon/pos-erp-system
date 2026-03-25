<?php

use App\Http\Controllers\Api\V1\Catalog\PriceGroupController;
use Illuminate\Support\Facades\Route;

return static function (): void {
    /*
    |--------------------------------------------------------------------------
    | Phase 6 Catalog Routes
    |--------------------------------------------------------------------------
    |
    | Catalog modules start here. Endpoints stay under /api/v1 so they remain
    | consistent with the current SPA, but the route definitions live in their
    | own file from the first catalog module onward.
    |
    */

    Route::get('price-groups', [PriceGroupController::class, 'index'])->middleware('can:price_groups.index');
    Route::post('price-groups', [PriceGroupController::class, 'store'])->middleware('can:price_groups.create');
    Route::get('price-groups/{priceGroup}', [PriceGroupController::class, 'show'])->middleware('can:price_groups.index');
    Route::put('price-groups/{priceGroup}', [PriceGroupController::class, 'update'])->middleware('can:price_groups.edit');
    Route::delete('price-groups/{priceGroup}', [PriceGroupController::class, 'destroy'])->middleware('can:price_groups.delete');
};
