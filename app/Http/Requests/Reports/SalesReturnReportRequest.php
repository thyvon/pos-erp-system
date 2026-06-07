<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SalesReturnReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reports.index') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'refund_method' => ['nullable', Rule::in(['cash', 'credit_note', 'bank_transfer', 'reward_points'])],
            'sale_id' => ['nullable', 'uuid', Rule::exists('sales', 'id')],
            'branch_id' => ['nullable', 'uuid', Rule::exists('branches', 'id')],
            'warehouse_id' => ['nullable', 'uuid', Rule::exists('warehouses', 'id')],
            'customer_id' => ['nullable', 'uuid', Rule::exists('customers', 'id')],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
