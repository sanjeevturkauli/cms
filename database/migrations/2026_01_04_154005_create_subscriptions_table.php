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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('package_id')->constrained()->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->integer('duration_years'); // Duration in years
            $table->decimal('amount_paid', 10, 2);
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->json('package_features')->nullable(); // Store features at time of subscription
            $table->timestamps();

            // Ensure a team can only have one active subscription at a time
            // $table->unique(['team_id', 'status'], 'unique_active_subscription');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
