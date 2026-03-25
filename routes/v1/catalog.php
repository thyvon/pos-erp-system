<?php

use App\Http\Controllers\Api\V1\Catalog\CategoryController;
use App\Http\Controllers\Api\V1\Catalog\BrandController;
use App\Http\Controllers\Api\V1\Catalog\UnitController;
use App\Http\Controllers\Api\V1\Catalog\VariationTemplateController;
use App\Http\Controllers\Api\V1\Catalog\RackLocationController;
use App\Http\Controllers\Api\V1\Catalog\PriceGroupController;
use App\Http\Controllers\Api\V1\Catalog\ProductController;
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

    Route::get('categories/options', [CategoryController::class, 'options'])->middleware('can:categories.index');
    Route::get('categories', [CategoryController::class, 'index'])->middleware('can:categories.index');
    Route::post('categories', [CategoryController::class, 'store'])->middleware('can:categories.create');
    Route::get('categories/{category}', [CategoryController::class, 'show'])->middleware('can:categories.index');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->middleware('can:categories.edit');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->middleware('can:categories.delete');

    Route::get('brands/options', [BrandController::class, 'options'])->middleware('can:brands.index');
    Route::get('brands', [BrandController::class, 'index'])->middleware('can:brands.index');
    Route::post('brands', [BrandController::class, 'store'])->middleware('can:brands.create');
    Route::get('brands/{brand}', [BrandController::class, 'show'])->middleware('can:brands.index');
    Route::put('brands/{brand}', [BrandController::class, 'update'])->middleware('can:brands.edit');
    Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->middleware('can:brands.delete');

    Route::get('units/options', [UnitController::class, 'options'])->middleware('can:units.index');
    Route::get('units', [UnitController::class, 'index'])->middleware('can:units.index');
    Route::post('units', [UnitController::class, 'store'])->middleware('can:units.create');
    Route::get('units/{unit}', [UnitController::class, 'show'])->middleware('can:units.index');
    Route::put('units/{unit}', [UnitController::class, 'update'])->middleware('can:units.edit');
    Route::delete('units/{unit}', [UnitController::class, 'destroy'])->middleware('can:units.delete');

    Route::get('variation-templates/options', [VariationTemplateController::class, 'options'])->middleware('can:variation_templates.index');
    Route::get('variation-templates', [VariationTemplateController::class, 'index'])->middleware('can:variation_templates.index');
    Route::post('variation-templates', [VariationTemplateController::class, 'store'])->middleware('can:variation_templates.create');
    Route::get('variation-templates/{variationTemplate}', [VariationTemplateController::class, 'show'])->middleware('can:variation_templates.index');
    Route::put('variation-templates/{variationTemplate}', [VariationTemplateController::class, 'update'])->middleware('can:variation_templates.edit');
    Route::delete('variation-templates/{variationTemplate}', [VariationTemplateController::class, 'destroy'])->middleware('can:variation_templates.delete');

    Route::get('rack-locations/options', [RackLocationController::class, 'options'])->middleware('can:rack_locations.index');
    Route::get('rack-locations', [RackLocationController::class, 'index'])->middleware('can:rack_locations.index');
    Route::post('rack-locations', [RackLocationController::class, 'store'])->middleware('can:rack_locations.create');
    Route::get('rack-locations/{rackLocation}', [RackLocationController::class, 'show'])->middleware('can:rack_locations.index');
    Route::put('rack-locations/{rackLocation}', [RackLocationController::class, 'update'])->middleware('can:rack_locations.edit');
    Route::delete('rack-locations/{rackLocation}', [RackLocationController::class, 'destroy'])->middleware('can:rack_locations.delete');

    Route::get('price-groups', [PriceGroupController::class, 'index'])->middleware('can:price_groups.index');
    Route::post('price-groups', [PriceGroupController::class, 'store'])->middleware('can:price_groups.create');
    Route::get('price-groups/{priceGroup}', [PriceGroupController::class, 'show'])->middleware('can:price_groups.index');
    Route::put('price-groups/{priceGroup}', [PriceGroupController::class, 'update'])->middleware('can:price_groups.edit');
    Route::delete('price-groups/{priceGroup}', [PriceGroupController::class, 'destroy'])->middleware('can:price_groups.delete');

    Route::get('products/form-options', [ProductController::class, 'formOptions'])->middleware('can:products.index');
    Route::get('products', [ProductController::class, 'index'])->middleware('can:products.index');
    Route::post('products', [ProductController::class, 'store'])->middleware('can:products.create');
    Route::get('products/{product}', [ProductController::class, 'show'])->middleware('can:products.index');
    Route::put('products/{product}', [ProductController::class, 'update'])->middleware('can:products.edit');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->middleware('can:products.delete');
};
