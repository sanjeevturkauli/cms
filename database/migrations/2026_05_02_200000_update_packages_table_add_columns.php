<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            // Rename person to member_limit
            $table->renameColumn('person', 'member_limit');
        });

        Schema::table('packages', function (Blueprint $table) {
            // Add new columns
            $table->integer('team_limit')->default(1)->after('member_limit')->comment('Number of teams allowed');
            $table->enum('type', ['day', 'month', 'year'])->default('month')->after('duration')->comment('Duration type');
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->renameColumn('member_limit', 'person');
            $table->dropColumn(['team_limit', 'type']);
        });
    }
};