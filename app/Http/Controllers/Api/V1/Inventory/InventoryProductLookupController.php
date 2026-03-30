<?php

namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Services\Inventory\InventoryProductLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryProductLookupController extends BaseApiController
{
    public function __construct(
        protected InventoryProductLookupService $lookupService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'max:120'],
            'warehouse_id' => ['nullable', 'uuid'],
        ]);

        $results = $this->lookupService->search(
            $request->user()->business_id,
            $validated['q'],
            $validated['warehouse_id'] ?? null,
            $request->user(),
        );

        return $this->success($results);
    }
}
