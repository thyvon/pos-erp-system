<?php

namespace Tests\Feature\Database;

use App\Models\Business;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PostgreSqlBaselineTest extends TestCase
{
    use RefreshDatabase;

    public function test_postgresql_extensions_defaults_and_integrity_indexes_are_installed(): void
    {
        $this->assertSame('pgsql', DB::getDriverName());
        $this->assertTrue(DB::table('pg_extension')->where('extname', 'pg_trgm')->exists());

        $indexes = DB::table('pg_indexes')
            ->where('schemaname', 'public')
            ->pluck('indexname');

        $this->assertContains('stock_levels_unique_idx', $indexes);
        $this->assertContains('warehouse_product_settings_active_unique_idx', $indexes);
        $this->assertContains('products_business_sku_ci_unique', $indexes);
        $this->assertContains('products_search_trgm_idx', $indexes);

        $statusDefault = DB::table('information_schema.columns')
            ->where('table_schema', 'public')
            ->where('table_name', 'stock_transfers')
            ->where('column_name', 'status')
            ->value('column_default');

        $this->assertIsString($statusDefault);
        $this->assertStringContainsString('pending', $statusDefault);
    }

    public function test_case_insensitive_search_uses_postgresql_semantics(): void
    {
        $business = Business::factory()->create([
            'name' => 'Acme Market',
            'email' => 'owner@example.com',
        ]);

        $this->assertTrue(
            Business::query()
                ->whereKey($business->id)
                ->whereLike('name', '%ACME%')
                ->exists()
        );
    }
}
