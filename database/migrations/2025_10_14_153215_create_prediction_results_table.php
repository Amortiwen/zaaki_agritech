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
        Schema::create('prediction_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('submissions')->onDelete('cascade');
            $table->foreignId('field_id')->constrained('fields')->onDelete('cascade');
            
            // Yield Prediction Data
            $table->decimal('predicted_yield', 8, 2); // tons per hectare
            $table->integer('yield_confidence'); // percentage (0-100)
            $table->string('yield_unit', 10)->default('tons/ha');
            
            // Growth & Development
            $table->string('growth_stage', 50); // Planting, Vegetative, Flowering, etc.
            $table->integer('days_to_harvest')->nullable();
            $table->decimal('maturity_index', 5, 2)->nullable(); // 0-100 scale
            
            // Soil Analysis
            $table->decimal('soil_ph', 4, 2)->nullable();
            $table->decimal('organic_matter_percent', 5, 2)->nullable();
            $table->decimal('nitrogen_level', 8, 2)->nullable(); // kg/ha
            $table->decimal('phosphorus_level', 8, 2)->nullable(); // kg/ha
            $table->decimal('potassium_level', 8, 2)->nullable(); // kg/ha
            $table->string('soil_type', 100)->nullable();
            $table->text('soil_conditions')->nullable();
            
            // Weather Impact
            $table->decimal('temperature_impact', 5, 2)->nullable(); // -100 to +100 scale
            $table->decimal('rainfall_impact', 5, 2)->nullable(); // -100 to +100 scale
            $table->decimal('humidity_impact', 5, 2)->nullable(); // -100 to +100 scale
            $table->text('weather_impact_summary')->nullable();
            
            // Risk Assessment
            $table->json('disease_risks')->nullable(); // Array of disease risks
            $table->json('pest_risks')->nullable(); // Array of pest risks
            $table->json('weather_risks')->nullable(); // Array of weather risks
            $table->decimal('overall_risk_score', 5, 2)->nullable(); // 0-100 scale
            
            // Recommendations
            $table->json('fertilizer_recommendations')->nullable();
            $table->json('irrigation_recommendations')->nullable();
            $table->json('pest_control_recommendations')->nullable();
            $table->json('harvest_recommendations')->nullable();
            
            // Market Analysis
            $table->decimal('market_price_prediction', 10, 2)->nullable(); // per ton
            $table->string('market_currency', 3)->default('USD');
            $table->text('market_outlook')->nullable();
            $table->json('market_trends')->nullable();
            
            // AI Processing Info
            $table->enum('processing_status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->timestamp('processing_started_at')->nullable();
            $table->timestamp('processing_completed_at')->nullable();
            $table->text('processing_error')->nullable();
            $table->json('ai_metadata')->nullable(); // AI model version, parameters, etc.
            
            // Quality Metrics
            $table->decimal('prediction_accuracy', 5, 2)->nullable(); // AI's confidence in its prediction
            $table->json('validation_metrics')->nullable(); // Cross-validation results
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['submission_id', 'field_id']);
            $table->index('processing_status');
            $table->index(['predicted_yield', 'yield_confidence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prediction_results');
    }
};
