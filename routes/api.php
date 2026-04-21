<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin\BusinessManagementController;
use App\Http\Controllers\Api\V1\Foundation\BranchController;
use App\Http\Controllers\Api\V1\Foundation\BusinessController;
use App\Http\Controllers\Api\V1\Foundation\CustomFieldDefinitionController;
use App\Http\Controllers\Api\V1\Foundation\RoleController;
use App\Http\Controllers\Api\V1\Foundation\SettingsController;
use App\Http\Controllers\Api\V1\Foundation\TaxRateController;
use App\Http\Controllers\Api\V1\Foundation\TaxGroupController;
use App\Http\Controllers\Api\V1\Foundation\CustomerGroupController;
use App\Http\Controllers\Api\V1\Foundation\CustomerController;
use App\Http\Controllers\Api\V1\Foundation\SupplierController;
use App\Http\Controllers\Api\V1\Foundation\UserController;
use App\Http\Controllers\Api\V1\Foundation\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('password', [AuthController::class, 'updatePassword']);
        Route::put('preferences', [AuthController::class, 'updatePreferences']);
    });
});

Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:300,1'])->group(function () {
    (require __DIR__.'/v1/catalog.php')();
    (require __DIR__.'/v1/accounting.php')();
    (require __DIR__.'/v1/inventory.php')();
    (require __DIR__.'/v1/sales.php')();

    Route::prefix('admin')->middleware('super_admin')->group(function () {
        Route::get('businesses', [BusinessManagementController::class, 'index'])->middleware('can:businesses.index');
        Route::post('businesses', [BusinessManagementController::class, 'store'])->middleware('can:businesses.create');
        Route::get('businesses/{business}', [BusinessManagementController::class, 'show'])->middleware('can:businesses.index');
        Route::put('businesses/{business}', [BusinessManagementController::class, 'update'])->middleware('can:businesses.edit');
    });

    Route::get('business', [BusinessController::class, 'show'])->middleware('can:businesses.index');
    Route::put('business', [BusinessController::class, 'update'])->middleware('can:businesses.edit');

    Route::get('custom-field-definitions', [CustomFieldDefinitionController::class, 'index'])->middleware('can:custom_fields.index');
    Route::post('custom-field-definitions', [CustomFieldDefinitionController::class, 'store'])->middleware('can:custom_fields.create');
    Route::get('custom-field-definitions/{customFieldDefinition}', [CustomFieldDefinitionController::class, 'show'])->middleware('can:custom_fields.index');
    Route::put('custom-field-definitions/{customFieldDefinition}', [CustomFieldDefinitionController::class, 'update'])->middleware('can:custom_fields.edit');
    Route::delete('custom-field-definitions/{customFieldDefinition}', [CustomFieldDefinitionController::class, 'destroy'])->middleware('can:custom_fields.delete');

    Route::get('tax-rates', [TaxRateController::class, 'index'])->middleware('can:tax_rates.index');
    Route::post('tax-rates', [TaxRateController::class, 'store'])->middleware('can:tax_rates.create');
    Route::get('tax-rates/{taxRate}', [TaxRateController::class, 'show'])->middleware('can:tax_rates.index');
    Route::put('tax-rates/{taxRate}', [TaxRateController::class, 'update'])->middleware('can:tax_rates.edit');
    Route::delete('tax-rates/{taxRate}', [TaxRateController::class, 'destroy'])->middleware('can:tax_rates.delete');

    Route::get('tax-groups', [TaxGroupController::class, 'index'])->middleware('can:tax_groups.index');
    Route::post('tax-groups', [TaxGroupController::class, 'store'])->middleware('can:tax_groups.create');
    Route::get('tax-groups/{taxGroup}', [TaxGroupController::class, 'show'])->middleware('can:tax_groups.index');
    Route::put('tax-groups/{taxGroup}', [TaxGroupController::class, 'update'])->middleware('can:tax_groups.edit');
    Route::delete('tax-groups/{taxGroup}', [TaxGroupController::class, 'destroy'])->middleware('can:tax_groups.delete');

    Route::get('customer-groups', [CustomerGroupController::class, 'index'])->middleware('can:customer_groups.index');
    Route::post('customer-groups', [CustomerGroupController::class, 'store'])->middleware('can:customer_groups.create');
    Route::get('customer-groups/{customerGroup}', [CustomerGroupController::class, 'show'])->middleware('can:customer_groups.index');
    Route::put('customer-groups/{customerGroup}', [CustomerGroupController::class, 'update'])->middleware('can:customer_groups.edit');
    Route::delete('customer-groups/{customerGroup}', [CustomerGroupController::class, 'destroy'])->middleware('can:customer_groups.delete');

    Route::get('customers', [CustomerController::class, 'index'])->middleware('can:customers.index');
    Route::post('customers', [CustomerController::class, 'store'])->middleware('can:customers.create');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->middleware('can:customers.index');
    Route::put('customers/{customer}', [CustomerController::class, 'update'])->middleware('can:customers.edit');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->middleware('can:customers.delete');

    Route::get('suppliers', [SupplierController::class, 'index'])->middleware('can:suppliers.index');
    Route::post('suppliers', [SupplierController::class, 'store'])->middleware('can:suppliers.create');
    Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('can:suppliers.index');
    Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('can:suppliers.edit');
    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('can:suppliers.delete');

    Route::get('roles/options', [RoleController::class, 'options'])->middleware('can:roles.index');
    Route::get('roles', [RoleController::class, 'index'])->middleware('can:roles.index');
    Route::post('roles', [RoleController::class, 'store'])->middleware('can:roles.create');
    Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('can:roles.index');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('can:roles.edit');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('can:roles.delete');

    Route::get('users/options', [UserController::class, 'options'])->middleware('can:users.index');
    Route::get('users', [UserController::class, 'index'])->middleware('can:users.index');
    Route::post('users', [UserController::class, 'store'])->middleware('can:users.create');
    Route::get('users/{user}', [UserController::class, 'show'])->middleware('can:users.index');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('can:users.edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('can:users.delete');

    Route::get('branches', [BranchController::class, 'index'])->middleware('can:branches.index');
    Route::post('branches', [BranchController::class, 'store'])->middleware('can:branches.create');
    Route::get('branches/{branch}', [BranchController::class, 'show'])->middleware('can:branches.index');
    Route::put('branches/{branch}', [BranchController::class, 'update'])->middleware('can:branches.edit');
    Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->middleware('can:branches.delete');

    Route::get('warehouses', [WarehouseController::class, 'index'])->middleware('can:warehouses.index');
    Route::post('warehouses', [WarehouseController::class, 'store'])->middleware('can:warehouses.create');
    Route::get('warehouses/{warehouse}', [WarehouseController::class, 'show'])->middleware('can:warehouses.index');
    Route::put('warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('can:warehouses.edit');
    Route::delete('warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->middleware('can:warehouses.delete');

    Route::get('settings/{group}', [SettingsController::class, 'show'])->middleware('can:settings.index');
    Route::put('settings/{group}', [SettingsController::class, 'update'])->middleware('can:settings.edit');
});
