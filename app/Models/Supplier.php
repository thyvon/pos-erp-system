<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Supplier extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'created_by',
        'code',
        'name',
        'company',
        'email',
        'phone',
        'mobile',
        'tax_id',
        'address',
        'pay_term',
        'opening_balance',
        'status',
        'notes',
        'custom_fields',
        'documents',
    ];

    protected $appends = [
        'balance',
    ];

    protected function casts(): array
    {
        return [
            'address' => 'array',
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
}
