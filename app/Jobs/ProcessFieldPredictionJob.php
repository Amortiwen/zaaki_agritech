<?php

namespace App\Jobs;

use App\Models\Field;
use App\Models\PredictionResult;
use App\Models\Submission;
use App\Services\OpenAiService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Exception;

class ProcessFieldPredictionJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 300; // 5 minutes timeout
    public int $tries = 3;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Submission $submission,
        public Field $field
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(OpenAiService $openAiService): void
    {
        try {
            Log::info('Starting AI prediction processing', [
                'submission_id' => $this->submission->id,
                'field_id' => $this->field->id,
                'field_name' => $this->field->name
            ]);

            // Create prediction result record
            $predictionResult = PredictionResult::create([
                'submission_id' => $this->submission->id,
                'field_id' => $this->field->id,
                'processing_status' => 'processing',
                'processing_started_at' => now(),
                'ai_metadata' => [
                    'model_version' => '1.0.0',
                    'processing_started' => now()->toISOString(),
                    'field_data' => [
                        'name' => $this->field->name,
                        'crop' => $this->field->crop,
                        'variety' => $this->field->variety,
                        'area_hectares' => $this->field->area_hectares,
                        'center_lat' => $this->field->center_lat,
                        'center_lng' => $this->field->center_lng,
                        'region' => $this->field->region
                    ]
                ]
            ]);

            // Prepare AI prompt with field data and weather
            $aiPrompt = $this->buildAIPrompt($this->field, $this->submission);
            
            // Get weather data (mock for now, integrate with real weather service)
            $weatherData = $this->getWeatherData($this->field);
            
            // Use mock data instead of real API call for demo
            $aiResponse = $this->generateMockAIResponse($this->field, $this->submission);
            
            // Parse and store AI response
            $predictionData = $this->parseAIResponse($aiResponse, $weatherData);
            
            // Update prediction result with AI data
            $predictionResult->update([
                'predicted_yield' => $predictionData['predicted_yield'],
                'yield_confidence' => $predictionData['yield_confidence'],
                'growth_stage' => $predictionData['growth_stage'],
                'days_to_harvest' => $predictionData['days_to_harvest'],
                'soil_ph' => $predictionData['soil_ph'],
                'organic_matter_percent' => $predictionData['organic_matter_percent'],
                'nitrogen_level' => $predictionData['nitrogen_level'],
                'phosphorus_level' => $predictionData['phosphorus_level'],
                'potassium_level' => $predictionData['potassium_level'],
                'soil_type' => $predictionData['soil_type'],
                'soil_conditions' => $predictionData['soil_conditions'],
                'temperature_impact' => $predictionData['temperature_impact'],
                'rainfall_impact' => $predictionData['rainfall_impact'],
                'humidity_impact' => $predictionData['humidity_impact'],
                'weather_impact_summary' => $predictionData['weather_impact_summary'],
                'disease_risks' => $predictionData['disease_risks'],
                'pest_risks' => $predictionData['pest_risks'],
                'weather_risks' => $predictionData['weather_risks'],
                'overall_risk_score' => $predictionData['overall_risk_score'],
                'fertilizer_recommendations' => $predictionData['fertilizer_recommendations'],
                'irrigation_recommendations' => $predictionData['irrigation_recommendations'],
                'pest_control_recommendations' => $predictionData['pest_control_recommendations'],
                'harvest_recommendations' => $predictionData['harvest_recommendations'],
                'market_price_prediction' => $predictionData['market_price_prediction'],
                'market_outlook' => $predictionData['market_outlook'],
                'market_trends' => $predictionData['market_trends'],
                'processing_status' => 'completed',
                'processing_completed_at' => now(),
                'prediction_accuracy' => $predictionData['prediction_accuracy'],
                'ai_metadata' => array_merge($predictionResult->ai_metadata ?? [], [
                    'processing_completed' => now()->toISOString(),
                    'ai_response' => $aiResponse,
                    'weather_data' => $weatherData
                ])
            ]);

            Log::info('AI prediction processing completed successfully', [
                'submission_id' => $this->submission->id,
                'field_id' => $this->field->id,
                'prediction_result_id' => $predictionResult->id,
                'predicted_yield' => $predictionData['predicted_yield']
            ]);

        } catch (Exception $e) {
            Log::error('AI prediction processing failed', [
                'submission_id' => $this->submission->id,
                'field_id' => $this->field->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark prediction as failed
            if (isset($predictionResult)) {
                $predictionResult->update([
                    'processing_status' => 'failed',
                    'processing_error' => $e->getMessage(),
                    'processing_completed_at' => now()
                ]);
            }

            throw $e;
        }
    }

    /**
     * Build AI prompt for field prediction
     */
    private function buildAIPrompt(Field $field, Submission $submission): string
    {
        $prompt = "Analyze this agricultural field and provide comprehensive predictions:\n\n";
        $prompt .= "Field Details:\n";
        $prompt .= "- Name: {$field->name}\n";
        $prompt .= "- Crop: {$field->crop}\n";
        $prompt .= "- Variety: {$field->variety}\n";
        $prompt .= "- Area: {$field->area_hectares} hectares\n";
        $prompt .= "- Location: {$field->center_lat}, {$field->center_lng}\n";
        $prompt .= "- Region: {$field->region}\n";
        $prompt .= "- Zone: {$submission->zone}\n\n";
        
        $prompt .= "Provide detailed analysis including:\n";
        $prompt .= "1. Yield prediction (tons/ha) with confidence level\n";
        $prompt .= "2. Current growth stage assessment\n";
        $prompt .= "3. Soil analysis and recommendations\n";
        $prompt .= "4. Weather impact analysis\n";
        $prompt .= "5. Risk assessment (diseases, pests, weather)\n";
        $prompt .= "6. Specific recommendations for farming practices\n";
        $prompt .= "7. Market outlook and price predictions\n\n";
        
        $prompt .= "Format your response as structured JSON with all the required fields.";

        return $prompt;
    }

    /**
     * Get weather data for the field location
     */
    private function getWeatherData(Field $field): array
    {
        // Mock weather data - integrate with real weather service
        return [
            'temperature' => rand(20, 35),
            'humidity' => rand(40, 80),
            'rainfall' => rand(0, 50),
            'wind_speed' => rand(5, 20),
            'weather_condition' => ['sunny', 'cloudy', 'partly_cloudy', 'rainy'][rand(0, 3)],
            'forecast_7_days' => []
        ];
    }

    /**
     * Generate mock AI response for demo purposes
     */
    private function generateMockAIResponse(Field $field, Submission $submission): string
    {
        // Simulate AI processing delay
        sleep(rand(2, 5));
        
        $crop = $field->crop ?? 'Maize';
        $area = $field->area_hectares;
        
        // Generate realistic predictions based on crop type
        $baseYield = match(strtolower($crop)) {
            'maize' => rand(35, 65) / 10, // 3.5-6.5 tons/ha
            'rice' => rand(25, 45) / 10,  // 2.5-4.5 tons/ha
            'sorghum' => rand(20, 40) / 10, // 2.0-4.0 tons/ha
            'cassava' => rand(80, 150) / 10, // 8.0-15.0 tons/ha
            'yam' => rand(60, 120) / 10, // 6.0-12.0 tons/ha
            default => rand(30, 60) / 10
        };
        
        $confidence = rand(75, 95);
        $growthStage = ['Planting', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready'][rand(0, 4)];
        
        return json_encode([
            'predicted_yield' => $baseYield,
            'yield_confidence' => $confidence,
            'growth_stage' => $growthStage,
            'days_to_harvest' => rand(30, 180),
            'soil_conditions' => "Good soil structure with adequate organic matter content for {$crop} cultivation.",
            'weather_impact' => "Favorable weather conditions expected for optimal {$crop} growth.",
            'recommendations' => [
                "Apply nitrogen fertilizer for {$crop} in next 2 weeks",
                "Monitor for pest activity during flowering stage",
                "Ensure adequate irrigation during dry periods"
            ],
            'risks' => [
                "Potential drought risk in coming weeks",
                "Monitor for fungal diseases in humid conditions"
            ],
            'market_outlook' => "Strong demand expected for {$crop} in local markets."
        ]);
    }

    /**
     * Parse AI response and extract structured data
     */
    private function parseAIResponse(string $aiResponse, array $weatherData): array
    {
        $data = json_decode($aiResponse, true);
        
        return [
            'predicted_yield' => $data['predicted_yield'] ?? rand(25, 85) / 10,
            'yield_confidence' => $data['yield_confidence'] ?? rand(70, 95),
            'growth_stage' => $data['growth_stage'] ?? 'Vegetative',
            'days_to_harvest' => $data['days_to_harvest'] ?? rand(30, 180),
            'soil_ph' => rand(55, 75) / 10, // 5.5 to 7.5
            'organic_matter_percent' => rand(15, 45) / 10, // 1.5 to 4.5%
            'nitrogen_level' => rand(80, 150),
            'phosphorus_level' => rand(15, 40),
            'potassium_level' => rand(100, 200),
            'soil_type' => 'Well-drained loam',
            'soil_conditions' => $data['soil_conditions'] ?? 'Good soil structure with adequate organic matter content.',
            'temperature_impact' => rand(-10, 15),
            'rainfall_impact' => rand(-5, 20),
            'humidity_impact' => rand(-8, 12),
            'weather_impact_summary' => $data['weather_impact'] ?? 'Favorable weather conditions with optimal temperature and rainfall patterns.',
            'disease_risks' => ['Fungal infections', 'Bacterial blight'],
            'pest_risks' => ['Aphids', 'Whiteflies'],
            'weather_risks' => $data['risks'] ?? ['Potential drought', 'Heavy rainfall'],
            'overall_risk_score' => rand(15, 35),
            'fertilizer_recommendations' => $data['recommendations'] ?? [
                'Apply nitrogen fertilizer in 2 weeks',
                'Add phosphorus for root development'
            ],
            'irrigation_recommendations' => [
                'Maintain consistent soil moisture',
                'Increase irrigation during flowering'
            ],
            'pest_control_recommendations' => [
                'Monitor for aphid infestation',
                'Apply organic pest control'
            ],
            'harvest_recommendations' => [
                'Harvest in early morning',
                'Check for optimal moisture content'
            ],
            'market_price_prediction' => rand(200, 500),
            'market_outlook' => $data['market_outlook'] ?? 'Strong demand expected with favorable market conditions.',
            'market_trends' => ['Increasing demand', 'Price stability'],
            'prediction_accuracy' => rand(85, 95)
        ];
    }
}
