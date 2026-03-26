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
        Schema::create('file_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('business_id')->index();
            $table->uuidMorphs('attachable');
            $table->string('collection', 50)->default('primary_image')->index();
            $table->string('disk', 50)->default('public');
            $table->string('path', 500);
            $table->string('original_name', 255)->nullable();
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->uuid('uploaded_by')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
        });

        if (Schema::hasTable('products') && Schema::hasColumn('products', 'image_url')) {
            $products = DB::table('products')
                ->select(['id', 'business_id', 'image_url', 'created_at', 'updated_at'])
                ->whereNotNull('image_url')
                ->get();

            foreach ($products as $product) {
                DB::table('file_assets')->insert([
                    'id' => (string) Str::uuid(),
                    'business_id' => $product->business_id,
                    'attachable_type' => \App\Models\Product::class,
                    'attachable_id' => $product->id,
                    'collection' => 'primary_image',
                    'disk' => 'public',
                    'path' => $product->image_url,
                    'original_name' => null,
                    'mime_type' => null,
                    'file_size' => null,
                    'sort_order' => 0,
                    'uploaded_by' => null,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at,
                    'deleted_at' => null,
                ]);
            }
        }

        if (Schema::hasTable('product_variations') && Schema::hasColumn('product_variations', 'image_url')) {
            $variations = DB::table('product_variations')
                ->select(['id', 'business_id', 'image_url', 'created_at', 'updated_at'])
                ->whereNotNull('image_url')
                ->get();

            foreach ($variations as $variation) {
                DB::table('file_assets')->insert([
                    'id' => (string) Str::uuid(),
                    'business_id' => $variation->business_id,
                    'attachable_type' => \App\Models\ProductVariation::class,
                    'attachable_id' => $variation->id,
                    'collection' => 'primary_image',
                    'disk' => 'public',
                    'path' => $variation->image_url,
                    'original_name' => null,
                    'mime_type' => null,
                    'file_size' => null,
                    'sort_order' => 0,
                    'uploaded_by' => null,
                    'created_at' => $variation->created_at,
                    'updated_at' => $variation->updated_at,
                    'deleted_at' => null,
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('file_assets');
    }
};
