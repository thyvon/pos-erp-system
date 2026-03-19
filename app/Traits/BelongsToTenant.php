<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder): void {
            $tenantId = static::resolveTenantId();

            if ($tenantId !== null) {
                $builder->where($builder->qualifyColumn('business_id'), $tenantId);
            }
        });

        static::creating(function ($model): void {
            $tenantId = static::resolveTenantId();

            if ($tenantId !== null && empty($model->business_id)) {
                $model->business_id = $tenantId;
            }
        });
    }

    protected static function resolveTenantId(): ?string
    {
        if (! app()->bound('tenant')) {
            return null;
        }

        $tenant = app('tenant');

        return $tenant?->id ?: null;
    }
}
