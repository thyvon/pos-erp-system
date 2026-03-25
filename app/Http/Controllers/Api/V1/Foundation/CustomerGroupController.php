<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreCustomerGroupRequest;
use App\Http\Requests\Foundation\UpdateCustomerGroupRequest;
use App\Http\Resources\Foundation\CustomerGroupResource;
use App\Models\CustomerGroup;
use App\Services\Foundation\CustomerGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerGroupController extends BaseApiController
{
    public function __construct(protected CustomerGroupService $customerGroups)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CustomerGroup::class);

        $items = $this->customerGroups->paginate($request->only([
            'search',
            'per_page',
        ]));

        return $this->paginated($items, CustomerGroupResource::class);
    }

    public function store(StoreCustomerGroupRequest $request): JsonResponse
    {
        $this->authorize('create', CustomerGroup::class);

        $customerGroup = $this->customerGroups->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CustomerGroupResource($customerGroup), 'Customer group created successfully.', 201);
    }

    public function show(CustomerGroup $customerGroup): JsonResponse
    {
        $this->authorize('view', $customerGroup);

        return $this->success(new CustomerGroupResource($customerGroup));
    }

    public function update(UpdateCustomerGroupRequest $request, CustomerGroup $customerGroup): JsonResponse
    {
        $this->authorize('update', $customerGroup);

        $customerGroup = $this->customerGroups->update(
            (string) $request->user()->business_id,
            $customerGroup,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CustomerGroupResource($customerGroup), 'Customer group updated successfully.');
    }

    public function destroy(Request $request, CustomerGroup $customerGroup): JsonResponse
    {
        $this->authorize('delete', $customerGroup);

        $this->customerGroups->delete(
            (string) $request->user()->business_id,
            $customerGroup,
            $request->user()
        );

        return $this->success(null, 'Customer group deleted successfully.');
    }
}
