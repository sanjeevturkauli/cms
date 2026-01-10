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
        Schema::table('packages', function (Blueprint $table) {
            // Remove min_duration and max_duration columns
            $table->dropColumn(['min_duration', 'max_duration']);
            
            // Add single duration column
            $table->integer('duration')->after('person')->comment('Package duration in years');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            // Remove duration column
            $table->dropColumn('duration');
            
            // Add back min_duration and max_duration columns
            $table->integer('min_duration')->default(1);
            $table->integer('max_duration')->default(5);
        });
    }
};