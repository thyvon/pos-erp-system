<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\Brand;
use App\Models\User;
use App\Repositories\Catalog\BrandRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BrandService
{
    public function __construct(
        protected BrandRepository $brands,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->brands->paginateFiltered($filters);
    }

    public function options(): Collection
    {
        return $this->brands->options();
    }

    public function create(string $businessId, array $data, ?User $actor = null): Brand
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Brand {
            /** @var Brand $brand */
            $brand = $this->brands->create($this->normalizePayload($businessId, $data));

            $this->auditLogger->log(
                'created',
                Brand::class,
                $brand->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($brand)
            );

            return $brand->refresh();
        });
    }

    public function update(string $businessId, Brand $brand, array $data, ?User $actor = null): Brand
    {
        return DB::transaction(function () use ($businessId, $brand, $data, $actor): Brand {
            $this->ensureBelongsToBusiness($businessId, $brand);
            $before = $this->auditPayload($brand);

            /** @var Brand $updatedBrand */
            $updatedBrand = $this->brands->update($brand, $this->normalizePayload($businessId, $data, $brand));

            $this->auditLogger->log(
                'updated',
                Brand::class,
                $updatedBrand->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedBrand)
            );

            return $updatedBrand;
        });
    }

    public function delete(string $businessId, Brand $brand, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $brand, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $brand);
            $this->ensureBrandCanBeDeleted($brand);
            $before = $this->auditPayload($brand);

            $this->brands->delete($brand);

            $this->auditLogger->log(
                'deleted',
                Brand::class,
                $brand->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function normalizePayload(string $businessId, array $data, ?Brand $brand = null): array
    {
        return [
            'business_id' => $businessId,
            'name' => $data['name'] ?? $brand?->name,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $brand?->description,
            'image_url' => array_key_exists('image_url', $data)
                ? $data['image_url']
                : $brand?->image_url,
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, Brand $brand): void
    {
        if ((string) $brand->business_id !== $businessId) {
            throw new DomainException('Brand does not belong to the current business.', 422);
        }
    }

    protected function ensureBrandCanBeDeleted(Brand $brand): void
    {
        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'brand_id')
            && DB::table('products')->where('brand_id', $brand->id)->exists()
        ) {
            throw new DomainException('Brand cannot be deleted because it is still assigned to products.', 422);
        }
    }

    protected function auditPayload(Brand $brand): array
    {
        return [
            'id' => $brand->id,
            'business_id' => $brand->business_id,
            'name' => $brand->name,
            'description' => $brand->description,
            'image_url' => $brand->image_url,
        ];
    }
}
