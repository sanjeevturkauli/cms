<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Rename columns
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('person_limit', 'member_limit');
            $table->renameColumn('duration_years', 'duration');
        });

        // Step 2: Add new columns
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->integer('team_limit')->default(1)->after('member_limit');
            $table->enum('type', ['day', 'month', 'year'])->default('month')->after('duration');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('member_limit', 'person_limit');
            $table->renameColumn('duration', 'duration_years');
            $table->dropColumn(['team_limit', 'type']);
        });
    }
};