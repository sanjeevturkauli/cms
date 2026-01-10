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
        Schema::create('kyc', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Identity Information
            $table->enum('identity_type', ['aadhar', 'voter_id', 'passport', 'driving_license', 'other'])
                  ->comment('Type of identity document');
            $table->string('identity_number', 50)->comment('Identity document number');
            $table->string('identity_image')->nullable()->comment('Path to identity document image');
            
            // PAN Card Information
            $table->string('pan_card_image')->nullable()->comment('Path to PAN card image');
            $table->string('pan_number', 10)->nullable()->comment('PAN card number');
            
            // KYC Status
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('reason')->nullable()->comment('Reason for rejection or additional notes');
            $table->timestamp('approved_date')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->comment('Admin who approved/rejected');
            
            // Address Information
            $table->string('country', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('area', 100)->nullable();
            $table->text('full_address')->nullable();
            $table->string('pincode', 10)->nullable();
            
            // Additional Information
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('father_name')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('occupation')->nullable();
            $table->decimal('annual_income', 12, 2)->nullable();
            
            // Verification Flags
            $table->boolean('identity_verified')->default(false);
            $table->boolean('pan_verified')->default(false);
            $table->boolean('address_verified')->default(false);
            $table->boolean('is_complete')->default(false);
            
            // Timestamps
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index(['user_id']);
            $table->index(['status']);
            $table->index(['identity_type', 'identity_number']);
            $table->index(['pan_number']);
            $table->index(['country', 'state', 'city']);
            $table->index(['approved_date']);
            
            // Unique constraints
            $table->unique(['user_id']); // One KYC per user
            $table->unique(['identity_type', 'identity_number']); // Unique identity documents
            $table->unique(['pan_number']); // Unique PAN numbers
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kyc');
    }
};