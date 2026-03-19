<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'type' => 'backend',
        'message' => 'Laravel API backend is running.',
        'frontend' => 'Run the standalone Vue app from /frontend',
    ]);
});
