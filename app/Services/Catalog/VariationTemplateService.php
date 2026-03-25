<?php

namespace App\Services\Catalog;

use App\Exceptions\Domain\DomainException;
use App\Models\User;
use App\Models\VariationTemplate;
use App\Models\VariationValue;
use App\Repositories\Catalog\VariationTemplateRepository;
use App\Support\Audit\AuditLogger;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class VariationTemplateService
{
    public function __construct(
        protected VariationTemplateRepository $templates,
        protected AuditLogger $auditLogger,
    ) {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->templates->paginateFiltered($filters);
    }

    public function options(): Collection
    {
        return $this->templates->options();
    }

    public function create(string $businessId, array $data, ?User $actor = null): VariationTemplate
    {
        return DB::transaction(function () use ($businessId, $data, $actor): VariationTemplate {
            $this->ensureUniqueValueNames($data['values'] ?? []);

            /** @var VariationTemplate $template */
            $template = $this->templates->create($this->normalizeTemplatePayload($businessId, $data));
            $this->syncValues($businessId, $template, $data['values'] ?? []);
            $template = $template->refresh()->load(['values'])->loadCount('values');

            $this->auditLogger->log(
                'created',
                VariationTemplate::class,
                $template->id,
                $actor,
                $businessId,
                null,
                $this->auditPayload($template)
            );

            return $template;
        });
    }

    public function update(string $businessId, VariationTemplate $template, array $data, ?User $actor = null): VariationTemplate
    {
        return DB::transaction(function () use ($businessId, $template, $data, $actor): VariationTemplate {
            $this->ensureBelongsToBusiness($businessId, $template);
            $this->ensureUniqueValueNames($data['values'] ?? []);
            $before = $this->auditPayload($template->load(['values'])->loadCount('values'));

            /** @var VariationTemplate $updatedTemplate */
            $updatedTemplate = $this->templates->update($template, $this->normalizeTemplatePayload($businessId, $data, $template));
            $this->syncValues($businessId, $updatedTemplate, $data['values'] ?? []);
            $updatedTemplate = $updatedTemplate->refresh()->load(['values'])->loadCount('values');

            $this->auditLogger->log(
                'updated',
                VariationTemplate::class,
                $updatedTemplate->id,
                $actor,
                $businessId,
                $before,
                $this->auditPayload($updatedTemplate)
            );

            return $updatedTemplate;
        });
    }

    public function delete(string $businessId, VariationTemplate $template, ?User $actor = null): void
    {
        DB::transaction(function () use ($businessId, $template, $actor): void {
            $this->ensureBelongsToBusiness($businessId, $template);
            $template = $template->load(['values'])->loadCount('values');
            $this->ensureTemplateCanBeDeleted($template);
            $before = $this->auditPayload($template);

            $this->templates->delete($template);

            $this->auditLogger->log(
                'deleted',
                VariationTemplate::class,
                $template->id,
                $actor,
                $businessId,
                $before,
                null
            );
        });
    }

    protected function normalizeTemplatePayload(string $businessId, array $data, ?VariationTemplate $template = null): array
    {
        return [
            'business_id' => $businessId,
            'name' => $data['name'] ?? $template?->name,
        ];
    }

    protected function syncValues(string $businessId, VariationTemplate $template, array $values): void
    {
        $existing = $template->values()->get()->keyBy('id');
        $seenIds = [];

        foreach ($values as $index => $valueData) {
            $valueId = $valueData['id'] ?? null;

            if ($valueId !== null) {
                /** @var VariationValue|null $value */
                $value = $existing->get($valueId);

                if (! $value) {
                    throw new DomainException('Selected variation value is invalid for this template.', 422);
                }

                $value->fill($this->normalizeValuePayload($businessId, $template, $valueData, $index, $value));
                $value->save();
                $seenIds[] = $value->id;
                continue;
            }

            $created = $this->templates->newValueQuery()->create(
                $this->normalizeValuePayload($businessId, $template, $valueData, $index)
            );

            $seenIds[] = $created->id;
        }

        $deleteIds = $existing->keys()->diff($seenIds)->values();

        if ($deleteIds->isNotEmpty()) {
            $this->ensureValuesCanBeDeleted($deleteIds->all());
            $this->templates->newValueQuery()->whereIn('id', $deleteIds)->delete();
        }
    }

    protected function normalizeValuePayload(
        string $businessId,
        VariationTemplate $template,
        array $data,
        int $index,
        ?VariationValue $value = null,
    ): array {
        return [
            'business_id' => $businessId,
            'variation_template_id' => $template->id,
            'name' => $data['name'] ?? $value?->name,
            'sort_order' => array_key_exists('sort_order', $data)
                ? (int) $data['sort_order']
                : ($value?->sort_order ?? (($index + 1) * 10)),
        ];
    }

    protected function ensureBelongsToBusiness(string $businessId, VariationTemplate $template): void
    {
        if ((string) $template->business_id !== $businessId) {
            throw new DomainException('Variation template does not belong to the current business.', 422);
        }
    }

    protected function ensureUniqueValueNames(array $values): void
    {
        $names = [];

        foreach ($values as $value) {
            $normalized = Str::lower(trim((string) ($value['name'] ?? '')));

            if ($normalized === '') {
                continue;
            }

            if (in_array($normalized, $names, true)) {
                throw new DomainException('Variation value names must be unique within the same template.', 422);
            }

            $names[] = $normalized;
        }
    }

    protected function ensureTemplateCanBeDeleted(VariationTemplate $template): void
    {
        if (
            Schema::hasTable('products')
            && Schema::hasColumn('products', 'variation_template_id')
            && DB::table('products')->where('variation_template_id', $template->id)->exists()
        ) {
            throw new DomainException('Variation template cannot be deleted because it is still assigned to products.', 422);
        }

        $valueIds = $template->values->pluck('id')->all();

        if (
            ! empty($valueIds)
            && Schema::hasTable('product_variations')
            && Schema::hasColumn('product_variations', 'variation_value_ids')
        ) {
            foreach ($valueIds as $valueId) {
                $exists = DB::table('product_variations')
                    ->whereJsonContains('variation_value_ids', $valueId)
                    ->exists();

                if ($exists) {
                    throw new DomainException('Variation template cannot be deleted because one of its values is still used by product variations.', 422);
                }
            }
        }
    }

    protected function ensureValuesCanBeDeleted(array $valueIds): void
    {
        if (
            empty($valueIds)
            || ! Schema::hasTable('product_variations')
            || ! Schema::hasColumn('product_variations', 'variation_value_ids')
        ) {
            return;
        }

        foreach ($valueIds as $valueId) {
            $exists = DB::table('product_variations')
                ->whereJsonContains('variation_value_ids', $valueId)
                ->exists();

            if ($exists) {
                throw new DomainException('A variation value cannot be removed because it is still used by product variations.', 422);
            }
        }
    }

    protected function auditPayload(VariationTemplate $template): array
    {
        return [
            'id' => $template->id,
            'business_id' => $template->business_id,
            'name' => $template->name,
            'values_count' => (int) ($template->values_count ?? $template->values->count()),
            'values' => $template->values->map(fn (VariationValue $value) => [
                'id' => $value->id,
                'name' => $value->name,
                'sort_order' => (int) $value->sort_order,
            ])->values()->all(),
        ];
    }
}
