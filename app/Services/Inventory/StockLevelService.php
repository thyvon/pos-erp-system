<?php

namespace App\Services\Inventory;

use App\Models\User;
use App\Repositories\Inventory\StockLevelRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class StockLevelService
{
    public function __construct(protected StockLevelRepository $stockLevels)
    {
    }

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        return $this->stockLevels->paginateFiltered($filters, $user);
    }
}
