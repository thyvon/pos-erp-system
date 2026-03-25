<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRackLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $businessId = (string) $this->user()?->business_id;
        $rackLocationId = (string) $this->route('rackLocation')?->id;
        $warehouseId = (string) ($this->input('warehouse_id') ?: $this->route('rackLocation')?->warehouse_id);

        return [
            'warehouse_id' => [
                'sometimes',
                'required',
                'uuid',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->where('business_id', $businessId)->whereNull('deleted_at')),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('rack_locations', 'code')
                    ->ignore($rackLocationId)
                    ->where(fn ($query) => $query
                        ->where('warehouse_id', $warehouseId)
                        ->whereNull('deleted_at')),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
