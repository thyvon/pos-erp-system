<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reports.index') ?? false;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'branch_id' => ['nullable', 'uuid', Rule::exists('branches', 'id')],
            'warehouse_id' => ['nullable', 'uuid', Rule::exists('warehouses', 'id')],
            'category_id' => ['nullable', 'uuid', Rule::exists('product_categories', 'id')],
            'product_id' => ['nullable', 'uuid', Rule::exists('products', 'id')],
            'mode' => ['nullable', Rule::in(['all', 'positive', 'zero', 'negative', 'low'])],
            'include_lots' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
