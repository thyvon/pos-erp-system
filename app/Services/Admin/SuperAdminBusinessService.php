<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Models\Business;
use App\Models\BusinessModule;
use App\Services\AuditService;
use App\Services\Core\ModuleService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use App\Repositories\Foundation\BusinessRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class SuperAdminBusinessService
{
    public function __construct(
        protected BusinessRepository $businesses,
        protected ModuleService $modules,
        protected AuditService $auditService,
    )
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->businesses->paginateFiltered($filters);
    }

    public function show(Business $business): Business
    {
        return $this->businesses->findWithUsageOrFail($business->id);
    }

    public function create(array $data): Business
    {
        return DB::transaction(function () use ($data): Business {
            $owner = Arr::pull($data, 'owner', []);

            /** @var Business $business */
            $business = $this->businesses->create($data);

            /** @var User $user */
            $user = User::withoutGlobalScopes()->create([
                'business_id' => $business->id,
                'first_name' => $owner['first_name'],
                'last_name' => $owner['last_name'] ?? null,
                'email' => $owner['email'],
                'password' => $owner['password'],
                'phone' => $owner['phone'] ?? null,
                'status' => 'active',
                'max_discount' => 0,
                'commission_percentage' => 0,
                'sales_target_amount' => 0,
                'preferences' => [],
            ]);

            $user->assignRole('admin');

            return $this->businesses->findWithUsageOrFail($business->id);
        });
    }

    public function update(Business $business, array $data): Business
    {
        $this->businesses->update($business, $data);

        return $this->businesses->findWithUsageOrFail($business->id);
    }

    public function moduleStates(Business $business): array
    {
        $states = BusinessModule::query()
            ->where('business_id', $business->id)
            ->get()
            ->keyBy('module_key');

        return collect($this->modules->definitions())
            ->map(function (array $definition, string $moduleKey) use ($states): array {
                /** @var BusinessModule|null $state */
                $state = $states->get($moduleKey);
                $status = $state?->status ?? (($definition['default_enabled'] ?? false) ? 'active' : 'disabled');

                return [
                    'module_key' => $moduleKey,
                    'name' => $definition['name'] ?? $moduleKey,
                    'description' => $definition['description'] ?? '',
                    'default_enabled' => (bool) ($definition['default_enabled'] ?? false),
                    'status' => $status,
                    'starts_at' => $state?->starts_at?->toISOString(),
                    'ends_at' => $state?->ends_at?->toISOString(),
                    'limits' => $state?->limits,
                    'settings' => $state?->settings,
                    'enabled' => $state?->isEnabled() ?? in_array($moduleKey, $this->modules->defaultEnabledKeys(), true),
                ];
            })
            ->values()
            ->all();
    }

    public function updateModules(Business $business, array $payload, ?User $actor = null): array
    {
        $modules = collect($payload['modules'] ?? []);
        $oldStates = $this->moduleStates($business);

        DB::transaction(function () use ($business, $modules): void {
            $modules->each(function (array $module): void {
                if ($module['module_key'] === 'core' && $module['status'] !== 'active') {
                    throw ValidationException::withMessages([
                        'modules' => ['The Core Platform module must remain active.'],
                    ]);
                }
            });

            $modules->each(function (array $module) use ($business): void {
                BusinessModule::query()->updateOrCreate([
                    'business_id' => $business->id,
                    'module_key' => $module['module_key'],
                ], [
                    'status' => $module['status'],
                    'starts_at' => $module['starts_at'] ?? null,
                    'ends_at' => $module['ends_at'] ?? null,
                    'limits' => $module['limits'] ?? null,
                    'settings' => $module['settings'] ?? null,
                ]);
            });
        });

        $newStates = $this->moduleStates($business);

        $this->auditService->log(
            'business_modules_updated',
            Business::class,
            $business->id,
            $actor,
            $business->id,
            ['modules' => $oldStates],
            ['modules' => $newStates]
        );

        return $newStates;
    }
}
