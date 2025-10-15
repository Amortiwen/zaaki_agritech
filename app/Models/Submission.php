<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Submission extends Model
{
    protected $fillable = [
        'unique_submission_key',
        'region',
        'zone',
        'user_lat',
        'user_lng',
        'user_location_accuracy',
        'total_fields',
        'total_area_hectares',
        'submission_metadata',
        'status',
        'processed_at',
    ];

    protected $casts = [
        'user_lat' => 'decimal:8',
        'user_lng' => 'decimal:8',
        'total_area_hectares' => 'decimal:4',
        'submission_metadata' => 'array',
        'processed_at' => 'datetime',
    ];

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($submission) {
            if (empty($submission->unique_submission_key)) {
                $submission->unique_submission_key = 'SUB_' . Str::random(8) . '_' . now()->format('Ymd_His');
            }
        });
    }

    /**
     * Get the fields for this submission
     */
    public function fields(): HasMany
    {
        return $this->hasMany(Field::class);
    }

    /**
     * Get the crops in this submission
     */
    public function getCropsAttribute()
    {
        return $this->fields()->distinct()->pluck('crop')->filter()->values();
    }

    /**
     * Get the total area of all fields
     */
    public function getTotalAreaAttribute()
    {
        return $this->fields()->sum('area_hectares');
    }

    /**
     * Mark submission as completed
     */
    public function markAsCompleted()
    {
        $this->update([
            'status' => 'completed',
            'processed_at' => now(),
        ]);
    }

    /**
     * Mark submission as failed
     */
    public function markAsFailed()
    {
        $this->update([
            'status' => 'failed',
        ]);
    }
}
