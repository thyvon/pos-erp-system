<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('module_key', 80);
            $table->enum('status', ['active', 'trial', 'expired', 'disabled'])->default('active');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->json('limits')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['business_id', 'module_key'], 'business_modules_business_key_unique');
            $table->index(['business_id', 'status'], 'business_modules_business_status_idx');
        });

        if (! Schema::hasTable('businesses')) {
            return;
        }

        $moduleKeys = array_keys(array_filter(
            config('modules.modules', []),
            fn (array $definition): bool => (bool) ($definition['default_enabled'] ?? false)
        ));

        $now = now();

        DB::table('businesses')
            ->select('id')
            ->orderBy('id')
            ->chunk(100, function ($businesses) use ($moduleKeys, $now): void {
                $rows = [];

                foreach ($businesses as $business) {
                    foreach ($moduleKeys as $moduleKey) {
                        $rows[] = [
                            'id' => (string) Str::uuid(),
                            'business_id' => $business->id,
                            'module_key' => $moduleKey,
                            'status' => 'active',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if ($rows !== []) {
                    DB::table('business_modules')->insertOrIgnore($rows);
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_modules');
    }
};
