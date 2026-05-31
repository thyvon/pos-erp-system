<?php

use App\Http\Controllers\Api\V1\Expenses\ExpenseController;
use App\Models\Expense;
use Illuminate\Support\Facades\Route;

return static function (): void {
    Route::get('expenses', [ExpenseController::class, 'index'])->middleware('can:viewAny,'.Expense::class);
    Route::post('expenses', [ExpenseController::class, 'store'])->middleware('can:create,'.Expense::class);
    Route::get('expenses/{expense}', [ExpenseController::class, 'show'])->middleware('can:view,expense');
    Route::put('expenses/{expense}', [ExpenseController::class, 'update'])->middleware('can:update,expense');
    Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('can:delete,expense');
};
