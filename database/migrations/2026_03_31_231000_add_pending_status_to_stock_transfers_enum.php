<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->setTransferStatusEnum(['completed', 'pending', 'in_transit', 'received'], 'pending');
    }

    public function down(): void
    {
        DB::table('stock_transfers')
            ->where('status', 'pending')
            ->update([
                'status' => 'completed',
            ]);

        $this->setTransferStatusEnum(['completed', 'in_transit', 'received'], 'completed');
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
