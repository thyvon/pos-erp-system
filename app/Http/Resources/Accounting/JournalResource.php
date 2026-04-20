<?php

namespace App\Http\Resources\Accounting;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->loadMissing(['poster', 'reversedBy']);

        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'fiscal_year_id' => $this->fiscal_year_id,
            'journal_number' => $this->journal_number,
            'journal_type' => $this->type,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'description' => $this->description,
            'total' => (float) $this->total_amount,
            'status' => $this->reversed_by_id ? 'reversed' : 'posted',
            'entry_count' => $this->entries_count ?? $this->entries()->count(),
            'date' => $this->posted_at,
            'poster' => $this->poster ? [
                'id' => $this->poster->id,
                'name' => trim(($this->poster->first_name ?? '').' '.($this->poster->last_name ?? '')),
            ] : null,
            'reversed_by_id' => $this->reversed_by_id,
            'reversed_by' => $this->whenLoaded('reversedBy', fn () => $this->reversedBy ? [
                'id' => $this->reversedBy->id,
                'journal_number' => $this->reversedBy->journal_number,
            ] : null),
            'entries' => JournalEntryResource::collection($this->whenLoaded('entries')),
            'created_at' => $this->created_at,
        ];
    }
}
