<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'settings' => ['required', 'array', 'min:1'],
            'settings.*' => ['nullable'],
        ];
    }
}
