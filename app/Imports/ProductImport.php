<?php

namespace App\Imports;

use App\Models\Brand;
use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Services\Catalog\ProductService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class ProductImport implements ToCollection, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    private int $imported = 0;
    private int $skipped = 0;
    private Business $business;
    private ProductService $productService;

    public function __construct(Business $business, ProductService $productService)
    {
        $this->business = $business;
        $this->productService = $productService;
    }

    public function collection(Collection $rows): void
    {
        $businessId = $this->business->id;
        $units = Unit::where('business_id', $businessId)->pluck('id', 'name');
        $categories = Category::where('business_id', $businessId)->pluck('id', 'name');
        $brands = Brand::where('business_id', $businessId)->pluck('id', 'name');

        foreach ($rows as $row) {
            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                $this->skipped++;
                continue;
            }

            $type = strtolower(trim((string) ($row['type'] ?? 'single')));
            if (! in_array($type, ['single', 'service'], true)) {
                $type = 'single';
            }

            $sku = trim((string) ($row['sku'] ?? ''));
            if ($sku !== '') {
                $exists = Product::where('business_id', $businessId)
                    ->where('sku', $sku)
                    ->exists();
                if ($exists) {
                    $this->skipped++;
                    continue;
                }
            }

            $unitName = trim((string) ($row['unit'] ?? ''));
            $unitId = $unitName !== '' ? ($units[$unitName] ?? null) : null;

            $categoryName = trim((string) ($row['category'] ?? ''));
            $categoryId = $categoryName !== '' ? ($categories[$categoryName] ?? null) : null;

            $brandName = trim((string) ($row['brand'] ?? ''));
            $brandId = $brandName !== '' ? ($brands[$brandName] ?? null) : null;

            $barcodeType = strtoupper(trim((string) ($row['barcode_type'] ?? 'C128')));
            if (! in_array($barcodeType, ['C128', 'EAN13', 'QR'], true)) {
                $barcodeType = 'C128';
            }

            $stockTracking = strtolower(trim((string) ($row['stock_tracking'] ?? 'none')));
            if (! in_array($stockTracking, ['none', 'lot', 'serial'], true)) {
                $stockTracking = 'none';
            }

            $taxType = strtolower(trim((string) ($row['tax_type'] ?? 'exclusive')));
            if (! in_array($taxType, ['inclusive', 'exclusive'], true)) {
                $taxType = 'exclusive';
            }

            $data = [
                'name' => $name,
                'type' => $type,
                'sku' => $sku ?: null,
                'barcode_type' => $barcodeType,
                'selling_price' => (float) ($row['selling_price'] ?? 0),
                'purchase_price' => (float) ($row['purchase_price'] ?? 0),
                'unit_id' => $unitId,
                'category_id' => $categoryId,
                'brand_id' => $brandId,
                'description' => trim((string) ($row['description'] ?? '')),
                'stock_tracking' => $stockTracking,
                'tax_type' => $taxType,
                'track_inventory' => strtolower(trim((string) ($row['track_inventory'] ?? 'no'))) === 'yes',
                'is_active' => strtolower(trim((string) ($row['is_active'] ?? 'yes'))) !== 'no',
                'alert_quantity' => (float) ($row['alert_quantity'] ?? 0),
                'minimum_selling_price' => $row['minimum_selling_price'] !== null && $row['minimum_selling_price'] !== '' ? (float) $row['minimum_selling_price'] : null,
                'profit_margin' => $row['profit_margin'] !== null && $row['profit_margin'] !== '' ? (float) $row['profit_margin'] : null,
            ];

            try {
                $this->productService->create($businessId, $data);
                $this->imported++;
            } catch (\Throwable) {
                $this->skipped++;
            }
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'type' => ['nullable', 'string', 'in:single,service'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    public function getSkippedCount(): int
    {
        return $this->skipped;
    }
}
