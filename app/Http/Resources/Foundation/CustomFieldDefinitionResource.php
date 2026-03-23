<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomFieldDefinitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'module' => $this->module,
            'field_name' => $this->field_name,
            'field_label' => $this->field_label,
            'field_type' => $this->field_type,
            'options' => $this->options,
            'is_required' => $this->is_required,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
