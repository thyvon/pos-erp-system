<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Resources\Foundation\CambodiaAddressDivisionResource;
use App\Models\Setting;
use App\Services\Foundation\CambodiaAddressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CambodiaAddressController extends BaseApiController
{
    public function __construct(protected CambodiaAddressService $addresses)
    {
    }

    public function provinces(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'id' => ['nullable', 'string'],
            'name_en' => ['nullable', 'string'],
            'name_km' => ['nullable', 'string'],
        ]);

        return $this->success(CambodiaAddressDivisionResource::collection(
            $this->addresses->provinces($filters)
        )->resolve());
    }

    public function districts(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'province_id' => ['nullable', 'string'],
            'id' => ['nullable', 'string'],
            'name_en' => ['nullable', 'string'],
            'name_km' => ['nullable', 'string'],
        ]);

        return $this->success(CambodiaAddressDivisionResource::collection(
            $this->addresses->districts($filters)
        )->resolve());
    }

    public function communes(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'district_id' => ['nullable', 'string'],
            'province_id' => ['nullable', 'string'],
            'id' => ['nullable', 'string'],
            'name_en' => ['nullable', 'string'],
            'name_km' => ['nullable', 'string'],
        ]);

        return $this->success(CambodiaAddressDivisionResource::collection(
            $this->addresses->communes($filters)
        )->resolve());
    }

    public function villages(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'commune_id' => ['nullable', 'string'],
            'district_id' => ['nullable', 'string'],
            'province_id' => ['nullable', 'string'],
            'id' => ['nullable', 'string'],
            'name_en' => ['nullable', 'string'],
            'name_km' => ['nullable', 'string'],
        ]);

        return $this->success(CambodiaAddressDivisionResource::collection(
            $this->addresses->villages($filters)
        )->resolve());
    }

    public function syncStatus(): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        return $this->success($this->addresses->status());
    }

    public function sync(): JsonResponse
    {
        $this->authorize('updateAny', Setting::class);

        return $this->success($this->addresses->syncFromSource(), __('Cambodia address data synchronized successfully.'));
    }
}
