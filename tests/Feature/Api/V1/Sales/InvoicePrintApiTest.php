<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoicePrintApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_invoice_templates_use_standard_api_response_shape(): void
    {
        [$user] = $this->invoiceFixtures();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/invoice-templates')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Invoice templates loaded.')
            ->assertJsonPath('data.0.id', 'classic');
    }

    public function test_allowed_user_can_preview_invoice_html(): void
    {
        [$user, $sale] = $this->invoiceFixtures();

        Sanctum::actingAs($user);

        $this->get("/api/v1/sales/{$sale->id}/invoice-preview?template=classic")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=utf-8')
            ->assertSee($sale->sale_number, false);
    }

    public function test_user_without_sale_branch_access_cannot_preview_invoice(): void
    {
        [, $sale, $business] = $this->invoiceFixtures();
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');

        Sanctum::actingAs($user);

        $this->getJson("/api/v1/sales/{$sale->id}/invoice-preview?template=classic")
            ->assertForbidden();
    }

    private function invoiceFixtures(): array
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'selling_price' => 20,
            'purchase_price' => 8,
        ]);
        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        $sale = Sale::create([
            'business_id' => $business->id,
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'created_by' => $user->id,
            'sale_number' => 'INV-TEST-001',
            'type' => 'invoice',
            'status' => 'completed',
            'payment_status' => 'paid',
            'sale_date' => now()->toDateString(),
            'subtotal' => 40,
            'discount_amount' => 0,
            'tax_amount' => 0,
            'shipping_charges' => 0,
            'total_amount' => 40,
            'paid_amount' => 40,
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 20,
            'discount_amount' => 0,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'unit_cost' => 8,
            'total_amount' => 40,
        ]);

        return [$user, $sale, $business, $branch, $warehouse, $product];
    }
}
