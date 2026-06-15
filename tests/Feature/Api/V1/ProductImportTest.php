<?php

namespace Tests\Feature\Api\V1;

use App\Exports\ProductTemplateExport;
use App\Exports\VariableProductTemplateExport;
use App\Imports\ProductImport;
use App\Models\Brand;
use App\Models\Business;
use App\Models\Category;
use App\Models\CustomFieldDefinition;
use App\Models\Product;
use App\Models\SubUnit;
use App\Models\TaxRate;
use App\Models\Unit;
use App\Models\VariationTemplate;
use App\Models\VariationValue;
use App\Services\Catalog\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Tests\TestCase;

class ProductImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_standard_template_excludes_variable_columns_and_includes_supported_product_types(): void
    {
        $export = new ProductTemplateExport;
        $headings = $export->headings();
        $rows = $export->array();
        $typeIndex = array_search('type', $headings, true);

        $this->assertNotContains('parent_sku', $headings);
        $this->assertNotContains('variation_templates', $headings);
        $this->assertNotContains('variation_values', $headings);
        $this->assertContains('combo_items', $headings);
        $this->assertSame(['single', 'service', 'combo'], array_column($rows, $typeIndex));
    }

    public function test_variable_template_contains_parent_and_variation_rows(): void
    {
        $export = new VariableProductTemplateExport;
        $headings = $export->headings();
        $rows = $export->array();
        $typeIndex = array_search('type', $headings, true);
        $skuIndex = array_search('sku', $headings, true);
        $parentSkuIndex = array_search('parent_sku', $headings, true);
        $variationValuesIndex = array_search('variation_values', $headings, true);

        $this->assertContains('variation_templates', $headings);
        $this->assertNotContains('combo_items', $headings);
        $this->assertSame('variable', $rows[0][$typeIndex]);
        $this->assertSame('VAR-001', $rows[0][$skuIndex]);
        $this->assertSame('VAR-001', $rows[1][$parentSkuIndex]);
        $this->assertSame('Small,Red', $rows[1][$variationValuesIndex]);
    }

    public function test_import_creates_single_product_with_create_form_fields(): void
    {
        $business = Business::factory()->create();
        $unit = Unit::factory()->for($business)->create(['name' => 'Piece', 'short_name' => 'pcs']);
        $subUnit = SubUnit::factory()->create([
            'business_id' => $business->id,
            'parent_unit_id' => $unit->id,
            'name' => 'Box',
            'short_name' => 'box',
        ]);
        $category = Category::factory()->for($business)->create(['name' => 'Drinks']);
        $brand = Brand::factory()->for($business)->create(['name' => 'Acme']);
        $taxRate = TaxRate::factory()->for($business)->create(['name' => 'VAT 10%']);
        CustomFieldDefinition::query()->create([
            'business_id' => $business->id,
            'module' => 'product',
            'field_name' => 'color',
            'field_label' => 'Color',
            'field_type' => 'text',
            'options' => null,
            'is_required' => false,
            'sort_order' => 0,
        ]);

        $import = new ProductImport($business, app(ProductService::class));
        $import->collection(new Collection([
            new Collection([
                'name' => 'Imported Cola',
                'type' => 'single',
                'sku' => 'IMP-COLA',
                'barcode_type' => 'c128',
                'unit' => 'pcs',
                'sub_unit' => 'box',
                'category' => 'Drinks',
                'brand' => 'Acme',
                'tax_rate' => 'VAT 10%',
                'description' => 'Imported from sheet',
                'stock_tracking' => 'lot',
                'has_expiry' => 'yes',
                'tax_type' => 'exclusive',
                'track_inventory' => 'yes',
                'is_for_selling' => 'yes',
                'is_active' => 'yes',
                'selling_price' => '12.50',
                'purchase_price' => '7.25',
                'sub_unit_selling_price' => '120',
                'sub_unit_purchase_price' => '70',
                'alert_quantity' => '5',
                'max_stock_level' => '100',
                'minimum_selling_price' => '10',
                'profit_margin' => '20',
                'weight' => '0.250',
                'custom_fields' => '{"color":"Blue"}',
            ]),
        ]));

        $this->assertSame(1, $import->getImportedCount());
        $this->assertSame(0, $import->getSkippedCount());

        $product = Product::query()->where('sku', 'IMP-COLA')->firstOrFail();

        $this->assertSame($unit->id, $product->unit_id);
        $this->assertSame($subUnit->id, $product->sub_unit_id);
        $this->assertSame($category->id, $product->category_id);
        $this->assertSame($brand->id, $product->brand_id);
        $this->assertSame($taxRate->id, $product->tax_rate_id);
        $this->assertSame('C128', $product->barcode_type);
        $this->assertSame('lot', $product->stock_tracking);
        $this->assertTrue($product->has_expiry);
        $this->assertTrue($product->track_inventory);
        $this->assertSame('12.50', (string) $product->selling_price);
        $this->assertSame('120.00', (string) $product->sub_unit_selling_price);
        $this->assertSame('100.000', (string) $product->max_stock_level);
        $this->assertSame(['color' => 'Blue'], $product->custom_fields);
    }

    public function test_import_creates_variable_product_with_templates_and_variations(): void
    {
        $business = Business::factory()->create();
        Unit::factory()->for($business)->create(['name' => 'Piece', 'short_name' => 'pcs']);
        $size = VariationTemplate::factory()->for($business)->create(['name' => 'Size']);
        $color = VariationTemplate::factory()->for($business)->create(['name' => 'Color']);
        $small = VariationValue::factory()->for($size, 'template')->create([
            'business_id' => $business->id,
            'name' => 'Small',
        ]);
        VariationValue::factory()->for($color, 'template')->create([
            'business_id' => $business->id,
            'name' => 'Red',
        ]);

        $import = new ProductImport($business, app(ProductService::class));
        $import->collection(new Collection([
            new Collection([
                'name' => 'Imported Shirt',
                'type' => 'variable',
                'sku' => 'IMP-SHIRT',
                'parent_sku' => null,
                'barcode_type' => 'C128',
                'unit' => 'pcs',
                'stock_tracking' => 'none',
                'tax_type' => 'exclusive',
                'track_inventory' => 'yes',
                'is_for_selling' => 'yes',
                'is_active' => 'yes',
                'variation_templates' => 'Size,Color',
                'variation_name' => null,
                'variation_sku' => null,
                'variation_selling_price' => null,
                'variation_purchase_price' => null,
                'variation_values' => null,
                'variation_sub_unit_selling_price' => null,
                'variation_sub_unit_purchase_price' => null,
                'variation_minimum_selling_price' => null,
                'variation_profit_margin' => null,
                'variation_is_active' => null,
                'combo_items' => null,
                'custom_fields' => '{}',
            ]),
            new Collection([
                'name' => null,
                'type' => null,
                'sku' => null,
                'parent_sku' => 'IMP-SHIRT',
                'barcode_type' => null,
                'unit' => null,
                'sub_unit' => null,
                'category' => null,
                'brand' => null,
                'tax_rate' => null,
                'price_group' => null,
                'rack_location' => null,
                'description' => null,
                'stock_tracking' => null,
                'has_expiry' => null,
                'tax_type' => null,
                'track_inventory' => null,
                'is_for_selling' => null,
                'is_active' => null,
                'selling_price' => null,
                'purchase_price' => null,
                'sub_unit_selling_price' => null,
                'sub_unit_purchase_price' => null,
                'alert_quantity' => null,
                'max_stock_level' => null,
                'minimum_selling_price' => null,
                'profit_margin' => null,
                'weight' => null,
                'variation_templates' => null,
                'variation_name' => 'Small-Red',
                'variation_sku' => 'IMP-SHIRT-SR',
                'variation_selling_price' => '15.00',
                'variation_purchase_price' => '8.00',
                'variation_values' => 'Small,Red',
                'variation_sub_unit_selling_price' => null,
                'variation_sub_unit_purchase_price' => null,
                'variation_minimum_selling_price' => '12.00',
                'variation_profit_margin' => null,
                'variation_is_active' => 'yes',
                'combo_items' => null,
                'custom_fields' => null,
            ]),
        ]));

        $this->assertSame(1, $import->getImportedCount());
        $this->assertSame(0, $import->getSkippedCount());

        $product = Product::query()->with('variations')->where('sku', 'IMP-SHIRT')->firstOrFail();

        $this->assertSame('variable', $product->type);
        $this->assertEqualsCanonicalizing([$size->id, $color->id], $product->variation_template_ids);
        $this->assertCount(1, $product->variations);
        $this->assertSame('Small-Red', $product->variations[0]->name);
        $this->assertSame('IMP-SHIRT-SR', $product->variations[0]->sku);
        $this->assertSame('15.00', (string) $product->variations[0]->selling_price);
    }

    public function test_import_creates_combo_product_with_components(): void
    {
        $business = Business::factory()->create();
        Unit::factory()->for($business)->create(['name' => 'Piece', 'short_name' => 'pcs']);

        $import = new ProductImport($business, app(ProductService::class));
        $import->collection(new Collection([
            new Collection([
                'name' => 'Child Product',
                'type' => 'single',
                'sku' => 'CHILD-001',
                'barcode_type' => 'C128',
                'unit' => 'pcs',
                'stock_tracking' => 'none',
                'tax_type' => 'exclusive',
                'track_inventory' => 'yes',
                'is_for_selling' => 'yes',
                'is_active' => 'yes',
                'selling_price' => '10',
                'purchase_price' => '5',
            ]),
            new Collection([
                'name' => 'Imported Combo',
                'type' => 'combo',
                'sku' => 'IMP-COMBO',
                'barcode_type' => 'C128',
                'unit' => 'pcs',
                'stock_tracking' => 'none',
                'tax_type' => 'exclusive',
                'track_inventory' => 'no',
                'is_for_selling' => 'yes',
                'is_active' => 'yes',
                'selling_price' => '25',
                'purchase_price' => '12',
                'combo_items' => '[{"child_product":"CHILD-001","quantity":2}]',
                'custom_fields' => '{}',
            ]),
        ]));

        $this->assertSame(2, $import->getImportedCount());
        $this->assertSame(0, $import->getSkippedCount());

        $child = Product::query()->where('sku', 'CHILD-001')->firstOrFail();
        $product = Product::query()->with('comboItems')->where('sku', 'IMP-COMBO')->firstOrFail();

        $this->assertSame('combo', $product->type);
        $this->assertFalse($product->track_inventory);
        $this->assertCount(1, $product->comboItems);
        $this->assertSame($child->id, $product->comboItems[0]->child_product_id);
        $this->assertSame('2.0000', (string) $product->comboItems[0]->quantity);
    }
}
