<?php

namespace App\Providers;

use App\Models\Branch;
use App\Models\Business;
use App\Models\CustomFieldDefinition;
use App\Models\Setting;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

// Models
use App\Models\User;
use App\Models\Warehouse;

// Policies
use App\Policies\BranchPolicy;
use App\Policies\BusinessPolicy;
use App\Policies\CustomFieldDefinitionPolicy;
use App\Policies\RolePolicy;
use App\Policies\SettingPolicy;
use App\Policies\UserPolicy;
use App\Policies\WarehousePolicy;
use Spatie\Permission\Models\Role;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     */
    protected $policies = [
        Business::class => BusinessPolicy::class,
        CustomFieldDefinition::class => CustomFieldDefinitionPolicy::class,
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
