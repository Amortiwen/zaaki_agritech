<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Field extends Model
{
    protected $fillable = [
        'name',
        'coordinates',
        'center_lat',
        'center_lng',
        'area_hectares',
        'region',
        'country',
        'crop',
        'variety',
        'image',
        'user_lat',
        'user_lng',
        'submission_id',
    ];

    protected $casts = [
        'coordinates' => 'array',
        'center_lat' => 'decimal:8',
        'center_lng' => 'decimal:8',
        'area_hectares' => 'decimal:4',
        'user_lat' => 'decimal:8',
        'user_lng' => 'decimal:8',
    ];

    /**
     * Get the submission that owns this field
     */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /**
     * Get the prediction result for this field
     */
    public function predictionResult(): HasOne
    {
        return $this->hasOne(PredictionResult::class);
    }
}
