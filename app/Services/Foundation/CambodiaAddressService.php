<?php

namespace App\Services\Foundation;

use App\Models\CambodiaAddressDivision;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CambodiaAddressService
{
    public function provinces(array $filters = []): Collection
    {
        return $this->localOrFetch('province', $filters);
    }

    public function districts(array $filters = []): Collection
    {
        return $this->localOrFetch('district', $filters);
    }

    public function communes(array $filters = []): Collection
    {
        return $this->localOrFetch('commune', $filters);
    }

    public function villages(array $filters = []): Collection
    {
        return $this->localOrFetch('village', $filters);
    }

    public function syncFromSource(): array
    {
        $resources = [
            'provinces' => 'province',
            'districts' => 'district',
            'communes' => 'commune',
            'villages' => 'village',
        ];
        $syncedAt = now();
        $summary = [];
        $total = 0;

        foreach ($resources as $resource => $type) {
            $items = $this->fetchFromSource($resource, []);
            $divisions = [];

            foreach ($items as $index => $item) {
                if (! is_array($item)) {
                    continue;
                }

                $division = $this->normalizeDivision($item, $type, $index + 1, $syncedAt);

                if ($division['code'] === '') {
                    continue;
                }

                $divisions[$division['code']] = $division;
            }

            $codes = array_keys($divisions);
            $existingCount = $codes === []
                ? 0
                : CambodiaAddressDivision::query()
                    ->where('type', $type)
                    ->whereIn('code', $codes)
                    ->count();

            $this->upsertDivisions($divisions, $syncedAt);

            if ($codes !== []) {
                CambodiaAddressDivision::query()
                    ->where('type', $type)
                    ->whereNotIn('code', $codes)
                    ->update(['is_active' => false]);
            }

            $resourceTotal = count($codes);
            $total += $resourceTotal;

            $summary[$resource] = [
                'created' => $resourceTotal - $existingCount,
                'updated' => $existingCount,
                'total' => $resourceTotal,
            ];
        }

        return [
            'synced_at' => $syncedAt,
            'total' => $total,
            'resources' => $summary,
            'status' => $this->status(),
        ];
    }

    public function status(): array
    {
        $counts = CambodiaAddressDivision::query()
            ->where('is_active', true)
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return [
            'last_synced_at' => CambodiaAddressDivision::query()->max('synced_at'),
            'counts' => [
                'provinces' => (int) ($counts['province'] ?? 0),
                'districts' => (int) ($counts['district'] ?? 0),
                'communes' => (int) ($counts['commune'] ?? 0),
                'villages' => (int) ($counts['village'] ?? 0),
            ],
        ];
    }

    protected function localOrFetch(string $type, array $filters): Collection
    {
        $result = $this->local($type, $filters);

        if ($result->isEmpty() && ! CambodiaAddressDivision::where('type', $type)->exists()) {
            $this->syncSingle($type);

            $result = $this->local($type, $filters);
        }

        return $result;
    }

    protected function syncSingle(string $type): void
    {
        $resource = $type === 'province' ? 'provinces' : $type.'s';
        $items = $this->fetchFromSource($resource, []);
        $syncedAt = now();
        $divisions = [];

        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $divisions[$item['id'] ?? $item['code'] ?? $index] = $this->normalizeDivision($item, $type, $index + 1, $syncedAt);
        }

        $this->upsertDivisions($divisions, $syncedAt);
    }

    protected function local(string $type, array $filters): Collection
    {
        $query = CambodiaAddressDivision::query()
            ->where('type', $type)
            ->where('is_active', true);

        if (filled($filters['id'] ?? null)) {
            $query->where('code', (string) $filters['id']);
        }

        if (filled($filters['province_id'] ?? null)) {
            $query->where('province_id', (string) $filters['province_id']);
        }

        if (filled($filters['district_id'] ?? null)) {
            $query->where('district_id', (string) $filters['district_id']);
        }

        if (filled($filters['commune_id'] ?? null)) {
            $query->where('commune_id', (string) $filters['commune_id']);
        }

        if (filled($filters['name_en'] ?? null)) {
            $query->whereLike('name_en', '%'.(string) $filters['name_en'].'%');
        }

        if (filled($filters['name_km'] ?? null)) {
            $query->whereLike('name_km', '%'.(string) $filters['name_km'].'%');
        }

        return $query
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();
    }

    protected function fetchFromSource(string $resource, array $filters): array
    {
        $query = collect($filters)
            ->filter(fn ($value) => filled($value))
            ->sortKeys()
            ->all();
        $baseUrl = rtrim((string) config('services.pumi.url', 'https://pumi.onrender.com/pumi'), '/');
        $response = Http::timeout(30)
            ->retry(2, 500)
            ->get($baseUrl.'/'.$resource, $query)
            ->throw();

        return $this->extractItems($response->json(), $resource);
    }

    protected function upsertDivisions(array $divisions, Carbon $syncedAt): void
    {
        if ($divisions === []) {
            return;
        }

        $timestamp = $syncedAt->toDateTimeString();
        $rows = collect($divisions)
            ->map(fn (array $division) => [
                ...$division,
                'id' => (string) Str::uuid(),
                'source_payload' => json_encode($division['source_payload'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'synced_at' => $timestamp,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ])
            ->values();

        $rows->chunk(500)->each(function ($chunk): void {
            CambodiaAddressDivision::query()->upsert(
                $chunk->all(),
                ['type', 'code'],
                [
                    'parent_code',
                    'name_en',
                    'name_km',
                    'province_id',
                    'district_id',
                    'commune_id',
                    'sort_order',
                    'is_active',
                    'source_payload',
                    'synced_at',
                    'updated_at',
                ]
            );
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

    protected function normalizeDivision(array $item, string $type, int $sortOrder, Carbon $syncedAt): array
    {
        $provinceId = isset($item['province_id']) ? (string) $item['province_id'] : null;
        $districtId = isset($item['district_id']) ? (string) $item['district_id'] : null;
        $communeId = isset($item['commune_id']) ? (string) $item['commune_id'] : null;

        return [
            'type' => $type,
            'code' => (string) ($item['id'] ?? $item['code'] ?? ''),
            'name_en' => (string) ($item['name_en'] ?? $item['name'] ?? $item['english_name'] ?? ''),
            'name_km' => (string) ($item['name_km'] ?? $item['khmer_name'] ?? ''),
            'parent_code' => match ($type) {
                'district' => $provinceId,
                'commune' => $districtId,
                'village' => $communeId,
                default => null,
            },
            'province_id' => $provinceId,
            'district_id' => $districtId,
            'commune_id' => $communeId,
            'sort_order' => (int) ($item['sort_order'] ?? $item['order'] ?? $sortOrder),
            'is_active' => true,
            'source_payload' => $item,
            'synced_at' => $syncedAt,
        ];
    }
}
