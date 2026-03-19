<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Foundation\BranchController;
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
    });
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('branches', BranchController::class);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::get('settings/{group}', [SettingsController::class, 'show']);
    Route::put('settings/{group}', [SettingsController::class, 'update']);
});
