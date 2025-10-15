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
        Schema::create('fields', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('coordinates'); // Store polygon coordinates as JSON
            $table->decimal('center_lat', 10, 8); // Field center latitude
            $table->decimal('center_lng', 11, 8); // Field center longitude
            $table->decimal('area_hectares', 10, 4)->nullable(); // Field area in hectares
            $table->string('region');
            $table->string('country');
            $table->string('crop')->nullable();
            $table->string('variety')->nullable();
            $table->text('image')->nullable(); // Base64 encoded satellite image
            $table->decimal('user_lat', 10, 8)->nullable(); // User's GPS location when field was created
            $table->decimal('user_lng', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fields');
    }
};
