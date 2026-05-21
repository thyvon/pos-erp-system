<?php

namespace App\Services\Foundation;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CambodiaAddressService
{
    public function provinces(array $filters = []): array
    {
        return $this->fetch('provinces', $filters);
    }

    public function districts(array $filters = []): array
    {
        return $this->fetch('districts', $filters);
    }

    public function communes(array $filters = []): array
    {
        return $this->fetch('communes', $filters);
    }

    public function villages(array $filters = []): array
    {
        return $this->fetch('villages', $filters);
    }

    protected function fetch(string $resource, array $filters): array
    {
        $query = collect($filters)
            ->filter(fn ($value) => filled($value))
            ->sortKeys()
            ->all();

        $cacheKey = 'cambodia-address:'.$resource.':'.md5(json_encode($query));

        return Cache::remember($cacheKey, now()->addDay(), function () use ($resource, $query): array {
            $baseUrl = rtrim((string) config('services.pumi.url', 'https://pumi.onrender.com/pumi'), '/');
            $response = Http::timeout(8)
                ->retry(2, 200)
                ->get($baseUrl.'/'.$resource, $query)
                ->throw();

            $payload = $response->json();
            $items = $this->extractItems($payload, $resource);

            return collect($items)
                ->filter(fn ($item) => is_array($item))
                ->map(fn (array $item) => $this->normalizeDivision($item))
                ->values()
                ->all();
        });
    }

    protected function extractItems(mixed $payload, string $resource): array
    {
        if (! is_array($payload)) {
            return [];
        }

        if (array_is_list($payload)) {
            return $payload;
        }

        $items = $payload['data'] ?? $payload[$resource] ?? [];

        return is_array($items) ? $items : [];
    }

    protected function normalizeDivision(array $item): array
    {
        return [
            'id' => (string) ($item['id'] ?? $item['code'] ?? ''),
            'name_en' => (string) ($item['name_en'] ?? $item['name'] ?? $item['english_name'] ?? ''),
            'name_km' => (string) ($item['name_km'] ?? $item['khmer_name'] ?? ''),
            'province_id' => isset($item['province_id']) ? (string) $item['province_id'] : null,
            'district_id' => isset($item['district_id']) ? (string) $item['district_id'] : null,
            'commune_id' => isset($item['commune_id']) ? (string) $item['commune_id'] : null,
        ];
    }
}
