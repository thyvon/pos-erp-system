<?php

namespace App\Services\Foundation;

use App\Models\CustomFieldDefinition;
use App\Repositories\Foundation\CustomFieldDefinitionRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomFieldDefinitionService
{
    public function __construct(protected CustomFieldDefinitionRepository $definitions)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->definitions->paginateFiltered($filters);
    }

    public function create(array $data): CustomFieldDefinition
    {
        /** @var CustomFieldDefinition $definition */
        $definition = $this->definitions->create([
            'module' => $data['module'],
            'field_name' => $data['field_name'],
            'field_label' => $data['field_label'],
            'field_type' => $data['field_type'],
            'options' => $data['field_type'] === 'select' ? ($data['options'] ?? []) : null,
            'is_required' => (bool) ($data['is_required'] ?? false),
            'sort_order' => (int) ($data['sort_order'] ?? 0),
        ]);

        return $definition;
    }

    public function update(CustomFieldDefinition $definition, array $data): CustomFieldDefinition
    {
        if (array_key_exists('field_type', $data) && $data['field_type'] !== 'select') {
            $data['options'] = null;
        }

        /** @var CustomFieldDefinition $updatedDefinition */
        $updatedDefinition = $this->definitions->update($definition, $data);

        return $updatedDefinition;
    }

    public function delete(CustomFieldDefinition $definition): void
    {
        $this->definitions->delete($definition);
    }
}
