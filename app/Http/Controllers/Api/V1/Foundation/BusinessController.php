<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\UpdateBusinessRequest;
use App\Http\Resources\Foundation\BusinessResource;
use App\Services\Foundation\BusinessService;
use Illuminate\Http\JsonResponse;

class BusinessController extends BaseApiController
{
    public function __construct(protected BusinessService $businessService)
    {
    }

    public function show(): JsonResponse
    {
        $business = $this->businessService->getCurrentBusiness();
        $this->authorize('view', $business);

        return $this->success(new BusinessResource($business));
    }

    public function update(UpdateBusinessRequest $request): JsonResponse
    {
        $business = $this->businessService->getCurrentBusiness();
        $this->authorize('update', $business);

        $updatedBusiness = $this->businessService->updateCurrentBusiness($request->validated());

        return $this->success(new BusinessResource($updatedBusiness), __('Business profile updated successfully.'));
    }
}
