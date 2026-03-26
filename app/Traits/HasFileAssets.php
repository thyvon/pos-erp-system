<?php

namespace App\Traits;

use App\Models\FileAsset;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasFileAssets
{
    public function fileAssets(): MorphMany
    {
        return $this->morphMany(FileAsset::class, 'attachable')->orderBy('sort_order')->orderBy('created_at');
    }

    public function primaryImage(): MorphOne
    {
        return $this->morphOne(FileAsset::class, 'attachable')
            ->where('collection', 'primary_image')
            ->latestOfMany('created_at');
    }
}
