<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        DB::statement('ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_status_check');
        DB::statement("ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_status_check CHECK (status IN ('completed', 'pending', 'in_transit', 'received'))");
        DB::statement("ALTER TABLE stock_transfers ALTER COLUMN status SET DEFAULT 'pending'");

        // NULLS NOT DISTINCT requires PostgreSQL >= 15 (Docker uses 16, but guard for safety).
        $pgVersion = DB::connection()->getServerVersion();
        $supportsNullsNotDistinct = version_compare($pgVersion, '15', '>=');

        DB::statement('ALTER TABLE stock_levels DROP CONSTRAINT IF EXISTS stock_levels_unique_idx');
        DB::statement('DROP INDEX IF EXISTS stock_levels_unique_idx');
        if ($supportsNullsNotDistinct) {
            DB::statement('CREATE UNIQUE INDEX stock_levels_unique_idx ON stock_levels (business_id, product_id, variation_id, warehouse_id) NULLS NOT DISTINCT');
        } else {
            DB::statement('CREATE UNIQUE INDEX stock_levels_unique_idx ON stock_levels (business_id, product_id, variation_id, warehouse_id)');
        }

        if ($supportsNullsNotDistinct) {
            DB::statement('CREATE UNIQUE INDEX warehouse_product_settings_active_unique_idx ON warehouse_product_settings (business_id, warehouse_id, product_id, variation_id) NULLS NOT DISTINCT WHERE deleted_at IS NULL');
        } else {
            // Without NULLS NOT DISTINCT, the unique index treats NULL as a distinct value,
            // so multiple deleted rows with NULL varied columns won't violate uniqueness.
            DB::statement('CREATE UNIQUE INDEX warehouse_product_settings_active_unique_idx ON warehouse_product_settings (business_id, warehouse_id, product_id, variation_id) WHERE deleted_at IS NULL');
        }

        foreach ($this->partialUniqueIndexes() as $name => $definition) {
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS {$name} ON {$definition}");
        }

        foreach ($this->caseInsensitiveUniqueIndexes() as $name => $definition) {
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS {$name} ON {$definition}");
        }

        foreach ($this->trigramIndexes() as $name => $definition) {
            DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$definition}");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (array_keys($this->trigramIndexes()) as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name}");
        }

        foreach (array_keys($this->caseInsensitiveUniqueIndexes()) as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name}");
        }

        foreach (array_keys($this->partialUniqueIndexes()) as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name}");
        }

        DB::statement('DROP INDEX IF EXISTS warehouse_product_settings_active_unique_idx');
        DB::statement('DROP INDEX IF EXISTS stock_levels_unique_idx');
        DB::statement('ALTER TABLE stock_levels ADD CONSTRAINT stock_levels_unique_idx UNIQUE (business_id, product_id, variation_id, warehouse_id)');
    }

    /** @return array<string, string> */
    protected function partialUniqueIndexes(): array
    {
        return [
            'branches_one_default_per_business_idx' => 'branches (business_id) WHERE is_default IS TRUE AND deleted_at IS NULL',
            'warehouses_one_default_per_business_idx' => 'warehouses (business_id) WHERE is_default IS TRUE AND deleted_at IS NULL',
            'tax_rates_one_default_per_business_idx' => 'tax_rates (business_id) WHERE is_default IS TRUE AND deleted_at IS NULL',
            'price_groups_one_default_per_business_idx' => 'price_groups (business_id) WHERE is_default IS TRUE AND deleted_at IS NULL',
            'exchange_rates_one_default_pair_idx' => 'exchange_rates (business_id, from_currency, to_currency) WHERE is_default IS TRUE AND deleted_at IS NULL',
        ];
    }

    /** @return array<string, string> */
    protected function caseInsensitiveUniqueIndexes(): array
    {
        return [
            'businesses_email_ci_unique' => 'businesses (lower(email))',
            'users_email_ci_unique' => 'users (lower(email))',
            'branches_business_code_ci_unique' => 'branches (business_id, lower(code))',
            'warehouses_business_code_ci_unique' => 'warehouses (business_id, lower(code))',
            'tax_rates_business_name_ci_unique' => 'tax_rates (business_id, lower(name))',
            'tax_groups_business_name_ci_unique' => 'tax_groups (business_id, lower(name))',
            'customers_business_code_ci_unique' => 'customers (business_id, lower(code))',
            'suppliers_business_code_ci_unique' => 'suppliers (business_id, lower(code))',
            'customer_groups_business_name_ci_unique' => 'customer_groups (business_id, lower(name))',
            'product_categories_business_name_ci_unique' => 'product_categories (business_id, lower(name))',
            'brands_business_name_ci_unique' => 'brands (business_id, lower(name))',
            'price_groups_business_name_ci_unique' => 'price_groups (business_id, lower(name))',
            'units_business_name_ci_unique' => 'units (business_id, lower(name))',
            'sub_units_parent_name_ci_unique' => 'sub_units (parent_unit_id, lower(name))',
            'rack_locations_warehouse_code_ci_unique' => 'rack_locations (warehouse_id, lower(code))',
            'variation_templates_business_name_ci_unique' => 'variation_templates (business_id, lower(name))',
            'variation_values_template_name_ci_unique' => 'variation_values (variation_template_id, lower(name))',
            'products_business_sku_ci_unique' => 'products (business_id, lower(sku))',
            'product_variations_business_sku_ci_unique' => 'product_variations (business_id, lower(sku))',
            'stock_lots_business_number_ci_unique' => 'stock_lots (business_id, lower(lot_number))',
            'stock_serials_business_number_ci_unique' => 'stock_serials (business_id, lower(serial_number))',
            'chart_accounts_business_code_ci_unique' => 'chart_of_accounts (business_id, lower(code))',
        ];
    }

    /** @return array<string, string> */
    protected function trigramIndexes(): array
    {
        return [
            'businesses_search_trgm_idx' => 'businesses USING gin (name gin_trgm_ops, legal_name gin_trgm_ops, email gin_trgm_ops)',
            'branches_search_trgm_idx' => 'branches USING gin (name gin_trgm_ops, code gin_trgm_ops, email gin_trgm_ops, phone gin_trgm_ops)',
            'warehouses_search_trgm_idx' => 'warehouses USING gin (name gin_trgm_ops, code gin_trgm_ops)',
            'users_search_trgm_idx' => 'users USING gin (first_name gin_trgm_ops, last_name gin_trgm_ops, email gin_trgm_ops, phone gin_trgm_ops)',
            'customers_search_trgm_idx' => 'customers USING gin (name gin_trgm_ops, email gin_trgm_ops, phone gin_trgm_ops, mobile gin_trgm_ops)',
            'suppliers_search_trgm_idx' => 'suppliers USING gin (name gin_trgm_ops, company gin_trgm_ops, email gin_trgm_ops, phone gin_trgm_ops, mobile gin_trgm_ops, code gin_trgm_ops)',
            'products_search_trgm_idx' => 'products USING gin (name gin_trgm_ops, sku gin_trgm_ops)',
            'product_variations_search_trgm_idx' => 'product_variations USING gin (name gin_trgm_ops, sku gin_trgm_ops)',
            'sales_search_trgm_idx' => 'sales USING gin (sale_number gin_trgm_ops, notes gin_trgm_ops)',
            'purchases_search_trgm_idx' => 'purchases USING gin (purchase_number gin_trgm_ops, supplier_invoice_no gin_trgm_ops, notes gin_trgm_ops)',
        ];
    }
};
