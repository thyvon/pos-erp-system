<?php

namespace App\Services\Admin;

use App\Models\User;
use App\Models\Business;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use App\Repositories\Foundation\BusinessRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SuperAdminBusinessService
{
    public function __construct(protected BusinessRepository $businesses)
    {
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->businesses->paginateFiltered($filters);
    }

    public function show(Business $business): Business
    {
        return $this->businesses->findWithUsageOrFail($business->id);
    }

    public function create(array $data): Business
    {
        return DB::transaction(function () use ($data): Business {
            $owner = Arr::pull($data, 'owner', []);

            /** @var Business $business */
            $business = $this->businesses->create($data);

            /** @var User $user */
            $user = User::withoutGlobalScopes()->create([
                'business_id' => $business->id,
                'first_name' => $owner['first_name'],
                'last_name' => $owner['last_name'] ?? null,
                'email' => $owner['email'],
                'password' => $owner['password'],
                'phone' => $owner['phone'] ?? null,
                'status' => 'active',
                'max_discount' => 0,
                'commission_percentage' => 0,
                'sales_target_amount' => 0,
                'preferences' => [],
            ]);

            $user->assignRole('admin');

            return $this->businesses->findWithUsageOrFail($business->id);
        });
    }

    public function update(Business $business, array $data): Business
    {
        $this->businesses->update($business, $data);

        return $this->businesses->findWithUsageOrFail($business->id);
    }
}
