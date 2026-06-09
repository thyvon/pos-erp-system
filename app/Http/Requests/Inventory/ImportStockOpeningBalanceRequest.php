<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportStockOpeningBalanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $businessId = auth()->user()?->business_id;

        return [
            'file' => ['required', 'file', 'mimes:csv,xlsx,xls', 'max:10240'],
            'warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
