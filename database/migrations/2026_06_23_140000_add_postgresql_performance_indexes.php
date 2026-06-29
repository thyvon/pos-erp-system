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

        foreach ($this->indexes() as $name => $definition) {
            DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$definition}");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        foreach (array_keys($this->indexes()) as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name}");
        }
    }

    /** @return array<string, string> */
    protected function indexes(): array
    {
        return [
            // Foundation tenant lists and access checks.
            'businesses_status_created_perf_idx' => 'businesses (status, created_at)',
            'branches_business_name_perf_idx' => 'branches (business_id, name) WHERE deleted_at IS NULL',
            'warehouses_business_branch_name_perf_idx' => 'warehouses (business_id, branch_id, name) WHERE deleted_at IS NULL',
            'users_business_status_name_perf_idx' => 'users (business_id, status, first_name, last_name) WHERE deleted_at IS NULL',
            'customers_business_group_name_perf_idx' => 'customers (business_id, customer_group_id, name) WHERE deleted_at IS NULL',
            'suppliers_business_name_perf_idx' => 'suppliers (business_id, name) WHERE deleted_at IS NULL',

            // Catalog list filters and product lookup paths.
            'categories_business_parent_name_perf_idx' => 'product_categories (business_id, parent_id, name) WHERE deleted_at IS NULL',
            'brands_business_name_perf_idx' => 'brands (business_id, name)',
            'products_business_active_name_perf_idx' => 'products (business_id, is_active, name) WHERE deleted_at IS NULL',
            'products_business_category_active_perf_idx' => 'products (business_id, category_id, is_active) WHERE deleted_at IS NULL',
            'products_business_brand_active_perf_idx' => 'products (business_id, brand_id, is_active) WHERE deleted_at IS NULL',
            'product_variations_product_active_perf_idx' => 'product_variations (product_id, is_active) WHERE deleted_at IS NULL',
            'warehouse_product_settings_lookup_active_perf_idx' => 'warehouse_product_settings (business_id, warehouse_id, product_id, variation_id) WHERE deleted_at IS NULL',

            // Sales list, report, payment, and POS paths.
            'sales_business_sale_date_perf_idx' => 'sales (business_id, sale_date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'sales_business_branch_date_perf_idx' => 'sales (business_id, branch_id, sale_date DESC) WHERE deleted_at IS NULL',
            'sales_business_warehouse_date_perf_idx' => 'sales (business_id, warehouse_id, sale_date DESC) WHERE deleted_at IS NULL',
            'sales_business_type_status_date_perf_idx' => 'sales (business_id, type, status, sale_date DESC) WHERE deleted_at IS NULL',
            'sales_cash_register_session_perf_idx' => 'sales (cash_register_session_id) WHERE cash_register_session_id IS NOT NULL AND deleted_at IS NULL',
            'sales_parent_sale_perf_idx' => 'sales (parent_sale_id) WHERE parent_sale_id IS NOT NULL AND deleted_at IS NULL',
            'sale_payments_business_date_perf_idx' => 'sale_payments (business_id, payment_date DESC, created_at DESC)',
            'sale_payments_account_date_perf_idx' => 'sale_payments (payment_account_id, payment_date DESC)',
            'sale_returns_business_date_perf_idx' => 'sale_returns (business_id, return_date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'sale_returns_business_branch_date_perf_idx' => 'sale_returns (business_id, branch_id, return_date DESC) WHERE deleted_at IS NULL',
            'sale_returns_business_warehouse_date_perf_idx' => 'sale_returns (business_id, warehouse_id, return_date DESC) WHERE deleted_at IS NULL',

            // Purchasing list, report, receive, and payment paths.
            'purchases_business_purchase_date_perf_idx' => 'purchases (business_id, purchase_date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'purchases_business_branch_date_perf_idx' => 'purchases (business_id, branch_id, purchase_date DESC) WHERE deleted_at IS NULL',
            'purchases_business_warehouse_date_perf_idx' => 'purchases (business_id, warehouse_id, purchase_date DESC) WHERE deleted_at IS NULL',
            'purchases_business_supplier_date_perf_idx' => 'purchases (business_id, supplier_id, purchase_date DESC) WHERE deleted_at IS NULL',
            'purchase_payments_business_date_perf_idx' => 'purchase_payments (business_id, payment_date DESC, created_at DESC)',
            'purchase_payments_account_date_perf_idx' => 'purchase_payments (payment_account_id, payment_date DESC)',
            'purchase_returns_business_date_perf_idx' => 'purchase_returns (business_id, return_date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'purchase_returns_business_branch_date_perf_idx' => 'purchase_returns (business_id, branch_id, return_date DESC) WHERE deleted_at IS NULL',
            'purchase_returns_business_warehouse_date_perf_idx' => 'purchase_returns (business_id, warehouse_id, return_date DESC) WHERE deleted_at IS NULL',
            'purchase_receives_business_date_perf_idx' => 'purchase_receives (business_id, receive_date DESC, created_at DESC) WHERE deleted_at IS NULL',

            // Inventory reports and stock lookup paths.
            'stock_levels_business_updated_perf_idx' => 'stock_levels (business_id, updated_at DESC)',
            'stock_levels_business_wh_updated_perf_idx' => 'stock_levels (business_id, warehouse_id, updated_at DESC)',
            'stock_lots_product_wh_status_expiry_perf_idx' => 'stock_lots (business_id, product_id, warehouse_id, status, expiry_date)',
            'stock_serials_product_wh_status_perf_idx' => 'stock_serials (business_id, product_id, warehouse_id, status)',
            'stock_movements_business_wh_created_perf_idx' => 'stock_movements (business_id, warehouse_id, created_at DESC)',
            'stock_movements_reference_perf_idx' => 'stock_movements (reference_type, reference_id)',
            'stock_counts_business_date_perf_idx' => 'stock_counts (business_id, date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'stock_adjustments_business_date_perf_idx' => 'stock_adjustments (business_id, date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'stock_transfers_business_status_date_perf_idx' => 'stock_transfers (business_id, status, date DESC) WHERE deleted_at IS NULL',

            // Accounting and expenses.
            'journals_business_posted_perf_idx' => 'journals (business_id, posted_at DESC)',
            'journals_business_fiscal_posted_perf_idx' => 'journals (business_id, fiscal_year_id, posted_at DESC)',
            'journal_entries_journal_account_perf_idx' => 'journal_entries (journal_id, account_id)',
            'payment_accounts_business_active_name_perf_idx' => 'payment_accounts (business_id, is_active, name) WHERE deleted_at IS NULL',
            'account_transactions_business_date_perf_idx' => 'account_transactions (business_id, transaction_date DESC)',
            'expenses_business_date_perf_idx' => 'expenses (business_id, expense_date DESC, created_at DESC) WHERE deleted_at IS NULL',
            'expenses_business_branch_date_perf_idx' => 'expenses (business_id, branch_id, expense_date DESC) WHERE deleted_at IS NULL',

            // Module and audit administration.
            'audit_logs_business_created_perf_idx' => 'audit_logs (business_id, created_at DESC)',
            'audit_logs_auditable_perf_idx' => 'audit_logs (auditable_type, auditable_id, created_at DESC)',
            'business_modules_business_status_perf_idx' => 'business_modules (business_id, status)',
        ];
    }
};
