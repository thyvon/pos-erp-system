<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Api\V1\BaseApiController;
use App\Services\Admin\SuperAdminBusinessService;
use App\Http\Requests\Admin\StoreBusinessRequest;
use App\Http\Resources\Admin\ManagedBusinessResource;
use App\Http\Requests\Admin\UpdateManagedBusinessRequest;

class BusinessManagementController extends BaseApiController
{
    public function __construct(protected SuperAdminBusinessService $businesses)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $items = $this->businesses->paginate($request->only([
            'search',
            'status',
            'tier',
            'per_page',
            'page',
        ]));

        return $this->paginated($items, ManagedBusinessResource::class);
    }

    public function store(StoreBusinessRequest $request): JsonResponse
    {
        $business = $this->businesses->create($request->validated());

        return $this->success(new ManagedBusinessResource($business), 'Business registered successfully.', 201);
    }

    public function show(Business $business): JsonResponse
    {
        return $this->success(new ManagedBusinessResource($this->businesses->show($business)));
    }

    public function update(UpdateManagedBusinessRequest $request, Business $business): JsonResponse
    {
        $updatedBusiness = $this->businesses->update($business, $request->validated());

        return $this->success(new ManagedBusinessResource($updatedBusiness), 'Business updated successfully.');
    }
}
