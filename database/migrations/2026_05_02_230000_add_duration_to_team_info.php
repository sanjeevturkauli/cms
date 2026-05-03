<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_info', function (Blueprint $table) {
            $table->integer('duration')->nullable()->after('monthly_amount')->comment('Duration in months');
        });
    }

    public function down(): void
    {
        Schema::table('team_info', function (Blueprint $table) {
            $table->dropColumn('duration');
        });
    }
};
