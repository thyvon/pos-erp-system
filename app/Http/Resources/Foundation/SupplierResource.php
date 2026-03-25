<?php

namespace App\Http\Resources\Foundation;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'code' => $this->code,
            'name' => $this->name,
            'company' => $this->company,
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile' => $this->mobile,
            'tax_id' => $this->tax_id,
            'address' => $this->address,
            'pay_term' => $this->pay_term,
            'opening_balance' => (float) $this->opening_balance,
            'status' => $this->status,
            'notes' => $this->notes,
            'custom_fields' => $this->custom_fields ?? [],
            'documents' => $this->documents ?? [],
            'balance' => (float) ($this->balance ?? 0),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
