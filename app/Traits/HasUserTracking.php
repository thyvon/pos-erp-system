<?php

namespace App\Traits;

use Throwable;
use Illuminate\Support\Facades\Schema;

trait HasUserTracking
{
    protected static array $userTrackingColumnCache = [];

    protected static function bootHasUserTracking(): void
    {
        static::creating(function ($model): void {
            if (! auth()->check()) {
                return;
            }

            $userId = (string) auth()->id();

            if (static::hasUserTrackingColumn($model, 'created_by') && empty($model->created_by)) {
                $model->created_by = $userId;
            }

            if (static::hasUserTrackingColumn($model, 'updated_by') && empty($model->updated_by)) {
                $model->updated_by = $userId;
            }
        });

        static::updating(function ($model): void {
            if (! auth()->check()) {
                return;
            }

            if (static::hasUserTrackingColumn($model, 'updated_by')) {
                $model->updated_by = (string) auth()->id();
            }
        });
    }

    protected static function hasUserTrackingColumn($model, string $column): bool
    {
        $table = $model->getTable();
        $cacheKey = $table.':'.$column;

        if (array_key_exists($cacheKey, static::$userTrackingColumnCache)) {
            return static::$userTrackingColumnCache[$cacheKey];
        }

        try {
            return static::$userTrackingColumnCache[$cacheKey] = Schema::hasColumn($table, $column);
        } catch (Throwable) {
            return static::$userTrackingColumnCache[$cacheKey] = false;
        }
    }
}
