<?php

namespace App\Http\Controllers\Api\V1\Foundation;

use App\Http\Controllers\Api\V1\BaseApiController;
use App\Http\Requests\Foundation\UpdateSettingsGroupRequest;
use App\Services\Foundation\SettingsService;
use Illuminate\Http\JsonResponse;

class SettingsController extends BaseApiController
{
    public function __construct(protected SettingsService $settingsService)
    {
    }

    public function show(string $group): JsonResponse
    {
        return $this->success($this->settingsService->getGroup($group));
    }

    public function update(UpdateSettingsGroupRequest $request, string $group): JsonResponse
    {
        $settings = $this->settingsService->updateGroup($group, $request->validated('settings'));

        return $this->success($settings, 'Settings updated successfully.');
    }
}
