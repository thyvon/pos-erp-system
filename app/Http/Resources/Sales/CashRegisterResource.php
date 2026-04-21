<?php

namespace App\Http\Resources\Sales;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashRegisterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['branch', 'sessions.user']);

        $currentOpenSession = $this->sessions
            ->first(fn ($session) => $session->status === 'open');

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'is_active' => (bool) $this->is_active,
            'status' => $this->is_active ? 'active' : 'inactive',
            'branch' => $this->branch ? [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'code' => $this->branch->code,
            ] : null,
            'sessions_count' => (int) ($this->sessions_count ?? $this->sessions->count()),
            'current_open_session' => $currentOpenSession
                ? (new CashRegisterSessionResource($currentOpenSession))->resolve()
                : null,
            'recent_sessions' => CashRegisterSessionResource::collection(
                $this->whenLoaded('sessions', fn () => $this->sessions->take(5))
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
