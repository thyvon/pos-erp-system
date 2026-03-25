<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRackLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;

        return [
            'warehouse_id' => [
                'required',
                'uuid',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'name' => ['required', 'string', 'max:100'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('rack_locations', 'code')
                    ->where(fn ($query) => $query
                        ->where('warehouse_id', $this->input('warehouse_id'))
                        ->whereNull('deleted_at')),
            ],
            'description' => ['nullable', 'string'],
        ];
    }
}
