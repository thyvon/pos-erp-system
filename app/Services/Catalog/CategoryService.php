<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\Category;
use App\Models\User;
use App\Repositories\Catalog\CategoryRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CategoryService
{
    public function __construct(
        protected CategoryRepository $categories,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->categories->paginateFiltered($filters);
    }

    public function parentOptions(): Collection
    {
        return $this->categories->getParentOptions();
    }

    public function create(string $businessId, array $data, ?User $actor = null): Category
    {
        return DB::transaction(function () use ($businessId, $data, $actor): Category {
            $payload = $this->normalizePayload($businessId, $data);

            /** @var Category $category */
            $category = $this->categories->create($payload);
            $category = $category->load(['parent'])->loadCount('children');

            $this->auditLogger->log(
                'created',
                Category::class,
                $category->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($category)
            );

            return $category;
        });
    }

    public function update(string $businessId, Category $category, array $data, ?User $actor = null): Category
    {
        return DB::transaction(function () use ($businessId, $category, $data, $actor): Category {
            $this->ensureBelongsToBusiness($businessId, $category);
            $before = $this->auditPayload($category);
            $payload = $this->normalizePayload($businessId, $data, $category);

            /** @var Category $updated */
            $updated = $this->categories->update($category, $payload);
            $updated = $updated->load(['parent'])->loadCount('children');

            $this->auditLogger->log(
                'updated',
                Category::class,
                $updated->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updated)
            );

            return $updated;
        });
    }

    public function delete(string $businessId, Category $category, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $category, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $category);
            $this->ensureCategoryCanBeDeleted($category);
            $before = $this->auditPayload($category);

            $this->categories->delete($category);

            $this->auditLogger->log(
                'deleted',
                Category::class,
                $category->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function normalizePayload(string $businessId, array $data, ?Category $category = null): array
    {
        $parentId = array_key_exists('parent_id', $data)
            ? $data['parent_id']
            : $category?->parent_id;

        $this->ensureParentIsValid($businessId, $parentId, $category);

        return [
            'business_id' => $businessId,
            'parent_id' => filled($parentId) ? (string) $parentId : null,
            'name' => $data['name'] ?? $category?->name,
            'code' => array_key_exists('code', $data) ? $data['code'] : $category?->code,
            'short_code' => array_key_exists('short_code', $data) ? $data['short_code'] : $category?->short_code,
            'image_url' => array_key_exists('image_url', $data) ? $data['image_url'] : $category?->image_url,
            'sort_order' => array_key_exists('sort_order', $data)
                ? (int) $data['sort_order']
                : (int) ($category?->sort_order ?? 0),
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, Category $category): void
    {
        if ((string) $category->business_id !== $businessId) {
            throw new DomainException('Category does not belong to the current business.', 422);
        }
    }

    protected function ensureParentIsValid(string $businessId, mixed $parentId, ?Category $category = null): void
    {
        if (! filled($parentId)) {
            return;
        }

        $query = Category::withoutGlobalScopes()
            ->where('business_id', $businessId)
            ->where('id', $parentId);

        if ($category !== null) {
            $query->where('id', '!=', $category->id);
        }

        /** @var Category|null $parent */
        $parent = $query->first();

        if (! $parent) {
            throw new DomainException('Selected parent category is invalid for this business.', 422);
        }

        if ($parent->parent_id !== null) {
            throw new DomainException('Categories support a maximum depth of two levels.', 422);
        }
    }

    protected function ensureCategoryCanBeDeleted(Category $category): void
    {
        if ($category->children()->exists()) {
            throw new DomainException('Category cannot be deleted because it still has child categories.', 422);
        }

        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'category_id')
            && DB::table('products')->where('category_id', $category->id)->exists()
        ) {
            throw new DomainException('Category cannot be deleted because it is still assigned to products.', 422);
        }
    }

    protected function auditPayload(Category $category): array
    {
        return [
            'id' => $category->id,
            'business_id' => $category->business_id,
            'parent_id' => $category->parent_id,
            'name' => $category->name,
            'code' => $category->code,
            'short_code' => $category->short_code,
            'image_url' => $category->image_url,
            'sort_order' => (int) $category->sort_order,
            'children_count' => (int) ($category->children_count ?? 0),
        ];
    }
}
