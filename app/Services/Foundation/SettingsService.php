<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\Setting;
use App\Repositories\Foundation\SettingRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SettingsService
{
    public function __construct(protected SettingRepository $settings)
    {
    }

    public function get(string $group, string $key): mixed
    {
        $businessId = $this->resolveBusinessId();
        $cacheKey = $this->cacheKey($businessId, $group, $key);
        $cached = Redis::get($cacheKey);

        if ($cached !== null) {
            return $this->decodeCachedValue($cached);
        }

        $setting = $this->settings->findByGroupAndKey($group, $key);

        if ($setting === null) {
            throw new DomainException("Setting {$group}.{$key} was not found.", 404);
        }

        $value = $this->castValue($setting);
        Redis::set($cacheKey, json_encode(['type' => $setting->type, 'value' => $value], JSON_THROW_ON_ERROR));

        return $value;
    }

    public function set(string $group, string $key, mixed $value): Setting
    {
        return DB::transaction(function () use ($group, $key, $value): Setting {
            $businessId = $this->resolveBusinessId();
            $setting = $this->settings->findByGroupAndKey($group, $key);
            $type = $setting?->type ?? $this->detectType($value);

            if ($setting === null) {
                /** @var Setting $setting */
                $setting = $this->settings->create([
                    'business_id' => $businessId,
                    'group' => $group,
                    'key' => $key,
                    'value' => $this->serializeValue($value, $type),
                    'type' => $type,
                    'is_encrypted' => false,
                ]);
            } else {
                /** @var Setting $setting */
                $setting = $this->settings->update($setting, [
                    'value' => $this->serializeValue($value, $type),
                    'type' => $type,
                ]);
            }

            $this->forgetCache($businessId, $group, $key);

            return $setting;
        });
    }

    public function getGroup(string $group): array
    {
        $businessId = $this->resolveBusinessId();
        $groupCacheKey = $this->groupCacheKey($businessId, $group);
        $cached = Redis::get($groupCacheKey);

        if ($cached !== null) {
            return json_decode($cached, true, 512, JSON_THROW_ON_ERROR);
        }

        $settings = $this->settings->getGroup($group);

        if ($settings->isEmpty()) {
            throw new DomainException("Setting group {$group} was not found.", 404);
        }

        $payload = [];

        foreach ($settings as $setting) {
            $value = $this->castValue($setting);
            $payload[$setting->key] = $value;
            Redis::set(
                $this->cacheKey($businessId, $group, $setting->key),
                json_encode(['type' => $setting->type, 'value' => $value], JSON_THROW_ON_ERROR)
            );
        }

        Redis::set($groupCacheKey, json_encode($payload, JSON_THROW_ON_ERROR));

        return $payload;
    }

    public function updateGroup(string $group, array $settings): array
    {
        DB::transaction(function () use ($group, $settings): void {
            foreach ($settings as $key => $value) {
                $this->set($group, (string) $key, $value);
            }
        });

        return $this->getGroup($group);
    }

    protected function resolveBusinessId(): string
    {
        $businessId = app()->bound('tenant')
            ? app('tenant')?->id
            : auth()->user()?->business_id;

        if (! filled($businessId)) {
            throw new DomainException('Tenant context is required to access settings.', 422);
        }

        return (string) $businessId;
    }

    protected function cacheKey(string $businessId, string $group, string $key): string
    {
        return "settings:{$businessId}:{$group}:{$key}";
    }

    protected function groupCacheKey(string $businessId, string $group): string
    {
        return "settings:{$businessId}:{$group}:group";
    }

    protected function forgetCache(string $businessId, string $group, string $key): void
    {
        Redis::del($this->cacheKey($businessId, $group, $key));
        Redis::del($this->groupCacheKey($businessId, $group));
    }

    protected function castValue(Setting $setting): mixed
    {
        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOL),
            'integer' => $setting->value === null ? null : (int) $setting->value,
            'float', 'decimal' => $setting->value === null ? null : (float) $setting->value,
            'json' => $setting->value === null ? null : json_decode($setting->value, true, 512, JSON_THROW_ON_ERROR),
            default => $setting->value,
        };
    }

    protected function serializeValue(mixed $value, string $type): ?string
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'json' => json_encode($value, JSON_THROW_ON_ERROR),
            'boolean' => $value ? '1' : '0',
            default => (string) $value,
        };
    }

    protected function detectType(mixed $value): string
    {
        return match (true) {
            is_bool($value) => 'boolean',
            is_int($value) => 'integer',
            is_float($value) => 'decimal',
            is_array($value) => 'json',
            default => 'string',
        };
    }

    protected function decodeCachedValue(string $cached): mixed
    {
        $payload = json_decode($cached, true, 512, JSON_THROW_ON_ERROR);

        return $payload['value'] ?? null;
    }
}
