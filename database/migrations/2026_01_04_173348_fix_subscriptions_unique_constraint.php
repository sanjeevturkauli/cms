<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Since MariaDB doesn't support partial indexes, we'll handle this in the application logic
        // Just remove the problematic constraint for now
        try {
            DB::statement('ALTER TABLE subscriptions DROP INDEX unique_active_subscription');
        } catch (Exception $e) {
            // Index might not exist or might be named differently
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We won't restore the constraint as it was causing issues
    }
};