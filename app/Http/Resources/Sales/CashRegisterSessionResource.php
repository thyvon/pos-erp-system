<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashRegisterSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['cashRegister.branch', 'user']);

        return [
            'id' => $this->id,
            'cash_register_id' => $this->cash_register_id,
            'user_id' => $this->user_id,
            'opening_float' => $this->opening_float !== null ? (string) $this->opening_float : null,
            'closing_float' => $this->closing_float !== null ? (string) $this->closing_float : null,
            'denominations_at_close' => $this->denominations_at_close,
            'total_sales' => $this->total_sales !== null ? (string) $this->total_sales : null,
            'status' => $this->status,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'notes' => $this->notes,
            'cash_register' => $this->cashRegister ? [
                'id' => $this->cashRegister->id,
                'name' => $this->cashRegister->name,
                'branch_id' => $this->cashRegister->branch_id,
                'branch' => $this->cashRegister->branch ? [
                    'id' => $this->cashRegister->branch->id,
                    'name' => $this->cashRegister->branch->name,
                    'code' => $this->cashRegister->branch->code,
                ] : null,
            ] : null,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => trim($this->user->first_name.' '.$this->user->last_name),
                'email' => $this->user->email,
            ] : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
