<?php

namespace App\Imports;

use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use App\Services\Foundation\UserService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class UserImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    private int $imported = 0;
    private int $skipped = 0;
    private array $errors = [];

    public function __construct(
        private readonly Business $business,
        private readonly UserService $userService,
        private readonly ?User $actor = null,
    ) {
    }

    public function collection(Collection $rows): void
    {
        $context = $this->buildContext();

        foreach ($rows as $index => $row) {
            try {
                $payload = $this->payloadFromRow($row, $context);
                $this->userService->create($payload, $this->actor);
                $this->imported++;
            } catch (\Throwable $e) {
                $this->skipped++;
                $this->errors[] = 'Row '.($index + 2).': '.$e->getMessage();
            }
        }
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    public function getSkippedCount(): int
    {
        return $this->skipped;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    private function buildContext(): array
    {
        $businessId = (string) $this->business->id;

        return [
            'branches' => $this->lookup(
                Branch::withoutGlobalScopes()->where('business_id', $businessId)->whereNull('deleted_at')->get(),
                ['id', 'name', 'code']
            ),
        ];
    }

    private function payloadFromRow(Collection|array $row, array $context): array
    {
        $firstName = $this->text($row, 'first_name');

        if ($firstName === null) {
            throw new InvalidArgumentException('First name is required.');
        }

        $lastName = $this->text($row, 'last_name');

        if ($lastName === null) {
            throw new InvalidArgumentException('Last name is required.');
        }

        $email = $this->text($row, 'email');

        if ($email === null) {
            throw new InvalidArgumentException('Email is required.');
        }

        $password = $this->text($row, 'password') ?? Str::password(16);

        $payload = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'password' => $password,
            'phone' => $this->text($row, 'phone'),
            'status' => $this->enum($this->text($row, 'status') ?? 'active', ['active', 'inactive', 'suspended'], 'status'),
            'max_discount' => $this->decimal($this->value($row, 'max_discount')),
            'commission_percentage' => $this->decimal($this->value($row, 'commission_percentage')),
            'sales_target_amount' => $this->decimal($this->value($row, 'sales_target_amount')),
        ];

        $role = $this->text($row, 'role');

        if ($role !== null) {
            $payload['role'] = $role;
        }

        $roles = $this->text($row, 'roles');

        if ($roles !== null) {
            $payload['roles'] = $this->listValues($roles);
        }

        $directPermissions = $this->text($row, 'direct_permissions');

        if ($directPermissions !== null) {
            $payload['direct_permissions'] = $this->listValues($directPermissions);
        }

        $branchIds = $this->text($row, 'branch_ids');

        if ($branchIds !== null) {
            $payload['branch_ids'] = collect($this->listValues($branchIds))
                ->map(fn (string $value) => $this->resolve($value, $context['branches'], false, $value))
                ->filter()
                ->values()
                ->all();
        }

        $defaultBranch = $this->text($row, 'default_branch_id');

        if ($defaultBranch !== null) {
            $resolved = $this->resolve($defaultBranch, $context['branches'], false, null);

            if ($resolved !== null) {
                $payload['default_branch_id'] = $resolved;
            }
        }

        return $payload;
    }

    private function lookup(Collection $items, array $keys): array
    {
        $lookup = [];

        foreach ($items as $item) {
            foreach ($keys as $key) {
                $value = $item->{$key} ?? null;

                if ($value === null || $value === '') {
                    continue;
                }

                $lookup[$this->normalizeKey((string) $value)] = (string) $item->id;
            }
        }

        return $lookup;
    }

    private function resolve(?string $value, array $lookup, bool $required = false, mixed $default = null): mixed
    {
        if ($value === null) {
            if ($required) {
                throw new InvalidArgumentException('Lookup value is required.');
            }

            return $default;
        }

        return $lookup[$this->normalizeKey($value)] ?? $default;
    }

    private function listValues(mixed $value, string $separatorPattern = null): array
    {
        if (is_array($value)) {
            return collect($value)
                ->map(fn ($item) => $this->textFrom($item))
                ->filter()
                ->values()
                ->all();
        }

        $text = $this->textFrom($value);

        if ($text === null) {
            return [];
        }

        $pattern = $separatorPattern ?? '/[|,;]/';
        $parts = $separatorPattern === null ? preg_split($pattern, $text) : explode($separatorPattern, $text);

        return collect($parts ?: [])
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();
    }

    private function enum(?string $value, array $allowed, string $field): string
    {
        $normalized = Str::lower(trim((string) $value));

        if (! in_array($normalized, $allowed, true)) {
            throw new InvalidArgumentException("Invalid {$field} value.");
        }

        return $normalized;
    }

    private function boolean(mixed $value, bool $default): bool
    {
        $text = $this->textFrom($value);

        if ($text === null) {
            return $default;
        }

        return match (Str::lower($text)) {
            '1', 'true', 'yes', 'y', 'active', 'enabled', 'on' => true,
            '0', 'false', 'no', 'n', 'inactive', 'disabled', 'off' => false,
            default => $default,
        };
    }

    private function decimal(mixed $value): ?float
    {
        $text = $this->textFrom($value);

        if ($text === null) {
            return null;
        }

        $number = str_replace(',', '', $text);

        if (! is_numeric($number)) {
            throw new InvalidArgumentException('Invalid numeric value.');
        }

        return (float) $number;
    }

    private function requiredDecimal(mixed $value, string $field): float
    {
        $decimal = $this->decimal($value);

        if ($decimal === null) {
            throw new InvalidArgumentException("{$field} is required.");
        }

        return $decimal;
    }

    private function text(Collection|array $row, string $key): ?string
    {
        return $this->textFrom($this->value($row, $key));
    }

    private function value(Collection|array $row, string $key): mixed
    {
        return $row instanceof Collection ? $row->get($key) : ($row[$key] ?? null);
    }

    private function textFrom(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    private function normalizeKey(string $value): string
    {
        return Str::lower(trim($value));
    }
}
