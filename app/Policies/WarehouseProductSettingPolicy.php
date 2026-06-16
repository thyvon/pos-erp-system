<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WarehouseProductSetting;
use App\Policies\Concerns\HandlesTenantPolicy;

class WarehouseProductSettingPolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('warehouse_product_settings.index');
    }

    public function view(User $user, WarehouseProductSetting $warehouseProductSetting): bool
    {
        return $user->can('warehouse_product_settings.index')
            && $this->belongsToSameBusiness($user, $warehouseProductSetting)
            && $user->hasWarehouseAccess($warehouseProductSetting->warehouse_id);
    }

    public function create(User $user): bool
    {
        return $user->can('warehouse_product_settings.create');
    }

    public function update(User $user, WarehouseProductSetting $warehouseProductSetting): bool
    {
        return $user->can('warehouse_product_settings.edit')
            && $this->belongsToSameBusiness($user, $warehouseProductSetting)
            && $user->hasWarehouseAccess($warehouseProductSetting->warehouse_id);
    }

    public function delete(User $user, WarehouseProductSetting $warehouseProductSetting): bool
    {
        return $user->can('warehouse_product_settings.delete')
            && $this->belongsToSameBusiness($user, $warehouseProductSetting)
            && $user->hasWarehouseAccess($warehouseProductSetting->warehouse_id);
    }
}
