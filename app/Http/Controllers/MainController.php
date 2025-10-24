<?php

namespace App\Http\Controllers;

use App\Models\Field;
use App\Models\Submission;
use App\Models\PredictionResult;
use App\Jobs\ProcessFieldPredictionJob;
use App\Services\OpenAiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MainController extends Controller
{
    public function predictCropYield(OpenAiService $openAiService)
    {
        $latitude = 9.4418484;
        $longitude = -0.8634002;

        return $openAiService->predictCropYieldWithWeather(
            'maize',
            $latitude,
            $longitude
        );
        // ->toArray();
    }

    /**
     * Store field data submitted from the field mapping interface
     */
    public function storeFields(Request $request)
    {
        try {
            // Validate the incoming request
            $validator = Validator::make($request->all(), [
                'fields' => 'required|array|min:1',
                'fields.*.name' => 'required|string|max:255',
                'fields.*.coordinates' => 'required|array|min:3',
                'fields.*.coordinates.*' => 'required|array|size:2',
                'fields.*.coordinates.*.*' => 'required|numeric',
                'fields.*.center' => 'required|array|size:2',
                'fields.*.center.*' => 'required|numeric',
                'fields.*.region' => 'required|string|max:255',
                'fields.*.country' => 'required|string|max:255',
                'fields.*.crop' => 'nullable|string|max:255',
                'fields.*.variety' => 'nullable|string|max:255',
                'fields.*.image' => 'nullable|string',
                'user_location' => 'nullable|array',
                'user_location.lat' => 'nullable|numeric',
                'user_location.lng' => 'nullable|numeric',
                'region' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $fields = $request->input('fields');
            $userLocation = $request->input('user_location');
            $region = $request->input('region');
            $zone = $request->input('zone', 'Northern Ghana (Savannah Zone)');

            DB::beginTransaction();

            try {
                // Calculate total area for all fields
                $totalArea = 0;
                foreach ($fields as $field) {
                    $totalArea += $this->calculateFieldArea($field['coordinates']);
                }

                // Create submission record
                $submission = Submission::create([
                    'region' => $region,
                    'zone' => $zone,
                    'user_lat' => $userLocation['lat'] ?? null,
                    'user_lng' => $userLocation['lng'] ?? null,
                    'user_location_accuracy' => $userLocation['accuracy'] ?? null,
                    'total_fields' => count($fields),
                    'total_area_hectares' => $totalArea,
                    'submission_metadata' => [
                        'user_agent' => $request->userAgent(),
                        'ip_address' => $request->ip(),
                        'submission_method' => 'field_mapping_interface',
                        'fields_data' => $fields
                    ],
                    'status' => 'pending'
                ]);

                $savedFields = [];

                // Store each field in the database with submission reference
                foreach ($fields as $field) {
                    // Calculate area if not provided
                    $area = $this->calculateFieldArea($field['coordinates']);

                    $fieldData = [
                        'name' => $field['name'],
                        'coordinates' => $field['coordinates'],
                        'center_lat' => $field['center'][0],
                        'center_lng' => $field['center'][1],
                        'area_hectares' => $area,
                        'region' => $field['region'],
                        'country' => $field['country'],
                        'crop' => $field['crop'] ?? null,
                        'variety' => $field['variety'] ?? null,
                        'image' => $field['image'] ?? null,
                        'user_lat' => $userLocation['lat'] ?? null,
                        'user_lng' => $userLocation['lng'] ?? null,
                        'submission_id' => $submission->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    $savedField = Field::create($fieldData);
                    $savedFields[] = $savedField;

                    Log::info('Field saved to database', [
                        'field_id' => $savedField->id,
                        'field_name' => $savedField->name,
                        'submission_id' => $submission->id,
                        'region' => $savedField->region,
                        'area_hectares' => $savedField->area_hectares
                    ]);
                }

                // Mark submission as processing (will be processed by scheduled task)
                $submission->update(['status' => 'processing']);

                DB::commit();

                Log::info('Submission created successfully', [
                    'submission_id' => $submission->id,
                    'unique_key' => $submission->unique_submission_key,
                    'field_count' => count($savedFields),
                    'total_area' => $totalArea,
                    'user_location' => $userLocation,
                    'region' => $region,
                    'zone' => $zone,
                    'timestamp' => now()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Fields saved successfully',
                    'data' => [
                        'submission_id' => $submission->id,
                        'unique_submission_key' => $submission->unique_submission_key,
                        'saved_fields' => $savedFields,
                        'total_fields' => count($savedFields),
                        'total_area_hectares' => $totalArea,
                        'region' => $region,
                        'zone' => $zone,
                        'saved_at' => now()->toISOString()
                    ],
                    'redirect_to' => '/prediction'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error saving fields', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save fields',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate field area using the shoelace formula
     */
    private function calculateFieldArea(array $coordinates): float
    {
        $area = 0;
        $n = count($coordinates);

        for ($i = 0; $i < $n; $i++) {
            $j = ($i + 1) % $n;
            $area += $coordinates[$i][0] * $coordinates[$j][1];
            $area -= $coordinates[$j][0] * $coordinates[$i][1];
        }

        $area = abs($area) / 2;

        // Convert from square degrees to hectares (rough approximation)
        // This is a simplified conversion - for production, use proper projection
        $areaInHectares = ($area * 111000 * 111000) / 10000;

        return round($areaInHectares, 4);
    }

    /**
     * Show the prediction page with latest submission data
     */
    public function showPredictionPage($submissionKey = null)
    {
        // Get the latest submissions with their fields
        // $query = Submission::with('fields')->latest();

        // if ($submissionKey) {
        //     $query->where('unique_submission_key', $submissionKey);
        // }

        // $submissions = $query->take(10)->get();

        // $predictions = [];

        // foreach ($submissions as $submission) {
        //     foreach ($submission->fields as $field) {
        //         // Generate mock prediction data
        //         // In a real application, this would come from your AI service
        //         $predictions[] = [
        //             'submission_id' => $submission->id,
        //             'submission_key' => $submission->unique_submission_key,
        //             'field_id' => $field->id,
        //             'field_name' => $field->name,
        //             'crop' => $field->crop ?? 'Unknown',
        //             'variety' => $field->variety ?? 'Unknown',
        //             'region' => $field->region,
        //             'zone' => $submission->zone,
        //             'area_hectares' => (float) $field->area_hectares,
        //             'predicted_yield' => rand(25, 85) / 10, // Mock yield in tons/ha
        //             'yield_confidence' => rand(65, 95), // Mock confidence percentage
        //             'growth_stage' => ['Planting', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready'][rand(0, 4)],
        //             'soil_conditions' => 'Soil pH: 6.2, Organic matter: 2.8%, Well-drained loam soil with good nutrient availability.',
        //             'weather_impact' => 'Favorable weather conditions expected. Recent rainfall has improved soil moisture levels. Temperature range is optimal for current growth stage.',
        //             'recommendations' => [
        //                 'Apply nitrogen fertilizer in next 2 weeks',
        //                 'Monitor for pest activity during flowering stage',
        //                 'Ensure adequate irrigation during dry periods',
        //                 'Consider crop rotation for next season'
        //             ],
        //             'risk_factors' => [
        //                 'Potential drought risk in coming weeks',
        //                 'Monitor for fungal diseases in humid conditions',
        //                 'Market price volatility expected'
        //             ],
        //             'market_outlook' => 'Strong demand expected for ' . ($field->crop ?? 'this crop') . ' in local markets. Prices are projected to increase by 8-12% over the next quarter.',
        //             'submission_info' => [
        //                 'total_fields' => $submission->total_fields,
        //                 'total_area' => $submission->total_area_hectares,
        //                 'user_location' => [
        //                     'lat' => $submission->user_lat,
        //                     'lng' => $submission->user_lng,
        //                     'accuracy' => $submission->user_location_accuracy
        //                 ],
        //                 'status' => $submission->status,
        //                 'processed_at' => $submission->processed_at?->toISOString()
        //             ],
        //             'created_at' => $field->created_at->toISOString()
        //         ];
        //     }
        // }

        return inertia('prediction', [
            // 'fields' => $predictions,
            'submissionKey' => $submissionKey
        ]);
    }

    /**
     * Check prediction status for a submission
     */
    public function checkPredictionStatus($submissionKey)
    {
        try {
            $submission = Submission::where('unique_submission_key', $submissionKey)
                ->with(['fields.predictionResult'])
                ->first();

            if (!$submission) {
                return response()->json([
                    'success' => false,
                    'message' => 'Submission not found'
                ], 404);
            }

            $predictions = [];
            $allCompleted = true;
            $anyFailed = false;

            foreach ($submission->fields as $field) {
                $predictionResult = $field->predictionResult;

                if (!$predictionResult) {
                    $allCompleted = false;
                    $predictions[] = [
                        'field_id' => $field->id,
                        'field_name' => $field->name,
                        'status' => 'pending',
                        'message' => 'Waiting for AI processing...'
                    ];
                } elseif ($predictionResult->isProcessing()) {
                    $allCompleted = false;
                    $predictions[] = [
                        'field_id' => $field->id,
                        'field_name' => $field->name,
                        'status' => 'processing',
                        'message' => 'AI is analyzing your field...'
                    ];
                } elseif ($predictionResult->isFailed()) {
                    $anyFailed = true;
                    $predictions[] = [
                        'field_id' => $field->id,
                        'field_name' => $field->name,
                        'status' => 'failed',
                        'message' => 'AI processing failed: ' . $predictionResult->processing_error
                    ];
                } else {
                    // Completed
                    $predictions[] = [
                        'field_id' => $field->id,
                        'field_name' => $field->name,
                        'crop' => $field->crop,
                        'variety' => $field->variety,
                        'region' => $field->region,
                        // 'area_hectares' => (float) $field->area_hectares,
                        'status' => 'completed',
                        ...$predictionResult->toArray()
                    ];
                }
            }

            // Update submission status if all predictions are complete
            if ($allCompleted && !$anyFailed) {
                $submission->markAsCompleted();
            } elseif ($anyFailed) {
                $submission->markAsFailed();
            }

            return response()->json([
                'success' => true,
                'submission' => [
                    'id' => $submission->id,
                    'unique_key' => $submission->unique_submission_key,
                    'status' => $submission->status,
                    'total_fields' => $submission->total_fields,
                    'total_area_hectares' => $submission->total_area_hectares,
                    'region' => $submission->region,
                    'zone' => $submission->zone,
                    'all_completed' => $allCompleted,
                    'any_failed' => $anyFailed
                ],
                'predictions' => $predictions
            ]);
        } catch (\Exception $e) {
            Log::error('Error checking prediction status', [
                'submission_key' => $submissionKey,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check prediction status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest field predictions for the prediction page
     */
    public function getLatestPredictions()
    {
        try {
            // Get the latest submissions with their prediction results
            $submissions = Submission::with(['fields.predictionResult'])
                ->latest()
                ->take(10)
                ->get();

            $predictions = [];

            foreach ($submissions as $submission) {
                foreach ($submission->fields as $field) {
                    $predictionResult = $field->predictionResult;

                    if ($predictionResult && $predictionResult->isCompleted()) {
                        $predictions[] = [
                            'submission_id' => $submission->id,
                            'submission_key' => $submission->unique_submission_key,
                            'field_id' => $field->id,
                            'field_name' => $field->name,
                            'crop' => $field->crop ?? 'Unknown',
                            'variety' => $field->variety ?? 'Unknown',
                            'region' => $field->region,
                            'zone' => $submission->zone,
                            'area_hectares' => (float) $field->area_hectares,
                            'predicted_yield' => $predictionResult->predicted_yield,
                            'yield_confidence' => $predictionResult->yield_confidence,
                            'growth_stage' => $predictionResult->growth_stage,
                            'days_to_harvest' => $predictionResult->days_to_harvest,
                            'soil_conditions' => $predictionResult->soil_conditions,
                            'weather_impact_summary' => $predictionResult->weather_impact_summary,
                            'fertilizer_recommendations' => $predictionResult->fertilizer_recommendations,
                            'irrigation_recommendations' => $predictionResult->irrigation_recommendations,
                            'pest_control_recommendations' => $predictionResult->pest_control_recommendations,
                            'harvest_recommendations' => $predictionResult->harvest_recommendations,
                            'disease_risks' => $predictionResult->disease_risks,
                            'pest_risks' => $predictionResult->pest_risks,
                            'weather_risks' => $predictionResult->weather_risks,
                            'overall_risk_score' => $predictionResult->overall_risk_score,
                            'market_price_prediction' => $predictionResult->market_price_prediction,
                            'market_outlook' => $predictionResult->market_outlook,
                            'market_trends' => $predictionResult->market_trends,
                            'submission_info' => [
                                'total_fields' => $submission->total_fields,
                                'total_area' => $submission->total_area_hectares,
                                'user_location' => [
                                    'lat' => $submission->user_lat,
                                    'lng' => $submission->user_lng,
                                    'accuracy' => $submission->user_location_accuracy
                                ],
                                'status' => $submission->status,
                                'processed_at' => $submission->processed_at?->toISOString()
                            ],
                            'created_at' => $field->created_at->toISOString()
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'predictions' => $predictions
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching predictions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch predictions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest field predictions for the prediction page
     */
    public function getLatestPrediction($submissionKey)
    {
        try {
            // Get the submission with their prediction results
            $submission = Submission::with(['fields.predictionResult'])
                ->where('unique_submission_key', $submissionKey)
                ->first();

            if (!$submission) {
                return response()->json([
                    'success' => false,
                    'submissionKey' => $submissionKey,
                    'message' => 'Submission not found'
                ], 404);
            }

            $prediction = null;

            // Get the first field with completed prediction
            foreach ($submission->fields as $field) {
                $predictionResult = $field->predictionResult;

                if ($predictionResult && $predictionResult->isCompleted()) {
                    $prediction = [
                        'submission_id' => $submission->id,
                        'submission_key' => $submission->unique_submission_key,
                        'field_id' => $field->id,
                        'field_name' => $field->name,
                        'crop' => $field->crop ?? 'Unknown',
                        'variety' => $field->variety ?? 'Unknown',
                        'region' => $field->region,
                        'zone' => $submission->zone,
                        'area_hectares' => (float) $field->area_hectares,
                        'predicted_yield' => $predictionResult->predicted_yield,
                        'yield_confidence' => $predictionResult->yield_confidence,
                        'yield_unit' => $predictionResult->yield_unit ?? 'tons/ha',
                        'growth_stage' => $predictionResult->growth_stage,
                        'days_to_harvest' => $predictionResult->days_to_harvest,
                        'soil_conditions' => $predictionResult->soil_conditions,
                        'soil_ph' => $predictionResult->soil_ph,
                        'organic_matter_percent' => $predictionResult->organic_matter_percent,
                        'nitrogen_level' => $predictionResult->nitrogen_level,
                        'phosphorus_level' => $predictionResult->phosphorus_level,
                        'potassium_level' => $predictionResult->potassium_level,
                        'soil_type' => $predictionResult->soil_type,
                        'temperature_impact' => $predictionResult->temperature_impact,
                        'rainfall_impact' => $predictionResult->rainfall_impact,
                        'humidity_impact' => $predictionResult->humidity_impact,
                        'weather_impact_summary' => $predictionResult->weather_impact_summary,
                        'fertilizer_recommendations' => $predictionResult->fertilizer_recommendations,
                        'irrigation_recommendations' => $predictionResult->irrigation_recommendations,
                        'pest_control_recommendations' => $predictionResult->pest_control_recommendations,
                        'harvest_recommendations' => $predictionResult->harvest_recommendations,
                        'disease_risks' => $predictionResult->disease_risks,
                        'pest_risks' => $predictionResult->pest_risks,
                        'weather_risks' => $predictionResult->weather_risks,
                        'overall_risk_score' => $predictionResult->overall_risk_score,
                        'market_price_prediction' => $predictionResult->market_price_prediction,
                        'market_currency' => $predictionResult->market_currency ?? 'USD',
                        'market_outlook' => $predictionResult->market_outlook,
                        'market_trends' => $predictionResult->market_trends,
                        'prediction_accuracy' => $predictionResult->prediction_accuracy,
                        'processing_started_at' => $predictionResult->processing_started_at?->toISOString(),
                        'processing_completed_at' => $predictionResult->processing_completed_at?->toISOString(),
                        'ai_metadata' => $predictionResult->ai_metadata,
                        'submission_info' => [
                            'total_fields' => $submission->total_fields,
                            'total_area' => $submission->total_area_hectares,
                            'user_location' => [
                                'lat' => $submission->user_lat,
                                'lng' => $submission->user_lng,
                                'accuracy' => $submission->user_location_accuracy
                            ],
                            'status' => $submission->status,
                            'processed_at' => $submission->processed_at?->toISOString()
                        ],
                        'created_at' => $field->created_at->toISOString()
                    ];
                    break; // Get only the first completed prediction
                }
            }

            if (!$prediction) {
                // Check if there are any predictions still processing
                $processingPredictions = [];
                foreach ($submission->fields as $field) {
                    $predictionResult = $field->predictionResult;
                    if ($predictionResult && $predictionResult->isProcessing()) {
                        $processingPredictions[] = [
                            'field_id' => $field->id,
                            'field_name' => $field->name,
                            'status' => 'processing',
                            'message' => 'AI is analyzing your field data...'
                        ];
                    }
                }

                if (!empty($processingPredictions)) {
                    return response()->json([
                        'success' => true,
                        'data' => null,
                        'processing' => true,
                        'predictions' => $processingPredictions,
                        'message' => 'Predictions are still being processed'
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'No completed predictions found for this submission'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $prediction
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching predictions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch predictions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

