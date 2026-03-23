<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToTenant;
use App\Traits\HasUserTracking;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use HasUuid;
    use BelongsToTenant;
    use HasUserTracking;
    use Notifiable;
    use SoftDeletes;

    protected string $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'business_id',
        'default_branch_id',
        'first_name',
        'last_name',
        'email',
        'password',
        'phone',
        'avatar_url',
        'status',
        'max_discount',
        'commission_percentage',
        'sales_target_amount',
        'last_login_at',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array',
            'max_discount' => 'decimal:2',
            'commission_percentage' => 'decimal:2',
            'sales_target_amount' => 'decimal:2',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class)
            ->withTimestamps();
    }

    public function defaultBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'default_branch_id');
    }

    public function accessibleBranchIds(): array
    {
        if ($this->hasRole('super_admin')) {
            return [];
        }

        if ($this->relationLoaded('branches')) {
            return $this->branches->modelKeys();
        }

        return $this->branches()
            ->pluck('branches.id')
            ->all();
    }

    public function hasBranchAccess(string $branchId): bool
    {
        if ($this->hasRole('super_admin')) {
            return true;
        }

        return in_array($branchId, $this->accessibleBranchIds(), true);
    }
}
