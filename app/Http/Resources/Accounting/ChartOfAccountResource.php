<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChartOfAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'parent_id' => $this->parent_id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'detail_type' => $this->sub_type,
            'normal_balance' => $this->normal_balance,
            'description' => $this->description,
            'is_system' => $this->is_system,
            'is_active' => $this->is_active,
            'status' => $this->is_active ? 'active' : 'inactive',
            'is_postable' => (int) ($this->children_count ?? 0) === 0,
            'children_count' => $this->children_count,
            'journal_entries_count' => $this->journal_entries_count,
            'payment_accounts_count' => $this->payment_accounts_count,
            'parent' => $this->whenLoaded('parent', fn () => $this->parent ? [
                'id' => $this->parent->id,
                'code' => $this->parent->code,
                'name' => $this->parent->name,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
