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
        Schema::create('otps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('code', 6); // 6-digit OTP code
            $table->timestamp('expires_at'); // When the OTP expires
            $table->boolean('used')->default(false); // Whether OTP has been used
            $table->timestamps();

            // Add indexes for better performance
            $table->index(['user_id', 'code']);
            $table->index(['expires_at']);
            $table->index(['used']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otps');
    }
};
