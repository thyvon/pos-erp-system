<?php

namespace App\Services\Foundation;

use App\Exceptions\Domain\InvalidStateTransitionException;
use Carbon\CarbonInterface;
use Throwable;

class EditWindowService
{
    public function __construct(protected SettingsService $settings)
    {
    }

    public function lifetimeDays(string $group, string $key, int $default = 30): int
    {
        try {
            return max(0, (int) $this->settings->get($group, $key));
        } catch (Throwable) {
            return max(0, $default);
        }
    }

    public function isWithinWindow(
        ?CarbonInterface $referenceDate,
        string $group,
        string $key,
        int $default = 30,
    ): bool {
        if (! $referenceDate) {
            return true;
        }

        $lifetimeDays = $this->lifetimeDays($group, $key, $default);

        if ($lifetimeDays <= 0) {
            return true;
        }

        return now()->startOfDay()->diffInDays($referenceDate->copy()->startOfDay()) <= $lifetimeDays;
    }

    public function assertWithinWindow(
        ?CarbonInterface $referenceDate,
        string $group,
        string $key,
        string $message,
        int $default = 30,
    ): void {
        if (! $this->isWithinWindow($referenceDate, $group, $key, $default)) {
            throw new InvalidStateTransitionException($message);
        }
    }
}
