<?php

namespace App\Models;

use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends BaseModel
{
    use HasFactory;
    use BelongsToBranch;

    protected $fillable = [
        'business_id',
        'branch_id',
        'warehouse_id',
        'supplier_id',
        'created_by',
        'received_by',
        'purchase_number',
        'supplier_invoice_no',
        'status',
        'payment_status',
        'purchase_date',
        'expected_date',
        'received_at',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'shipping_charges',
        'total_amount',
        'paid_amount',
        'notes',
        'staff_note',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'expected_date' => 'date',
            'received_at' => 'datetime',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'shipping_charges' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
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

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class)->orderBy('created_at');
    }
}
