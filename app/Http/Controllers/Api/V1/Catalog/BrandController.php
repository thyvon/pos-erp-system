<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreBrandRequest;
use App\Http\Requests\Catalog\UpdateBrandRequest;
use App\Http\Resources\Catalog\BrandResource;
use App\Models\Brand;
use App\Services\Catalog\BrandService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends BaseCatalogController
{
    public function __construct(protected BrandService $brands)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Brand::class);

        $items = $this->brands->paginate($request->only([
            'search',
            'per_page',
        ]));

        return $this->paginated($items, BrandResource::class);
    }

    public function options(): JsonResponse
    {
        $this->authorize('viewAny', Brand::class);

        return $this->success(BrandResource::collection($this->brands->options()));
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        $this->authorize('create', Brand::class);

        $brand = $this->brands->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new BrandResource($brand), 'Brand created successfully.', 201);
    }

    public function show(Brand $brand): JsonResponse
    {
        $this->authorize('view', $brand);

        return $this->success(new BrandResource($brand));
    }

    public function update(UpdateBrandRequest $request, Brand $brand): JsonResponse
    {
        $this->authorize('update', $brand);

        $brand = $this->brands->update(
            (string) $request->user()->business_id,
            $brand,
            $request->validated(),
            $request->user()
        );

        return $this->success(new BrandResource($brand), 'Brand updated successfully.');
    }

    public function destroy(Request $request, Brand $brand): JsonResponse
    {
        $this->authorize('delete', $brand);

        $this->brands->delete(
            (string) $request->user()->business_id,
            $brand,
            $request->user()
        );

        return $this->success(null, 'Brand deleted successfully.');
    }
}
