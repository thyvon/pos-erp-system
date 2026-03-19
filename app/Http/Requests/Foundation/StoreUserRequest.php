<?php

namespace App\Http\Requests\Foundation;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20'],
            'avatar_url' => ['nullable', 'url', 'max:500'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
            'max_discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'preferences' => ['nullable', 'array'],
            'role' => ['required', 'string', 'exists:roles,name'],
        ];
    }
}
