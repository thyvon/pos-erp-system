<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\UpdateSettingsGroupRequest;
use App\Models\Setting;
use App\Services\Foundation\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends BaseApiController
{
    public function __construct(protected SettingsService $settingsService)
    {
    }

    public function show(string $group): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        return $this->success($this->settingsService->getGroup($group));
    }

    public function update(UpdateSettingsGroupRequest $request, string $group): JsonResponse
    {
        $this->authorize('updateAny', Setting::class);

        $settings = $this->settingsService->updateGroup($group, $request->validated('settings'), $request->user());

        return $this->success($settings, __('Settings updated successfully.'));
    }
}
