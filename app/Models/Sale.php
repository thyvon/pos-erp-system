<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends BaseModel
{
    use HasFactory;
    use BelongsToBranch;

    protected $fillable = [
        'business_id',
        'branch_id',
        'warehouse_id',
        'customer_id',
        'cash_register_session_id',
        'commission_agent_id',
        'parent_sale_id',
        'created_by',
        'sale_number',
        'type',
        'status',
        'payment_status',
        'delivery_status',
        'is_recurring',
        'recurring_interval',
        'next_recurring_date',
        'recurring_count',
        'recurring_generated',
        'sale_date',
        'due_date',
        'subtotal',
        'discount_type',
        'discount_amount',
        'tax_amount',
        'shipping_charges',
        'total_amount',
        'paid_amount',
        'change_amount',
        'price_group_id',
        'notes',
        'staff_note',
    ];

    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'next_recurring_date' => 'date',
            'sale_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'shipping_charges' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashRegisterSession(): BelongsTo
    {
        return $this->belongsTo(CashRegisterSession::class);
    }

    public function commissionAgent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'commission_agent_id');
    }

    public function parentSale(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_sale_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function priceGroup(): BelongsTo
    {
        return $this->belongsTo(PriceGroup::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class)->orderBy('created_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SalePayment::class)->orderByDesc('payment_date');
    }

    public function returns(): HasMany
    {
        return $this->hasMany(SaleReturn::class)->orderByDesc('return_date');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(SaleCommission::class)->orderBy('created_at');
    }

    public function recurringChildren(): HasMany
    {
        return $this->hasMany(self::class, 'parent_sale_id')->orderByDesc('sale_date');
    }
}
