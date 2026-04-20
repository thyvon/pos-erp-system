<?php

namespace App\Http\Resources\Accounting;

use App\Models\AccountTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $transactionBalance = $this->transaction_balance ?? AccountTransaction::withoutGlobalScopes()
            ->where('payment_account_id', $this->id)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as balance")
            ->value('balance');

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'name' => $this->name,
            'type' => $this->account_type,
            'account_number' => $this->account_number,
            'bank_name' => $this->bank_name,
            'opening_balance' => (float) $this->opening_balance,
            'current_balance' => round((float) $this->opening_balance + (float) $transactionBalance, 2),
            'status' => $this->is_active ? 'active' : 'inactive',
            'is_active' => $this->is_active,
            'note' => $this->note,
            'transactions_count' => $this->transactions_count,
            'chart_of_account' => $this->whenLoaded('chartOfAccount', fn () => $this->chartOfAccount ? [
                'id' => $this->chartOfAccount->id,
                'code' => $this->chartOfAccount->code,
                'name' => $this->chartOfAccount->name,
            ] : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
