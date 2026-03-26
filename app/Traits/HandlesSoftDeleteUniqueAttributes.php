<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

trait HandlesSoftDeleteUniqueAttributes
{
    protected static function bootHandlesSoftDeleteUniqueAttributes(): void
    {
        static::deleting(function (Model $model): void {
            if (method_exists($model, 'isForceDeleting') && $model->isForceDeleting()) {
                return;
            }

            if (! method_exists($model, 'softDeleteUniqueColumns')) {
                return;
            }

            $columns = $model->softDeleteUniqueColumns();

            if (! is_array($columns) || $columns === []) {
                return;
            }

            $suffix = '__deleted__'.Str::lower(Str::random(8));
            $changed = false;

            foreach ($columns as $column => $maxLength) {
                $value = $model->getAttribute($column);

                if (! filled($value)) {
                    continue;
                }

                $base = (string) $value;
                $limit = is_int($maxLength) && $maxLength > strlen($suffix)
                    ? $maxLength - strlen($suffix)
                    : 0;

                $model->setAttribute(
                    $column,
                    ($limit > 0 ? Str::limit($base, $limit, '') : '').$suffix
                );

                $changed = true;
            }

            if ($changed) {
                $model->saveQuietly();
            }
        });
    }
}
