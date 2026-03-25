<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['customerGroup']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'customer_group_id' => $this->customer_group_id,
            'customer_group' => $this->customerGroup ? [
                'id' => $this->customerGroup->id,
                'name' => $this->customerGroup->name,
            ] : null,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type,
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'tax_id' => $this->tax_id,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'address' => $this->address,
            'credit_limit' => (float) $this->credit_limit,
            'pay_term' => $this->pay_term,
            'opening_balance' => (float) $this->opening_balance,
            'status' => $this->status,
            'notes' => $this->notes,
            'custom_fields' => $this->custom_fields ?? [],
            'documents' => $this->documents ?? [],
            'balance' => (float) ($this->balance ?? 0),
            'reward_points_balance' => (float) ($this->reward_points_balance ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
