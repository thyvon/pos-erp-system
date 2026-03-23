<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Admin\BusinessManagementController;
use App\Http\Controllers\Api\V1\Foundation\BranchController;
use App\Http\Controllers\Api\V1\Foundation\BusinessController;
use App\Http\Controllers\Api\V1\Foundation\CustomFieldDefinitionController;
use App\Http\Controllers\Api\V1\Foundation\RoleController;
use App\Http\Controllers\Api\V1\Foundation\SettingsController;
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
    Route::prefix('admin')->middleware('super_admin')->group(function () {
        Route::get('businesses', [BusinessManagementController::class, 'index']);
        Route::post('businesses', [BusinessManagementController::class, 'store']);
        Route::get('businesses/{business}', [BusinessManagementController::class, 'show']);
        Route::put('businesses/{business}', [BusinessManagementController::class, 'update']);
    });

    Route::get('business', [BusinessController::class, 'show']);
    Route::put('business', [BusinessController::class, 'update']);
    Route::apiResource('custom-field-definitions', CustomFieldDefinitionController::class);
    Route::get('roles/options', [RoleController::class, 'options']);
    Route::apiResource('roles', RoleController::class);
    Route::get('users/options', [UserController::class, 'options']);
    Route::apiResource('users', UserController::class);
    Route::apiResource('branches', BranchController::class);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::get('settings/{group}', [SettingsController::class, 'show']);
    Route::put('settings/{group}', [SettingsController::class, 'update']);
});
