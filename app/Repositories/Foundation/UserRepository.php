<?php

namespace App\Repositories\Foundation;

use App\Models\User;
use App\Repositories\BaseRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository extends BaseRepository
{
    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->query()
            ->where('email', $email)
            ->first();
    }

    public function paginateFiltered(array $filters): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        return $this->query()
            ->with(['business', 'roles', 'permissions'])
            ->when(
                filled($filters['search'] ?? null),
                function ($query) use ($filters): void {
                    $search = trim((string) $filters['search']);

                    $query->where(function ($userQuery) use ($search): void {
                        $userQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                filled($filters['status'] ?? null),
                fn ($query) => $query->where('status', $filters['status'])
            )
            ->when(
                filled($filters['role'] ?? null),
                fn ($query) => $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $filters['role']))
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }
}
