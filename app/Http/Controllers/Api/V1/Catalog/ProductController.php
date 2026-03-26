<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreProductRequest;
use App\Http\Requests\Catalog\UpdateProductRequest;
use App\Http\Resources\Catalog\BrandResource;
use App\Http\Resources\Catalog\CategoryResource;
use App\Http\Resources\Catalog\ProductListResource;
use App\Http\Resources\Catalog\ProductResource;
use App\Http\Resources\Catalog\PriceGroupResource;
use App\Http\Resources\Catalog\RackLocationResource;
use App\Http\Resources\Catalog\UnitResource;
use App\Http\Resources\Catalog\VariationTemplateResource;
use App\Http\Resources\Foundation\CustomFieldDefinitionResource;
use App\Http\Resources\Foundation\TaxRateResource;
use App\Models\Product;
use App\Services\Catalog\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends BaseCatalogController
{
    public function __construct(protected ProductService $products)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $items = $this->products->paginate($request->only([
            'search',
            'type',
            'stock_tracking',
            'is_active',
            'category_id',
            'brand_id',
            'per_page',
        ]));

        return $this->paginated($items, ProductListResource::class);
    }

    public function formOptions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $options = $this->products->formOptions($request->user());

        return $this->success([
            'categories' => CategoryResource::collection($options['categories']),
            'brands' => BrandResource::collection($options['brands']),
            'units' => UnitResource::collection($options['units']),
            'tax_rates' => TaxRateResource::collection($options['tax_rates']),
            'price_groups' => PriceGroupResource::collection($options['price_groups']),
            'variation_templates' => VariationTemplateResource::collection($options['variation_templates']),
            'rack_locations_enabled' => (bool) $options['rack_locations_enabled'],
            'rack_locations' => RackLocationResource::collection($options['rack_locations']),
            'custom_fields' => CustomFieldDefinitionResource::collection($options['custom_fields']),
            'combo_products' => ProductResource::collection($options['combo_products']),
        ]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->products->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new ProductResource($product), 'Product created successfully.', 201);
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        return $this->success(new ProductResource($this->products->loadDetails($product)));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $product = $this->products->update(
            (string) $request->user()->business_id,
            $product,
            $request->validated(),
            $request->user()
        );

        return $this->success(new ProductResource($product), 'Product updated successfully.');
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $this->products->delete(
            (string) $request->user()->business_id,
            $product,
            $request->user()
        );

        return $this->success(null, 'Product deleted successfully.');
    }
}
