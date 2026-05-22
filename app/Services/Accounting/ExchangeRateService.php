<?php

namespace App\Services\Accounting;

use App\Exceptions\Domain\DomainException;
use App\Models\ExchangeRate;
use App\Repositories\Accounting\ExchangeRateRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ExchangeRateService
{
    public function __construct(protected ExchangeRateRepository $exchangeRates)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->exchangeRates->paginateFiltered($filters);
    }

    public function summary(): array
    {
        return $this->exchangeRates->summary();
    }

    public function create(string $businessId, array $data): ExchangeRate
    {
        return DB::transaction(function () use ($businessId, $data): ExchangeRate {
            $payload = $this->payload($data);
            $payload['business_id'] = $businessId;
            $payload['is_default'] = (bool) ($data['is_default'] ?? ! $this->hasAnyRate($businessId, $payload['from_currency'], $payload['to_currency']));

            if ($payload['is_default']) {
                $this->clearDefault($businessId, $payload['from_currency'], $payload['to_currency']);
            }

            /** @var ExchangeRate $rate */
            $rate = $this->exchangeRates->create($payload);

            return $rate;
        });
    }

    public function update(string $businessId, ExchangeRate $exchangeRate, array $data): ExchangeRate
    {
        return DB::transaction(function () use ($businessId, $exchangeRate, $data): ExchangeRate {
            $this->ensureBelongsToBusiness($businessId, $exchangeRate);

            $payload = $this->payload($data, $exchangeRate);
            $isDefault = (bool) ($data['is_default'] ?? $exchangeRate->is_default);
            $payload['is_default'] = $isDefault;

            if ($isDefault) {
                $this->clearDefault($businessId, $payload['from_currency'], $payload['to_currency'], $exchangeRate->id);
            } elseif (! $this->hasDefaultRate($businessId, $payload['from_currency'], $payload['to_currency'], $exchangeRate->id)) {
                $payload['is_default'] = true;
            }

            /** @var ExchangeRate $updated */
            $updated = $this->exchangeRates->update($exchangeRate, $payload);

            return $updated;
        });
    }

    public function delete(string $businessId, ExchangeRate $exchangeRate): void
    {
        DB::transaction(function () use ($businessId, $exchangeRate): void {
            $this->ensureBelongsToBusiness($businessId, $exchangeRate);

            $fromCurrency = $exchangeRate->from_currency;
            $toCurrency = $exchangeRate->to_currency;
            $wasDefault = (bool) $exchangeRate->is_default;

            $this->exchangeRates->delete($exchangeRate);

            if ($wasDefault) {
                $this->promoteLatestDefault($businessId, $fromCurrency, $toCurrency);
            }
        });
    }

    public function defaultRate(string $businessId, string $fromCurrency = 'USD', string $toCurrency = 'KHR'): ?ExchangeRate
    {
        $fromCurrency = strtoupper($fromCurrency);
        $toCurrency = strtoupper($toCurrency);

        return ExchangeRate::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->where('from_currency', $fromCurrency)
            ->where('to_currency', $toCurrency)
            ->where('is_default', true)
            ->first()
            ?? ExchangeRate::withoutGlobalScopes()
                ->where('business_id', $businessId)
                ->whereNull('deleted_at')
                ->where('from_currency', $fromCurrency)
                ->where('to_currency', $toCurrency)
                ->orderByDesc('effective_date')
                ->orderByDesc('created_at')
                ->first();
    }

    protected function payload(array $data, ?ExchangeRate $exchangeRate = null): array
    {
        $fromCurrency = strtoupper((string) ($data['from_currency'] ?? $exchangeRate?->from_currency ?? 'USD'));
        $toCurrency = strtoupper((string) ($data['to_currency'] ?? $exchangeRate?->to_currency ?? 'KHR'));

        if ($fromCurrency === $toCurrency) {
            throw new DomainException('Exchange rate currencies must be different.', 422);
        }

        return [
            'from_currency' => $fromCurrency,
            'to_currency' => $toCurrency,
            'rate' => $data['rate'] ?? $exchangeRate?->rate,
            'effective_date' => $data['effective_date'] ?? $exchangeRate?->effective_date?->toDateString(),
            'note' => $data['note'] ?? $exchangeRate?->note,
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, ExchangeRate $exchangeRate): void
    {
        if ((string) $exchangeRate->business_id !== $businessId) {
            throw new DomainException('Selected exchange rate does not belong to this business.', 422);
        }
    }

    protected function clearDefault(string $businessId, string $fromCurrency, string $toCurrency, ?string $ignoreId = null): void
    {
        $query = ExchangeRate::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->where('from_currency', $fromCurrency)
            ->where('to_currency', $toCurrency);

        if ($ignoreId) {
            $query->whereKeyNot($ignoreId);
        }

        $query->update(['is_default' => false]);
    }

    protected function hasAnyRate(string $businessId, string $fromCurrency, string $toCurrency): bool
    {
        return ExchangeRate::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->where('from_currency', $fromCurrency)
            ->where('to_currency', $toCurrency)
            ->exists();
    }

    protected function hasDefaultRate(string $businessId, string $fromCurrency, string $toCurrency, ?string $ignoreId = null): bool
    {
        $query = ExchangeRate::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->where('from_currency', $fromCurrency)
            ->where('to_currency', $toCurrency)
            ->where('is_default', true);

        if ($ignoreId) {
            $query->whereKeyNot($ignoreId);
        }

        return $query->exists();
    }

    protected function promoteLatestDefault(string $businessId, string $fromCurrency, string $toCurrency): void
    {
        /** @var ExchangeRate|null $latest */
        $latest = ExchangeRate::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->whereNull('deleted_at')
            ->where('from_currency', $fromCurrency)
            ->where('to_currency', $toCurrency)
            ->orderByDesc('effective_date')
            ->orderByDesc('created_at')
            ->first();

        if ($latest) {
            $latest->forceFill(['is_default' => true])->save();
        }
    }
}
