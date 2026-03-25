<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreCategoryRequest;
use App\Http\Requests\Catalog\UpdateCategoryRequest;
use App\Http\Resources\Catalog\CategoryResource;
use App\Models\Category;
use App\Services\Catalog\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends BaseCatalogController
{
    public function __construct(protected CategoryService $categories)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        $items = $this->categories->paginate($request->only([
            'search',
            'parent_id',
            'per_page',
        ]));

        return $this->paginated($items, CategoryResource::class);
    }

    public function options(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Category::class);

        return $this->success(
            CategoryResource::collection($this->categories->parentOptions())
        );
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $category = $this->categories->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CategoryResource($category), 'Category created successfully.', 201);
    }

    public function show(Category $category): JsonResponse
    {
        $this->authorize('view', $category);

        return $this->success(new CategoryResource($category->load(['parent'])->loadCount('children')));
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $category = $this->categories->update(
            (string) $request->user()->business_id,
            $category,
            $request->validated(),
            $request->user()
        );

        return $this->success(new CategoryResource($category), 'Category updated successfully.');
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $this->categories->delete(
            (string) $request->user()->business_id,
            $category,
            $request->user()
        );

        return $this->success(null, 'Category deleted successfully.');
    }
}
