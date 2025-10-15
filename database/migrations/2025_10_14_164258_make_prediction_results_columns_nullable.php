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
        Schema::table('prediction_results', function (Blueprint $table) {
            // Make required columns nullable since they're populated later
            $table->decimal('predicted_yield', 8, 2)->nullable()->change();
            $table->integer('yield_confidence')->nullable()->change();
            $table->string('growth_stage', 50)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prediction_results', function (Blueprint $table) {
            $table->decimal('predicted_yield', 8, 2)->nullable(false)->change();
            $table->integer('yield_confidence')->nullable(false)->change();
            $table->string('growth_stage', 50)->nullable(false)->change();
        });
    }
};
