<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('package_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
            
            // Transaction Details
            $table->string('transaction_id')->unique(); // Our internal transaction ID
            $table->string('payment_gateway'); // stripe, paypal, razorpay
            $table->string('gateway_transaction_id')->nullable(); // Gateway's transaction ID
            $table->string('gateway_payment_id')->nullable(); // Gateway's payment ID
            
            // Amount Details
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('INR');
            $table->decimal('gateway_fee', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2); // Amount after gateway fee
            
            // Status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['card', 'upi', 'netbanking', 'wallet', 'other'])->nullable();
            
            // Refund Details
            $table->decimal('refund_amount', 10, 2)->default(0);
            $table->string('refund_transaction_id')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->text('refund_reason')->nullable();
            
            // Additional Info
            $table->text('description')->nullable();
            $table->json('gateway_response')->nullable(); // Store full gateway response
            $table->json('metadata')->nullable(); // Any additional data
            $table->text('failure_reason')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['team_id', 'status']);
            $table->index('payment_gateway');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};