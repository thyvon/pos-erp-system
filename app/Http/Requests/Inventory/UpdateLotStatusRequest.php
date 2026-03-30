<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLotStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:active,depleted,expired,recalled,quarantine'],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}
