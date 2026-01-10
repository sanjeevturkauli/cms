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
        Schema::create('team_info', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            
            // Plan & Duration
            $table->string('plan')->nullable(); // basic, premium, enterprise
            $table->integer('duration_months')->nullable(); // plan duration in months
            $table->date('plan_start_date')->nullable();
            $table->date('plan_end_date')->nullable();
            
            // Member Limits
            $table->integer('total_member_limit')->default(2);
            $table->integer('current_members')->default(0);
            
            // Financial Information
            $table->decimal('monthly_amount', 10, 2)->nullable();
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->integer('paid_members')->default(0);
            
            // Location Information
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('location')->nullable();
            $table->text('address')->nullable();
            $table->string('country')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();
            $table->string('area')->nullable();
            $table->string('pincode', 10)->nullable();
            
            // Additional Information
            $table->text('description')->nullable();
            $table->string('category')->nullable(); // committee, group, organization
            $table->json('settings')->nullable(); // JSON for additional settings
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_activity')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['team_id']);
            $table->index(['plan', 'is_active']);
            $table->index(['country', 'state', 'city']);
            $table->index(['plan_start_date', 'plan_end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_info');
    }
};