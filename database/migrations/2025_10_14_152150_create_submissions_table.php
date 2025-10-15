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
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->string('unique_submission_key')->unique(); // Unique identifier for this submission
            $table->string('region'); // Region where fields are located
            $table->string('zone'); // Agricultural zone (Northern/Southern Ghana)
            $table->decimal('user_lat', 10, 8)->nullable(); // User's GPS location when submitted
            $table->decimal('user_lng', 11, 8)->nullable();
            $table->string('user_location_accuracy')->nullable(); // GPS accuracy info
            $table->integer('total_fields'); // Number of fields in this submission
            $table->decimal('total_area_hectares', 10, 4); // Sum of all field areas
            $table->json('submission_metadata')->nullable(); // Additional metadata
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['region', 'zone']);
            $table->index('unique_submission_key');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
