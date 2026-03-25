<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'customer_group_id',
        'created_by',
        'code',
        'name',
        'type',
        'email',
        'phone',
        'mobile',
        'tax_id',
        'date_of_birth',
        'address',
        'credit_limit',
        'pay_term',
        'opening_balance',
        'status',
        'notes',
        'custom_fields',
        'documents',
    ];

    protected $appends = [
        'balance',
        'reward_points_balance',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'address' => 'array',
            'credit_limit' => 'decimal:2',
            'pay_term' => 'integer',
            'opening_balance' => 'decimal:2',
            'custom_fields' => 'array',
            'documents' => 'array',
        ];
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function customerGroup(): BelongsTo
    {
        return $this->belongsTo(CustomerGroup::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getBalanceAttribute(): float
    {
        return isset($this->attributes['balance'])
            ? (float) $this->attributes['balance']
            : 0.0;
    }

    public function getRewardPointsBalanceAttribute(): float
    {
        return isset($this->attributes['reward_points_balance'])
            ? (float) $this->attributes['reward_points_balance']
            : 0.0;
    }
}
