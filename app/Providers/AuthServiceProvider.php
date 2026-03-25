<?php

namespace App\Providers;

use App\Models\Branch;
use App\Models\AuditLog;
use App\Models\Business;
use App\Models\CustomFieldDefinition;
use App\Models\Setting;
use App\Models\TaxRate;
use App\Models\TaxGroup;
use App\Models\CustomerGroup;
use App\Models\Customer;
use App\Models\PriceGroup;
use App\Models\Supplier;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

// Models
use App\Models\User;
use App\Models\Warehouse;

// Policies
use App\Policies\BranchPolicy;
use App\Policies\AuditLogPolicy;
use App\Policies\BusinessPolicy;
use App\Policies\CustomFieldDefinitionPolicy;
use App\Policies\RolePolicy;
use App\Policies\SettingPolicy;
use App\Policies\TaxRatePolicy;
use App\Policies\TaxGroupPolicy;
use App\Policies\CustomerGroupPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\PriceGroupPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\UserPolicy;
use App\Policies\WarehousePolicy;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     */
    protected $policies = [
        AuditLog::class => AuditLogPolicy::class,
        Business::class => BusinessPolicy::class,
        CustomFieldDefinition::class => CustomFieldDefinitionPolicy::class,
        TaxRate::class => TaxRatePolicy::class,
        TaxGroup::class => TaxGroupPolicy::class,
        CustomerGroup::class => CustomerGroupPolicy::class,
        Customer::class => CustomerPolicy::class,
        PriceGroup::class => PriceGroupPolicy::class,
        Supplier::class => SupplierPolicy::class,
        User::class => UserPolicy::class,
        Role::class => RolePolicy::class,
        Branch::class => BranchPolicy::class,
        Warehouse::class => WarehousePolicy::class,
        Setting::class => SettingPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function (User $user, string $ability) {
            if ($user->hasRole('super_admin')) {
                return true;
            }

        });
    }
}
