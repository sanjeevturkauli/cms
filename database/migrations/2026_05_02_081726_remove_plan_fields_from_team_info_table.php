<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('team_info', function (Blueprint $table) {
            // Remove plan related fields
            $table->dropColumn([
                'plan',
                'duration_months', 
                'plan_start_date',
                'plan_end_date',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_info', function (Blueprint $table) {
            // Add back plan related fields
            $table->string('plan')->nullable();
            $table->integer('duration_months')->nullable();
            $table->date('plan_start_date')->nullable();
            $table->date('plan_end_date')->nullable();
            $table->decimal('monthly_amount', 10, 2)->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->integer('paid_members')->default(0);
        });
    }
};
