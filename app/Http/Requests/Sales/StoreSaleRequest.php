<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = $this->user()?->business_id;

        return [
            'branch_id' => ['required', 'uuid', Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'customer_id' => ['nullable', 'uuid', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'cash_register_session_id' => ['nullable', 'uuid', Rule::exists('cash_register_sessions', 'id')],
            'commission_agent_id' => ['nullable', 'uuid', Rule::exists('users', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'type' => ['nullable', Rule::in(['pos_sale', 'invoice', 'draft', 'quotation', 'suspended'])],
            'sale_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:sale_date'],
            'discount_type' => ['nullable', Rule::in(['fixed', 'percentage'])],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'shipping_charges' => ['nullable', 'numeric', 'min:0'],
            'price_group_id' => ['nullable', 'uuid', Rule::exists('price_groups', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'notes' => ['nullable', 'string'],
            'staff_note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.variation_id' => ['nullable', 'uuid', Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.sub_unit_id' => ['nullable', 'uuid', Rule::exists('sub_units', 'id')],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount_type' => ['nullable', Rule::in(['fixed', 'percentage'])],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_type' => ['nullable', Rule::in(['inclusive', 'exclusive'])],
            'items.*.unit_cost' => ['nullable', 'numeric', 'min:0'],
            'items.*.notes' => ['nullable', 'string'],
            'items.*.lot_allocations' => ['nullable', 'array'],
            'items.*.lot_allocations.*.lot_id' => ['required_with:items.*.lot_allocations', 'uuid', Rule::exists('stock_lots', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.lot_allocations.*.quantity' => ['required_with:items.*.lot_allocations', 'numeric', 'gt:0'],
            'items.*.serial_ids' => ['nullable', 'array'],
            'items.*.serial_ids.*' => ['uuid', Rule::exists('stock_serials', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            $branchId = $this->input('branch_id');

            if ($user && $branchId && ! $user->hasRole(['admin', 'super_admin']) && ! $user->hasBranchAccess($branchId)) {
                $validator->errors()->add('branch_id', 'The selected branch is outside your allowed branch access.');
            }
        });
    }
}
