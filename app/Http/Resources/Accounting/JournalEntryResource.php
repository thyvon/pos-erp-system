<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing('account');

        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'account' => $this->account ? [
                'id' => $this->account->id,
                'code' => $this->account->code,
                'name' => $this->account->name,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
