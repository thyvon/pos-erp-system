<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\DomainException;
use App\Models\Business;
use App\Repositories\Foundation\BusinessRepository;
use Illuminate\Support\Facades\DB;

class BusinessService
{
    public function __construct(protected BusinessRepository $businesses)
    {
    }

    public function getCurrentBusiness(): Business
    {
        return $this->loadBusiness($this->resolveBusiness()->id);
    }

    public function updateCurrentBusiness(array $data): Business
    {
        return DB::transaction(function () use ($data): Business {
            $business = $this->resolveBusiness();

            /** @var Business $updatedBusiness */
            $updatedBusiness = $this->businesses->update($business, $data);

            return $this->loadBusiness($updatedBusiness->id);
        });
    }

    protected function resolveBusiness(): Business
    {
        $business = app()->bound('tenant')
            ? app('tenant')
            : auth()->user()?->business;

        if (! $business instanceof Business) {
            throw new DomainException('Tenant context is required to manage the business profile.', 422);
        }

        return $business;
    }

    protected function loadBusiness(string $businessId): Business
    {
        $business = $this->businesses->findWithUsage($businessId);

        if (! $business instanceof Business) {
            throw new DomainException('Business profile could not be found.', 404);
        }

        return $business;
    }
}
