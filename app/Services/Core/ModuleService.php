<?php

namespace App\Services\Core;

use App\Models\BusinessModule;

class ModuleService
{
    public function definitions(): array
    {
        return config('modules.modules', []);
    }

    public function allKeys(): array
    {
        return array_keys($this->definitions());
    }

    public function defaultEnabledKeys(): array
    {
        return array_keys(array_filter(
            $this->definitions(),
            fn (array $definition): bool => (bool) ($definition['default_enabled'] ?? false)
        ));
    }

    public function enabledKeysForBusiness(?string $businessId): array
    {
        if (! $businessId) {
            return [];
        }

        $enabled = array_fill_keys($this->defaultEnabledKeys(), true);

        BusinessModule::query()
            ->where('business_id', $businessId)
            ->get()
            ->each(function (BusinessModule $module) use (&$enabled): void {
                $enabled[$module->module_key] = $module->isEnabled();
            });

        $enabled['core'] = true;

        return array_values(array_keys(array_filter($enabled)));
    }

    public function isEnabledForBusiness(?string $businessId, string $moduleKey): bool
    {
        if ($moduleKey === 'core') {
            return true;
        }

        return in_array($moduleKey, $this->enabledKeysForBusiness($businessId), true);
    }

    public function displayName(string $moduleKey): string
    {
        return $this->definitions()[$moduleKey]['name'] ?? $moduleKey;
    }
}
