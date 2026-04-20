<?php

namespace App\Http\Controllers\Api\V1\Accounting;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Accounting\ReverseJournalRequest;
use App\Http\Requests\Accounting\StoreManualJournalRequest;
use App\Http\Resources\Accounting\JournalResource;
use App\Models\Journal;
use App\Services\Accounting\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalController extends BaseApiController
{
    public function __construct(protected AccountingService $accounting)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Journal::class);

        $items = $this->accounting->paginate($request->only([
            'search',
            'status',
            'journal_type',
            'per_page',
        ]));

        return $this->paginated($items, JournalResource::class, [
            'summary' => $this->accounting->summary(),
        ]);
    }

    public function store(StoreManualJournalRequest $request): JsonResponse
    {
        $this->authorize('create', Journal::class);

        $journal = $this->accounting->postJournal(
            $request->user()->business_id,
            [
                ...$request->validated(),
                'type' => 'manual',
            ],
            $request->user()
        );

        return $this->success(new JournalResource($journal), 'Journal posted successfully.', 201);
    }

    public function show(Journal $journal): JsonResponse
    {
        $this->authorize('view', $journal);

        return $this->success(new JournalResource(
            $journal->load(['poster', 'reversedBy', 'entries.account'])->loadCount('entries')
        ));
    }

    public function reverse(ReverseJournalRequest $request, Journal $journal): JsonResponse
    {
        $this->authorize('reverse', $journal);

        $reversal = $this->accounting->reverseJournal(
            $request->user()->business_id,
            $journal,
            $request->validated()['reason'],
            $request->user()
        );

        return $this->success(new JournalResource($reversal), 'Journal reversed successfully.');
    }
}
