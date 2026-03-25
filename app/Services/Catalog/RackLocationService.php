<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\RackLocation;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\Catalog\RackLocationRepository;
use App\Services\Foundation\SettingsService;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RackLocationService
{
    public function __construct(
        protected RackLocationRepository $rackLocations,
        protected SettingsService $settings,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters, ?User $actor = null): LengthAwarePaginator
    {
        return $this->rackLocations->paginateFiltered($filters, $actor);
    }

    public function options(?User $actor = null): Collection
    {
        return $this->rackLocations->options($actor);
    }

    public function create(string $businessId, array $data, ?User $actor = null): RackLocation
    {
        return DB::transaction(function () use ($businessId, $data, $actor): RackLocation {
            $this->ensureRackLocationsEnabled();
            $warehouse = $this->resolveWarehouse($businessId, (string) $data['warehouse_id'], $actor);

            /** @var RackLocation $rackLocation */
            $rackLocation = $this->rackLocations->create($this->normalizePayload($businessId, $warehouse, $data));
            $rackLocation = $rackLocation->refresh()->load(['warehouse.branch']);

            $this->auditLogger->log(
                'created',
                RackLocation::class,
                $rackLocation->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($rackLocation)
            );

            return $rackLocation;
        });
    }

    public function update(string $businessId, RackLocation $rackLocation, array $data, ?User $actor = null): RackLocation
    {
        return DB::transaction(function () use ($businessId, $rackLocation, $data, $actor): RackLocation {
            $this->ensureRackLocationsEnabled();
            $this->ensureBelongsToBusiness($businessId, $rackLocation);
            $warehouseId = (string) ($data['warehouse_id'] ?? $rackLocation->warehouse_id);
            $warehouse = $this->resolveWarehouse($businessId, $warehouseId, $actor);
            $before = $this->auditPayload($rackLocation->load(['warehouse.branch']));

            /** @var RackLocation $updatedRackLocation */
            $updatedRackLocation = $this->rackLocations->update($rackLocation, $this->normalizePayload($businessId, $warehouse, $data, $rackLocation));
            $updatedRackLocation = $updatedRackLocation->refresh()->load(['warehouse.branch']);

            $this->auditLogger->log(
                'updated',
                RackLocation::class,
                $updatedRackLocation->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedRackLocation)
            );

            return $updatedRackLocation;
        });
    }

    public function delete(string $businessId, RackLocation $rackLocation, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $rackLocation, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $rackLocation);
            $this->ensureRackLocationCanBeDeleted($rackLocation);
            $before = $this->auditPayload($rackLocation->load(['warehouse.branch']));

            $this->rackLocations->delete($rackLocation);

            $this->auditLogger->log(
                'deleted',
                RackLocation::class,
                $rackLocation->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function ensureRackLocationsEnabled(): void
    {
        if (! (bool) $this->settings->get('stock', 'enable_rack_location')) {
            throw new DomainException('Rack locations are disabled in stock settings.', 422);
        }
    }

    protected function resolveWarehouse(string $businessId, string $warehouseId, ?User $actor = null): Warehouse
    {
        /** @var Warehouse|null $warehouse */
        $warehouse = Warehouse::withoutGlobalScopes()->with('branch')->find($warehouseId);

        if (! $warehouse || (string) $warehouse->business_id !== $businessId) {
            throw new DomainException('Selected warehouse is invalid for this business.', 422);
        }

        if ($actor && ! $actor->hasRole('super_admin') && ! $actor->hasBranchAccess($warehouse->branch_id)) {
            throw new DomainException('You do not have branch access to the selected warehouse.', 403);
        }

        return $warehouse;
    }

    protected function normalizePayload(string $businessId, Warehouse $warehouse, array $data, ?RackLocation $rackLocation = null): array
    {
        return [
            'business_id' => $businessId,
            'warehouse_id' => $warehouse->id,
            'name' => $data['name'] ?? $rackLocation?->name,
            'code' => $data['code'] ?? $rackLocation?->code,
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $rackLocation?->description,
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, RackLocation $rackLocation): void
    {
        if ((string) $rackLocation->business_id !== $businessId) {
            throw new DomainException('Rack location does not belong to the current business.', 422);
        }
    }

    protected function ensureRackLocationCanBeDeleted(RackLocation $rackLocation): void
    {
        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'rack_location_id')
            && DB::table('products')->where('rack_location_id', $rackLocation->id)->exists()
        ) {
            throw new DomainException('Rack location cannot be deleted because it is still assigned to products.', 422);
        }
    }

    protected function auditPayload(RackLocation $rackLocation): array
    {
        return [
            'id' => $rackLocation->id,
            'business_id' => $rackLocation->business_id,
            'warehouse_id' => $rackLocation->warehouse_id,
            'warehouse_name' => $rackLocation->warehouse?->name,
            'branch_id' => $rackLocation->warehouse?->branch_id,
            'name' => $rackLocation->name,
            'code' => $rackLocation->code,
            'description' => $rackLocation->description,
        ];
    }
}
