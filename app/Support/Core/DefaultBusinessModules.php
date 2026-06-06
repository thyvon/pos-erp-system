<?php

namespace App\Support\Core;

use App\Models\BusinessModule;

class DefaultBusinessModules
{
    public static function seedBusiness(string $businessId): void
    {
        foreach (config('modules.modules', []) as $moduleKey => $definition) {
            if (! ($definition['default_enabled'] ?? false)) {
                continue;
            }

            BusinessModule::query()->firstOrCreate([
                'business_id' => $businessId,
                'module_key' => $moduleKey,
            ], [
                'status' => 'active',
            ]);
        }
    }
}
