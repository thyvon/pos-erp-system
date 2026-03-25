<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Requests\Catalog\StoreVariationTemplateRequest;
use App\Http\Requests\Catalog\UpdateVariationTemplateRequest;
use App\Http\Resources\Catalog\VariationTemplateResource;
use App\Models\VariationTemplate;
use App\Services\Catalog\VariationTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VariationTemplateController extends BaseCatalogController
{
    public function __construct(protected VariationTemplateService $templates)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', VariationTemplate::class);

        $items = $this->templates->paginate($request->only([
            'search',
            'per_page',
        ]));

        return $this->paginated($items, VariationTemplateResource::class);
    }

    public function options(): JsonResponse
    {
        $this->authorize('viewAny', VariationTemplate::class);

        return $this->success(VariationTemplateResource::collection($this->templates->options()));
    }

    public function store(StoreVariationTemplateRequest $request): JsonResponse
    {
        $this->authorize('create', VariationTemplate::class);

        $template = $this->templates->create(
            (string) $request->user()->business_id,
            $request->validated(),
            $request->user()
        );

        return $this->success(new VariationTemplateResource($template), 'Variation template created successfully.', 201);
    }

    public function show(VariationTemplate $variationTemplate): JsonResponse
    {
        $this->authorize('view', $variationTemplate);

        return $this->success(new VariationTemplateResource($variationTemplate->load(['values'])->loadCount('values')));
    }

    public function update(UpdateVariationTemplateRequest $request, VariationTemplate $variationTemplate): JsonResponse
    {
        $this->authorize('update', $variationTemplate);

        $variationTemplate = $this->templates->update(
            (string) $request->user()->business_id,
            $variationTemplate,
            $request->validated(),
            $request->user()
        );

        return $this->success(new VariationTemplateResource($variationTemplate), 'Variation template updated successfully.');
    }

    public function destroy(Request $request, VariationTemplate $variationTemplate): JsonResponse
    {
        $this->authorize('delete', $variationTemplate);

        $this->templates->delete(
            (string) $request->user()->business_id,
            $variationTemplate,
            $request->user()
        );

        return $this->success(null, 'Variation template deleted successfully.');
    }
}
