<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreCustomerRequest;
use App\Http\Requests\Foundation\UpdateCustomerRequest;
use App\Http\Resources\Foundation\CustomerResource;
use App\Models\Customer;
use App\Services\Foundation\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends BaseApiController
{
    public function __construct(protected CustomerService $customers)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Customer::class);

        $items = $this->customers->paginate($request->only([
            'search',
            'status',
            'customer_group_id',
            'per_page',
        ]));

        return $this->paginated($items, CustomerResource::class);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $this->authorize('create', Customer::class);

        $customer = $this->customers->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CustomerResource($customer), 'Customer created successfully.', 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $this->authorize('view', $customer);

        return $this->success(new CustomerResource($customer));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $this->authorize('update', $customer);

        $customer = $this->customers->update(
            (string) $request->user()->business_id,
            $customer,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CustomerResource($customer), 'Customer updated successfully.');
    }

    public function destroy(Request $request, Customer $customer): JsonResponse
    {
        $this->authorize('delete', $customer);

        $this->customers->delete(
            (string) $request->user()->business_id,
            $customer,
            $request->user()
        );

        return $this->success(null, 'Customer deleted successfully.');
    }
}
