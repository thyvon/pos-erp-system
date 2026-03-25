<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreSupplierRequest;
use App\Http\Requests\Foundation\UpdateSupplierRequest;
use App\Http\Resources\Foundation\SupplierResource;
use App\Models\Supplier;
use App\Services\Foundation\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends BaseApiController
{
    public function __construct(protected SupplierService $suppliers)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Supplier::class);

        $items = $this->suppliers->paginate($request->only([
            'search',
            'status',
            'per_page',
        ]));

        return $this->paginated($items, SupplierResource::class);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $this->authorize('create', Supplier::class);

        $supplier = $this->suppliers->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new SupplierResource($supplier), 'Supplier created successfully.', 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        $this->authorize('view', $supplier);

        return $this->success(new SupplierResource($supplier));
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $this->authorize('update', $supplier);

        $supplier = $this->suppliers->update(
            (string) $request->user()->business_id,
            $supplier,
            $request->validated(),
            $request->user()
        );

        return $this->success(new SupplierResource($supplier), 'Supplier updated successfully.');
    }

    public function destroy(Request $request, Supplier $supplier): JsonResponse
    {
        $this->authorize('delete', $supplier);

        $this->suppliers->delete(
            (string) $request->user()->business_id,
            $supplier,
            $request->user()
        );

        return $this->success(null, 'Supplier deleted successfully.');
    }
}
