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
        Schema::create('subscription_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->string('action'); // new, upgrade, downgrade, cancel
            $table->string('from_package')->nullable(); // Previous package name
            $table->string('to_package'); // New package name
            $table->decimal('from_price', 10, 2)->nullable(); // Previous package price
            $table->decimal('to_price', 10, 2); // New package price
            $table->decimal('amount_charged', 10, 2)->default(0); // Amount charged/refunded
            $table->decimal('wallet_balance_before', 10, 2)->default(0);
            $table->decimal('wallet_balance_after', 10, 2)->default(0);
            $table->integer('days_used')->nullable(); // Days used from previous package
            $table->integer('days_remaining')->nullable(); // Days remaining in previous package
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_logs');
    }
};