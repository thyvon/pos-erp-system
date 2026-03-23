<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\StoreCustomFieldDefinitionRequest;
use App\Http\Requests\Foundation\UpdateCustomFieldDefinitionRequest;
use App\Http\Resources\Foundation\CustomFieldDefinitionResource;
use App\Models\CustomFieldDefinition;
use App\Services\Foundation\CustomFieldDefinitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomFieldDefinitionController extends BaseApiController
{
    public function __construct(protected CustomFieldDefinitionService $definitions)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CustomFieldDefinition::class);

        $items = $this->definitions->paginate($request->only([
            'search',
            'module',
            'per_page',
        ]));

        return $this->paginated($items, CustomFieldDefinitionResource::class);
    }

    public function store(StoreCustomFieldDefinitionRequest $request): JsonResponse
    {
        $this->authorize('create', CustomFieldDefinition::class);

        $definition = $this->definitions->create($request->validated());

        return $this->success(new CustomFieldDefinitionResource($definition), 'Custom field definition created successfully.', 201);
    }

    public function show(CustomFieldDefinition $customFieldDefinition): JsonResponse
    {
        $this->authorize('view', $customFieldDefinition);

        return $this->success(new CustomFieldDefinitionResource($customFieldDefinition));
    }

    public function update(UpdateCustomFieldDefinitionRequest $request, CustomFieldDefinition $customFieldDefinition): JsonResponse
    {
        $this->authorize('update', $customFieldDefinition);

        $definition = $this->definitions->update($customFieldDefinition, $request->validated());

        return $this->success(new CustomFieldDefinitionResource($definition), 'Custom field definition updated successfully.');
    }

    public function destroy(CustomFieldDefinition $customFieldDefinition): JsonResponse
    {
        $this->authorize('delete', $customFieldDefinition);

        $this->definitions->delete($customFieldDefinition);

        return $this->success(null, 'Custom field definition deleted successfully.');
    }
}
