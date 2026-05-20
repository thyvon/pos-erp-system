<?php

namespace Tests;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'app.key' => 'base64:'.base64_encode(str_repeat('a', 32)),
        ]);
    }

    protected function assignBranchAccess(User $user, ?Branch $branch = null): Branch
    {
        $branch ??= Branch::factory()->create(['business_id' => $user->business_id]);

        $user->branches()->syncWithoutDetaching([$branch->id]);

        if ($user->default_branch_id === null) {
            $user->forceFill(['default_branch_id' => $branch->id])->save();
        }

        return $branch;
    }
}
