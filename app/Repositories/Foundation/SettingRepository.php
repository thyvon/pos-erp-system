<?php

namespace App\Repositories\Foundation;

use App\Models\Setting;
use App\Repositories\BaseRepository;
use Illuminate\Support\Collection;

class SettingRepository extends BaseRepository
{
    public function __construct(Setting $model)
    {
        parent::__construct($model);
    }

    public function findByGroupAndKey(string $group, string $key): ?Setting
    {
        return $this->query()
            ->where('group', $group)
            ->where('key', $key)
            ->first();
    }

    public function getGroup(string $group): Collection
    {
        return $this->query()
            ->where('group', $group)
            ->orderBy('key')
            ->get();
    }
}
