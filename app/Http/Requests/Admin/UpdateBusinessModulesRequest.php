<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessModulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $moduleKeys = array_keys(config('modules.modules', []));

        return [
            'modules' => ['required', 'array', 'min:1'],
            'modules.*.module_key' => ['required', 'string', Rule::in($moduleKeys), 'distinct'],
            'modules.*.status' => ['required', Rule::in(['active', 'trial', 'expired', 'disabled'])],
            'modules.*.starts_at' => ['nullable', 'date'],
            'modules.*.ends_at' => ['nullable', 'date'],
            'modules.*.limits' => ['nullable', 'array'],
            'modules.*.settings' => ['nullable', 'array'],
        ];
    }
}
