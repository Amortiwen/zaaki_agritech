<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiService
{
  

    /**
     * Get the JSON schema for structured output according to OpenAI API format
     */
    public function getStructuredOutputSchema(): array
    {
        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'agrisense_report',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'crop' => [
                            'type' => 'string',
                            'description' => 'Crop name'
                        ],
                        'variety' => [
                            'type' => 'string',
                            'description' => 'Crop variety',
                            'nullable' => true
                        ],
                        'growth_stage' => [
                            'type' => 'string',
                            'description' => 'Crop growth stage',
                            'nullable' => true
                        ],
                        'farm_details' => [
                            'type' => 'object',
                            'description' => 'Farm coordinates and soil info',
                            'properties' => [
                                'latitude' => [
                                    'type' => 'number',
                                    'description' => 'Latitude coordinate'
                                ],
                                'longitude' => [
                                    'type' => 'number',
                                    'description' => 'Longitude coordinate'
                                ],
                                'region' => [
                                    'type' => 'string',
                                    'description' => 'Administrative region'
                                ],
                                'country' => [
                                    'type' => 'string',
                                    'description' => 'Country'
                                ],
                                'address' => [
                                    'type' => 'string',
                                    'description' => 'Optional address',
                                    'nullable' => true
                                ],
                                'area_ha' => [
                                    'type' => 'number',
                                    'description' => 'Farm area (ha)',
                                    'nullable' => true
                                ],
                                'perimeter_km' => [
                                    'type' => 'number',
                                    'description' => 'Farm perimeter (km)',
                                    'nullable' => true
                                ],
                                'crop_zone' => [
                                    'type' => 'string',
                                    'description' => 'Agroecological zone',
                                    'nullable' => true
                                ],
                                'soil_type' => [
                                    'type' => 'string',
                                    'description' => 'Soil classification',
                                    'nullable' => true
                                ],
                                'soil_ph' => [
                                    'type' => 'number',
                                    'description' => 'Soil pH value (3–9)',
                                    'nullable' => true
                                ],
                                'irrigation' => [
                                    'type' => 'string',
                                    'description' => 'Irrigation method or status',
                                    'nullable' => true
                                ]
                            ],
                            'required' => ['latitude', 'longitude', 'region', 'country']
                        ],
                        'weather_summary' => [
                            'type' => 'object',
                            'description' => 'Weather details',
                            'properties' => [
                                'source' => [
                                    'type' => 'string',
                                    'description' => 'Weather data provider'
                                ],
                                'temperature' => [
                                    'type' => 'number',
                                    'description' => 'Temperature °C'
                                ],
                                'humidity' => [
                                    'type' => 'number',
                                    'description' => 'Relative humidity %'
                                ],
                                'rainfall' => [
                                    'type' => 'number',
                                    'description' => 'Rainfall (mm)'
                                ],
                                'windspeed' => [
                                    'type' => 'number',
                                    'description' => 'Wind speed (m/s)'
                                ],
                                'evapotranspiration' => [
                                    'type' => 'number',
                                    'description' => 'Evapotranspiration (mm/day)',
                                    'nullable' => true
                                ],
                                'conditions_description' => [
                                    'type' => 'string',
                                    'description' => 'Summary'
                                ]
                            ],
                            'required' => ['source', 'temperature', 'humidity', 'rainfall']
                        ],
                        'yield_prediction' => [
                            'type' => 'object',
                            'description' => 'Crop yield prediction',
                            'properties' => [
                                'expected_yield_t_ha' => [
                                    'type' => 'string',
                                    'description' => 'Expected yield (tons/ha)'
                                ],
                                'potential_yield_loss_percent' => [
                                    'type' => 'number',
                                    'description' => 'Yield loss %'
                                ],
                                'yield_trend' => [
                                    'type' => 'string',
                                    'description' => 'Rising | Stable | Falling'
                                ],
                                'confidence_score' => [
                                    'type' => 'number',
                                    'description' => 'Confidence 0–1'
                                ],
                                'main_limiting_factors' => [
                                    'type' => 'array',
                                    'description' => 'Yield limiting factors',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Factor'
                                    ]
                                ]
                            ],
                            'required' => ['expected_yield_t_ha', 'confidence_score']
                        ],
                        'disease_and_pest_risks' => [
                            'type' => 'object',
                            'description' => 'Disease and pest prediction',
                            'properties' => [
                                'disease_risk_level' => [
                                    'type' => 'string',
                                    'description' => 'Low | Moderate | High'
                                ],
                                'likely_diseases' => [
                                    'type' => 'array',
                                    'description' => 'Possible diseases',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Disease name'
                                    ]
                                ],
                                'pest_risk_level' => [
                                    'type' => 'string',
                                    'description' => 'Low | Moderate | High'
                                ],
                                'likely_pests' => [
                                    'type' => 'array',
                                    'description' => 'Possible pests',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Pest name'
                                    ]
                                ],
                                'preventive_actions' => [
                                    'type' => 'array',
                                    'description' => 'Preventive actions',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Action'
                                    ]
                                ]
                            ]
                        ],
                        'nutrient_analysis' => [
                            'type' => 'object',
                            'description' => 'Nutrient and fertilizer insight',
                            'properties' => [
                                'deficiency_signs' => [
                                    'type' => 'array',
                                    'description' => 'Detected deficiencies',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Sign'
                                    ]
                                ],
                                'fertilizer_recommendation' => [
                                    'type' => 'object',
                                    'description' => 'Fertilizer advice',
                                    'properties' => [
                                        'type' => [
                                            'type' => 'string',
                                            'description' => 'Fertilizer type'
                                        ],
                                        'dosage_per_hectare' => [
                                            'type' => 'string',
                                            'description' => 'Recommended dosage'
                                        ],
                                        'application_timing' => [
                                            'type' => 'string',
                                            'description' => 'Application timing'
                                        ],
                                        'note' => [
                                            'type' => 'string',
                                            'description' => 'Extra note'
                                        ]
                                    ],
                                    'required' => ['type', 'dosage_per_hectare']
                                ]
                            ]
                        ],
                        'food_safety_risks' => [
                            'type' => 'object',
                            'description' => 'Food contamination risks',
                            'properties' => [
                                'mycotoxin_risk' => [
                                    'type' => 'string',
                                    'description' => 'Risk level'
                                ],
                                'chemical_residue_risk' => [
                                    'type' => 'string',
                                    'description' => 'Risk level'
                                ],
                                'contamination_risks' => [
                                    'type' => 'array',
                                    'description' => 'Possible contaminations',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Contaminant'
                                    ]
                                ],
                                'safety_measures' => [
                                    'type' => 'array',
                                    'description' => 'Recommended safety measures',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Measure'
                                    ]
                                ]
                            ]
                        ],
                        'waste_minimization' => [
                            'type' => 'object',
                            'description' => 'Loss reduction suggestions',
                            'properties' => [
                                'farm_level_losses' => [
                                    'type' => 'array',
                                    'description' => 'Farm losses',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Loss type'
                                    ]
                                ],
                                'supply_chain_losses' => [
                                    'type' => 'array',
                                    'description' => 'Supply chain losses',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Loss type'
                                    ]
                                ],
                                'recommended_actions' => [
                                    'type' => 'array',
                                    'description' => 'Waste reduction actions',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Action'
                                    ]
                                ],
                                'estimated_loss_reduction_percent' => [
                                    'type' => 'number',
                                    'description' => 'Loss reduction %'
                                ]
                            ]
                        ],
                        'market_and_economic_outlook' => [
                            'type' => 'object',
                            'description' => 'Market analysis',
                            'properties' => [
                                'current_market_price_per_ton' => [
                                    'type' => 'number',
                                    'description' => 'Current price GHS/t'
                                ],
                                'price_trend' => [
                                    'type' => 'string',
                                    'description' => 'Price trend'
                                ],
                                'expected_profit_margin_percent' => [
                                    'type' => 'number',
                                    'description' => 'Profit margin %'
                                ],
                                'market_risk_factors' => [
                                    'type' => 'array',
                                    'description' => 'Market risks',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Risk'
                                    ]
                                ]
                            ]
                        ],
                        'sustainability_tips' => [
                            'type' => 'object',
                            'description' => 'Farm sustainability recommendations',
                            'properties' => [
                                'soil_health' => [
                                    'type' => 'string',
                                    'description' => 'Soil health tip'
                                ],
                                'water_conservation' => [
                                    'type' => 'string',
                                    'description' => 'Water efficiency tip'
                                ],
                                'crop_rotation' => [
                                    'type' => 'string',
                                    'description' => 'Crop rotation advice'
                                ],
                                'carbon_footprint' => [
                                    'type' => 'string',
                                    'description' => 'Carbon reduction tip'
                                ]
                            ]
                        ],
                        'effects' => [
                            'type' => 'object',
                            'description' => 'Environmental effects summary',
                            'properties' => [
                                'temperature_effect' => [
                                    'type' => 'string',
                                    'description' => 'Effect of temperature'
                                ],
                                'rainfall_effect' => [
                                    'type' => 'string',
                                    'description' => 'Effect of rainfall'
                                ],
                                'disease_effect' => [
                                    'type' => 'string',
                                    'description' => 'Effect of disease'
                                ],
                                'pest_effect' => [
                                    'type' => 'string',
                                    'description' => 'Effect of pests'
                                ],
                                'overall_effect' => [
                                    'type' => 'string',
                                    'description' => 'Overall summary'
                                ]
                            ]
                        ],
                        'fertilizer_recommendations' => [
                            'type' => 'object',
                            'description' => 'Fertilizer plan',
                            'properties' => [
                                'type' => [
                                    'type' => 'string',
                                    'description' => 'Fertilizer name'
                                ],
                                'dosage_kg_ha' => [
                                    'type' => 'number',
                                    'description' => 'Dosage kg/ha'
                                ],
                                'application_method' => [
                                    'type' => 'string',
                                    'description' => 'How to apply'
                                ],
                                'timing' => [
                                    'type' => 'string',
                                    'description' => 'When to apply'
                                ]
                            ]
                        ],
                        'irrigation_recommendations' => [
                            'type' => 'object',
                            'description' => 'Irrigation plan',
                            'properties' => [
                                'needed' => [
                                    'type' => 'boolean',
                                    'description' => 'If irrigation needed'
                                ],
                                'amount_mm' => [
                                    'type' => 'number',
                                    'description' => 'Water mm'
                                ],
                                'timing' => [
                                    'type' => 'string',
                                    'description' => 'When to irrigate'
                                ],
                                'method' => [
                                    'type' => 'string',
                                    'description' => 'Irrigation method'
                                ]
                            ]
                        ],
                        'disease_and_pest_management' => [
                            'type' => 'object',
                            'description' => 'Pest/disease management plan',
                            'properties' => [
                                'pesticide_type' => [
                                    'type' => 'string',
                                    'description' => 'Pesticide type'
                                ],
                                'application_threshold' => [
                                    'type' => 'string',
                                    'description' => 'Application threshold'
                                ],
                                'next_check_in_days' => [
                                    'type' => 'number',
                                    'description' => 'Next inspection (days)'
                                ]
                            ]
                        ],
                        'sustainability_score' => [
                            'type' => 'object',
                            'description' => 'Sustainability metrics',
                            'properties' => [
                                'soil_health_score' => [
                                    'type' => 'number',
                                    'description' => 'Soil health (0–1)'
                                ],
                                'water_efficiency_score' => [
                                    'type' => 'number',
                                    'description' => 'Water efficiency (0–1)'
                                ],
                                'overall_field_health' => [
                                    'type' => 'string',
                                    'description' => 'General field condition'
                                ]
                            ]
                        ],
                        'image_analysis' => [
                            'type' => 'object',
                            'description' => 'Image interpretation',
                            'properties' => [
                                'image_uploaded' => [
                                    'type' => 'boolean',
                                    'description' => 'Whether image uploaded'
                                ],
                                'image_source' => [
                                    'type' => 'string',
                                    'description' => 'Source of image'
                                ],
                                'detected_symptoms' => [
                                    'type' => 'array',
                                    'description' => 'Detected issues',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Symptom'
                                    ]
                                ],
                                'health_status' => [
                                    'type' => 'string',
                                    'description' => 'Plant health'
                                ],
                                'confidence_score' => [
                                    'type' => 'number',
                                    'description' => 'Confidence (0–1)'
                                ]
                            ]
                        ],
                        'recommendations' => [
                            'type' => 'object',
                            'description' => 'Practical farmer advice',
                            'properties' => [
                                'immediate_actions' => [
                                    'type' => 'array',
                                    'description' => 'Immediate actions',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Action'
                                    ]
                                ],
                                'weekly_plan' => [
                                    'type' => 'array',
                                    'description' => 'Weekly plan',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Plan'
                                    ]
                                ],
                                'farmer_tips' => [
                                    'type' => 'array',
                                    'description' => 'General tips',
                                    'items' => [
                                        'type' => 'string',
                                        'description' => 'Tip'
                                    ]
                                ]
                            ]
                        ],
                        'bottom_line' => [
                            'type' => 'object',
                            'description' => 'Simple summary',
                            'properties' => [
                                'summary' => [
                                    'type' => 'string',
                                    'description' => 'Plain summary'
                                ],
                                'expected_outcome' => [
                                    'type' => 'string',
                                    'description' => 'Expected result'
                                ],
                                'alert_level' => [
                                    'type' => 'string',
                                    'description' => 'low | medium | high'
                                ]
                            ],
                            'required' => ['summary', 'alert_level']
                        ],
                        'data_sources' => [
                            'type' => 'object',
                            'description' => 'Metadata and API details',
                            'properties' => [
                                'weather_api' => [
                                    'type' => 'string',
                                    'description' => 'Weather API used'
                                ],
                                'image_source' => [
                                    'type' => 'string',
                                    'description' => 'Image source'
                                ],
                                'model_version' => [
                                    'type' => 'string',
                                    'description' => 'Model version string'
                                ]
                            ]
                        ],
                        'timestamp' => [
                            'type' => 'string',
                            'description' => 'ISO timestamp'
                        ]
                    ],
                    'required' => ['crop', 'farm_details', 'yield_prediction', 'bottom_line', 'timestamp']
                ]
            ]
        ];
    }

    /**
     * Get weather information for a specific location
     */
    protected function getWeatherData(float $latitude, float $longitude): string
    {
                return (new UtilitiesService())->getCurrentWeatherForOpenAi($latitude, $longitude);
    }


    /**
     * Predict crop yield using OpenAI API with structured output
     */
    public function predictCropYield(string $prompt, array $parameters = []): array
    {
        try {
            $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
                'Content-Type' => 'application/json',
            ])
            ->withoutVerifying() 
            // ->retry(3, 1000)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4.1', // Using gpt-4o instead of gpt-5 as it's more widely available
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'response_format' => $this->getStructuredOutputSchema(),
                'temperature' => 0.7,
                'max_tokens' => 4000,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['choices'][0]['message']['content'])) {
                    return json_decode($data['choices'][0]['message']['content'], true);
                }
                
                throw new \Exception('Invalid response format from OpenAI API');
            }

            // Handle API errors
            $error = $response->json();
            throw new \Exception('OpenAI API Error: ' . ($error['error']['message'] ?? 'Unknown error'));

        } catch (\Exception $e) {
            Log::error('OpenAI API Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Predict crop yield with weather data integration
     */
    public function predictCropYieldWithWeather(string $crop, float $latitude, float $longitude, array $additionalParams = []): array
    {
        // Get weather data
        $weatherData = $this->getWeatherData($latitude, $longitude);
        
        // Create comprehensive prompt
        $prompt = "Analyze the crop yield for {$crop} at coordinates {$latitude}, {$longitude}. ";
        $prompt .= "Weather data: {$weatherData}. ";
        $prompt .= "Provide a comprehensive agricultural analysis including yield prediction, disease risks, nutrient analysis, and recommendations.";
        
        if (!empty($additionalParams)) {
            $prompt .= " Additional parameters: " . json_encode($additionalParams);
        }

        return $this->predictCropYield($prompt);
    }
}
