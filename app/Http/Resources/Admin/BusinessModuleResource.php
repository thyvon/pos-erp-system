<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'module_key' => $this->resource['module_key'],
            'name' => $this->resource['name'],
            'description' => $this->resource['description'],
            'default_enabled' => $this->resource['default_enabled'],
            'status' => $this->resource['status'],
            'starts_at' => $this->resource['starts_at'],
            'ends_at' => $this->resource['ends_at'],
            'limits' => $this->resource['limits'],
            'settings' => $this->resource['settings'],
            'enabled' => $this->resource['enabled'],
        ];
    }
}
