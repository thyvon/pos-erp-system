<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->setTransferStatusEnum(['completed', 'pending', 'in_transit', 'received'], 'completed');

        if (! Schema::hasColumn('stock_transfers', 'sent_by')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->foreignUuid('sent_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('stock_transfers', 'sent_at')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->timestamp('sent_at')->nullable()->after('sent_by');
            });
        }

        if (! Schema::hasColumn('stock_transfers', 'received_by')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->foreignUuid('received_by')->nullable()->after('sent_at')->constrained('users')->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('stock_transfers', 'received_at')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->timestamp('received_at')->nullable()->after('received_by');
            });
        }

        DB::table('stock_transfers')
            ->where('status', 'completed')
            ->update([
                'status' => 'received',
            ]);

        DB::table('stock_transfers')
            ->whereNull('sent_by')
            ->update([
                'sent_by' => DB::raw('created_by'),
            ]);

        DB::table('stock_transfers')
            ->whereNull('sent_at')
            ->update([
                'sent_at' => DB::raw('created_at'),
            ]);

        DB::table('stock_transfers')
            ->where('status', 'received')
            ->whereNull('received_by')
            ->update([
                'received_by' => DB::raw('created_by'),
            ]);

        DB::table('stock_transfers')
            ->where('status', 'received')
            ->whereNull('received_at')
            ->update([
                'received_at' => DB::raw('created_at'),
            ]);
    }

    public function down(): void
    {
        DB::table('stock_transfers')
            ->whereIn('status', ['pending', 'in_transit', 'received'])
            ->update([
                'status' => 'completed',
            ]);

        if (Schema::hasColumn('stock_transfers', 'received_by')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('received_by');
            });
        }

        if (Schema::hasColumn('stock_transfers', 'received_at')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->dropColumn('received_at');
            });
        }

        if (Schema::hasColumn('stock_transfers', 'sent_by')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('sent_by');
            });
        }

        if (Schema::hasColumn('stock_transfers', 'sent_at')) {
            Schema::table('stock_transfers', function (Blueprint $table): void {
                $table->dropColumn('sent_at');
            });
        }

        $this->setTransferStatusEnum(['completed'], 'completed');
    }

    protected function setTransferStatusEnum(array $values, string $default): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        $quotedValues = implode("', '", $values);

        DB::statement(
            "ALTER TABLE `stock_transfers` MODIFY `status` ENUM('{$quotedValues}') NOT NULL DEFAULT '{$default}'"
        );
    }
};
