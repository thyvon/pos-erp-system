<?php

namespace Tests\Feature\Api\V1\Sales;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockLevel;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuotationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_manager_can_create_and_convert_quotation_to_invoice(): void
    {
        [$business, $branch, $warehouse, $product] = $this->quotationFixtures();

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $quotationId = $this->postJson('/api/v1/quotations', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'unit_price' => 20,
                'unit_cost' => 7,
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.type', 'quotation')
            ->assertJsonPath('data.status', 'quotation')
            ->json('data.id');

        $response = $this->postJson("/api/v1/quotations/{$quotationId}/convert", [
            'type' => 'invoice',
            'sale_date' => now()->toDateString(),
        ])->assertOk();

        $saleId = $response->json('data.sale.id');

        $this->assertDatabaseHas('sales', [
            'id' => $quotationId,
            'type' => 'quotation',
            'status' => 'converted',
        ]);

        $this->assertDatabaseHas('sales', [
            'id' => $saleId,
            'type' => 'invoice',
            'status' => 'draft',
            'parent_sale_id' => $quotationId,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'business_id' => $business->id,
            'event' => 'state_change',
            'auditable_id' => $quotationId,
        ]);
    }

    public function test_manager_can_cancel_quotation(): void
    {
        [$business, $branch, $warehouse, $product] = $this->quotationFixtures();

        $user = User::factory()->for($business)->create();
        $user->assignRole('manager');
        $user->branches()->attach($branch->id);

        Sanctum::actingAs($user);

        $quotationId = $this->postJson('/api/v1/quotations', [
            'branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'sale_date' => now()->toDateString(),
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 20,
                'unit_cost' => 7,
            ]],
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/quotations/{$quotationId}/cancel", [
            'reason' => 'Customer did not approve the quote',
        ])->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('sales', [
            'id' => $quotationId,
            'status' => 'cancelled',
        ]);
    }

    protected function quotationFixtures(): array
    {
        $business = Business::factory()->create();
        $branch = Branch::factory()->create(['business_id' => $business->id]);
        $warehouse = Warehouse::factory()->forBranch($branch)->create();
        $unit = Unit::factory()->create(['business_id' => $business->id]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'unit_id' => $unit->id,
            'track_inventory' => true,
            'stock_tracking' => 'none',
            'selling_price' => 20,
            'minimum_selling_price' => 10,
            'purchase_price' => 7,
        ]);

        StockLevel::withoutGlobalScopes()->create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
        ]);

        return [$business, $branch, $warehouse, $product];
    }
}
