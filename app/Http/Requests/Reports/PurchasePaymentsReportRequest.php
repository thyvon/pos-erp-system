<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchasePaymentsReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reports.index') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['completed', 'reversed'])],
            'method' => ['nullable', Rule::in(['cash', 'card', 'bank_transfer', 'cheque', 'reward_points', 'gift_card', 'other'])],
            'branch_id' => ['nullable', 'uuid', Rule::exists('branches', 'id')],
            'warehouse_id' => ['nullable', 'uuid', Rule::exists('warehouses', 'id')],
            'supplier_id' => ['nullable', 'uuid', Rule::exists('suppliers', 'id')],
            'payment_account_id' => ['nullable', 'uuid', Rule::exists('payment_accounts', 'id')],
            'cashier_id' => ['nullable', 'uuid', Rule::exists('users', 'id')],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
