<?php

namespace App\Http\Resources\Expenses;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'expense_account_id' => $this->expense_account_id,
            'payment_account_id' => $this->payment_account_id,
            'expense_date' => optional($this->expense_date)->toDateString(),
            'reference_no' => $this->reference_no,
            'description' => $this->description,
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
            'branch' => $this->whenLoaded('branch', fn () => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'code' => $this->branch->code,
            ]),
            'expense_account' => $this->whenLoaded('expenseAccount', fn () => [
                'id' => $this->expenseAccount->id,
                'code' => $this->expenseAccount->code,
                'name' => $this->expenseAccount->name,
            ]),
            'payment_account' => $this->whenLoaded('paymentAccount', fn () => [
                'id' => $this->paymentAccount->id,
                'name' => $this->paymentAccount->name,
                'account_type' => $this->paymentAccount->account_type,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => trim(($this->creator->first_name ?? '') . ' ' . ($this->creator->last_name ?? '')),
                'email' => $this->creator->email,
            ] : null),
        ];
    }
}
