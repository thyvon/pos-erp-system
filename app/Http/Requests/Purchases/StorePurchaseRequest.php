<?php

namespace App\Http\Requests\Purchases;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
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
            'supplier_id' => ['required', 'uuid', Rule::exists('suppliers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'supplier_invoice_no' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::in(['draft', 'confirmed'])],
            'purchase_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date', 'after_or_equal:purchase_date'],
            'discount_type' => ['nullable', 'string', Rule::in(['fixed', 'percentage'])],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_scope' => ['nullable', Rule::in(['line', 'sale'])],
            'tax_rate_id' => ['nullable', 'uuid', Rule::exists('tax_rates', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'tax_rate_type' => ['nullable', 'string', Rule::in(['percentage', 'fixed'])],
            'tax_rate' => ['nullable', 'numeric', 'min:0'],
            'tax_type' => ['nullable', 'string', Rule::in(['exclusive', 'inclusive'])],
            'shipping_charges' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'staff_note' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'uuid', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.variation_id' => ['nullable', 'uuid', Rule::exists('product_variations', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.sub_unit_id' => ['nullable', 'uuid', Rule::exists('sub_units', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.discount_type' => ['nullable', 'string', Rule::in(['fixed', 'percentage'])],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_rate_id' => ['nullable', 'uuid', Rule::exists('tax_rates', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $user = $this->user();
            $branchId = $this->input('branch_id');

            if ($user && $branchId && ! $user->hasBranchAccess($branchId)) {
                $validator->errors()->add('branch_id', 'The selected branch is outside your allowed branch access.');
            }
        });
    }
}
