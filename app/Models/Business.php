<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Support\Accounting\DefaultChartOfAccounts;
use App\Support\Foundation\DefaultSettings;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Business extends Model
{
    use HasFactory;
    use HasUuid;
    use SoftDeletes;

    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
            'financial_year' => 'array',
            'settings_cache' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Business $business): void {
            if (Schema::hasTable('settings')) {
                DefaultSettings::seedBusiness($business->id);
            }

            if (Schema::hasTable('chart_of_accounts')) {
                DefaultChartOfAccounts::seedBusiness($business->id);
            }
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function owner(): HasOne
    {
        return $this->hasOne(User::class)
            ->withoutGlobalScopes()
            ->oldestOfMany('created_at');
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }

    public function taxRates(): HasMany
    {
        return $this->hasMany(TaxRate::class);
    }

    public function taxGroups(): HasMany
    {
        return $this->hasMany(TaxGroup::class);
    }

    public function customerGroups(): HasMany
    {
        return $this->hasMany(CustomerGroup::class);
    }

    public function priceGroups(): HasMany
    {
        return $this->hasMany(PriceGroup::class);
    }

    public function brands(): HasMany
    {
        return $this->hasMany(Brand::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function variationTemplates(): HasMany
    {
        return $this->hasMany(VariationTemplate::class);
    }

    public function rackLocations(): HasMany
    {
        return $this->hasMany(RackLocation::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class);
    }

    public function chartOfAccounts(): HasMany
    {
        return $this->hasMany(ChartOfAccount::class);
    }

    public function fiscalYears(): HasMany
    {
        return $this->hasMany(FiscalYear::class);
    }

    public function paymentAccounts(): HasMany
    {
        return $this->hasMany(PaymentAccount::class);
    }

    public function journals(): HasMany
    {
        return $this->hasMany(Journal::class);
    }
}
