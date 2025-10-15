<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredictionResult extends Model
{
    protected $fillable = [
        'submission_id',
        'field_id',
        'predicted_yield',
        'yield_confidence',
        'yield_unit',
        'growth_stage',
        'days_to_harvest',
        'maturity_index',
        'soil_ph',
        'organic_matter_percent',
        'nitrogen_level',
        'phosphorus_level',
        'potassium_level',
        'soil_type',
        'soil_conditions',
        'temperature_impact',
        'rainfall_impact',
        'humidity_impact',
        'weather_impact_summary',
        'disease_risks',
        'pest_risks',
        'weather_risks',
        'overall_risk_score',
        'fertilizer_recommendations',
        'irrigation_recommendations',
        'pest_control_recommendations',
        'harvest_recommendations',
        'market_price_prediction',
        'market_currency',
        'market_outlook',
        'market_trends',
        'processing_status',
        'processing_started_at',
        'processing_completed_at',
        'processing_error',
        'ai_metadata',
        'prediction_accuracy',
        'validation_metrics',
    ];

    protected $casts = [
        'predicted_yield' => 'decimal:2',
        'yield_confidence' => 'integer',
        'days_to_harvest' => 'integer',
        'maturity_index' => 'decimal:2',
        'soil_ph' => 'decimal:2',
        'organic_matter_percent' => 'decimal:2',
        'nitrogen_level' => 'decimal:2',
        'phosphorus_level' => 'decimal:2',
        'potassium_level' => 'decimal:2',
        'temperature_impact' => 'decimal:2',
        'rainfall_impact' => 'decimal:2',
        'humidity_impact' => 'decimal:2',
        'disease_risks' => 'array',
        'pest_risks' => 'array',
        'weather_risks' => 'array',
        'overall_risk_score' => 'decimal:2',
        'fertilizer_recommendations' => 'array',
        'irrigation_recommendations' => 'array',
        'pest_control_recommendations' => 'array',
        'harvest_recommendations' => 'array',
        'market_price_prediction' => 'decimal:2',
        'market_trends' => 'array',
        'processing_started_at' => 'datetime',
        'processing_completed_at' => 'datetime',
        'ai_metadata' => 'array',
        'prediction_accuracy' => 'decimal:2',
        'validation_metrics' => 'array',
    ];

    /**
     * Get the submission that owns this prediction result
     */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /**
     * Get the field that owns this prediction result
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Check if prediction is completed
     */
    public function isCompleted(): bool
    {
        return $this->processing_status === 'completed';
    }

    /**
     * Check if prediction is processing
     */
    public function isProcessing(): bool
    {
        return $this->processing_status === 'processing';
    }

    /**
     * Check if prediction failed
     */
    public function isFailed(): bool
    {
        return $this->processing_status === 'failed';
    }

    /**
     * Get processing duration in seconds
     */
    public function getProcessingDurationAttribute(): ?int
    {
        if (!$this->processing_started_at || !$this->processing_completed_at) {
            return null;
        }

        return $this->processing_completed_at->diffInSeconds($this->processing_started_at);
    }

    /**
     * Get formatted yield prediction
     */
    public function getFormattedYieldAttribute(): string
    {
        return number_format($this->predicted_yield, 1) . ' ' . $this->yield_unit;
    }

    /**
     * Get risk level based on overall risk score
     */
    public function getRiskLevelAttribute(): string
    {
        if ($this->overall_risk_score <= 25) return 'Low';
        if ($this->overall_risk_score <= 50) return 'Medium';
        if ($this->overall_risk_score <= 75) return 'High';
        return 'Very High';
    }

    /**
     * Get yield confidence color class
     */
    public function getYieldConfidenceColorAttribute(): string
    {
        if ($this->yield_confidence >= 80) return 'text-green-600';
        if ($this->yield_confidence >= 60) return 'text-yellow-600';
        return 'text-red-600';
    }
}
