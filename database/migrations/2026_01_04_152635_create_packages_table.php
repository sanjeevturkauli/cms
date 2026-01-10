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
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // Basic, Silver, Gold
            $table->decimal('price', 10, 2); // Yearly price
            $table->json('features')->nullable(); // Package features as JSON
            $table->integer('min_duration')->default(1); // Minimum years
            $table->integer('max_duration')->default(5); // Maximum years
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};
