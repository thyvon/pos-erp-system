<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VariationTemplate;
use App\Policies\Concerns\HandlesTenantPolicy;

class VariationTemplatePolicy
{
    use HandlesTenantPolicy;

    public function viewAny(User $user): bool
    {
        return $user->can('variation_templates.index');
    }

    public function view(User $user, VariationTemplate $template): bool
    {
        return $user->can('variation_templates.index')
            && $this->belongsToSameBusiness($user, $template);
    }

    public function create(User $user): bool
    {
        return $user->can('variation_templates.create');
    }

    public function update(User $user, VariationTemplate $template): bool
    {
        return $user->can('variation_templates.edit')
            && $this->belongsToSameBusiness($user, $template);
    }

    public function delete(User $user, VariationTemplate $template): bool
    {
        return $user->can('variation_templates.delete')
            && $this->belongsToSameBusiness($user, $template);
    }
}
