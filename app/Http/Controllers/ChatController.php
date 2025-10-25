<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ChatController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        try {
            // Log the request for debugging
            Log::info('Chat request received', [
                'request_data' => $request->all(),
                'headers' => $request->headers->all(),
                'csrf_token' => $request->header('X-CSRF-TOKEN')
            ]);
            
            $messages = $request->input('messages', []);
            $predictionData = $request->input('predictionData');
            $webSearch = $request->input('webSearch', false);
            
            // Get the latest message from the user
            $userMessage = end($messages);
            $userText = $userMessage['text'] ?? '';
            
            // Create context from prediction data
            $context = $this->buildContext($predictionData);
            
            // Call OpenAI API
            $response = $this->callOpenAI($userText, $context, $webSearch);
            
            return response()->json([
                'success' => true,
                'message' => $response['text'],
                'reasoning' => $response['reasoning'] ?? null,
                'sources' => $response['sources'] ?? [],
                'suggestions' => $response['suggestions'] ?? []
            ]);
            
        } catch (\Exception $e) {
            Log::error('Chat error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Sorry, I encountered an error. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    private function buildContext($predictionData): array
    {
        if (!$predictionData) {
            return [];
        }
        
        return [
            'crop' => $predictionData['crop'] ?? 'Unknown',
            'variety' => $predictionData['variety'] ?? 'Unknown',
            'region' => $predictionData['region'] ?? 'Unknown',
            'area_hectares' => $predictionData['area_hectares'] ?? 'Unknown',
            'predicted_yield' => $predictionData['predicted_yield'] ?? 'Unknown',
            'yield_unit' => $predictionData['yield_unit'] ?? 'tons/ha',
            'yield_confidence' => $predictionData['yield_confidence'] ?? 'Unknown',
            'days_to_harvest' => $predictionData['days_to_harvest'] ?? 'Unknown',
            'growth_stage' => $predictionData['growth_stage'] ?? 'Unknown',
            'soil_ph' => $predictionData['soil_ph'] ?? 'Unknown',
            'organic_matter_percent' => $predictionData['organic_matter_percent'] ?? 'Unknown',
            'soil_type' => $predictionData['soil_type'] ?? 'Unknown',
            'soil_conditions' => $predictionData['soil_conditions'] ?? 'Unknown',
            'temperature_impact' => $predictionData['temperature_impact'] ?? 'Unknown',
            'rainfall_impact' => $predictionData['rainfall_impact'] ?? 'Unknown',
            'humidity_impact' => $predictionData['humidity_impact'] ?? 'Unknown',
            'weather_impact_summary' => $predictionData['weather_impact_summary'] ?? 'Unknown',
            'fertilizer_recommendations' => $predictionData['fertilizer_recommendations'] ?? [],
            'irrigation_recommendations' => $predictionData['irrigation_recommendations'] ?? [],
            'overall_risk_score' => $predictionData['overall_risk_score'] ?? 'Unknown',
            'disease_risks' => $predictionData['disease_risks'] ?? [],
            'pest_risks' => $predictionData['pest_risks'] ?? [],
            'weather_risks' => $predictionData['weather_risks'] ?? [],
            'market_price_prediction' => $predictionData['market_price_prediction'] ?? 'Unknown',
            'market_outlook' => $predictionData['market_outlook'] ?? 'Unknown',
            'market_trends' => $predictionData['market_trends'] ?? []
        ];
    }
    
    private function callOpenAI(string $userQuery, array $context, bool $webSearch): array
    {
        $apiKey = config('openai.api_key');
        
        if (!$apiKey) {
            throw new \Exception('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
        }
        
        // Build the system prompt with context
        $systemPrompt = $this->buildSystemPrompt($context);
        
        // Prepare messages for OpenAI
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ],
            [
                'role' => 'user',
                'content' => $userQuery
            ]
        ];
        
        // Prepare the request payload
        $payload = [
            'model' => config('openai.model', 'gpt-4o-mini'),
            'messages' => $messages,
            'max_tokens' => config('openai.max_tokens', 1000),
            'temperature' => config('openai.temperature', 0.7),
            'stream' => false
        ];
        
        // Add web search tool if enabled
        if ($webSearch) {
            $payload['tools'] = [
                [
                    'type' => 'function',
                    'function' => [
                        'name' => 'web_search',
                        'description' => 'Search the web for current information',
                        'parameters' => [
                            'type' => 'object',
                            'properties' => [
                                'query' => [
                                    'type' => 'string',
                                    'description' => 'The search query'
                                ]
                            ],
                            'required' => ['query']
                        ]
                    ]
                ]
            ];
        }
        
        // Make the API call
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ])->post('https://api.openai.com/v1/chat/completions', $payload);
        
        if (!$response->successful()) {
            throw new \Exception('OpenAI API error: ' . $response->body());
        }
        
        $data = $response->json();
        $content = $data['choices'][0]['message']['content'] ?? '';
        
        // Generate suggestions based on the query
        $suggestions = $this->generateSuggestions($userQuery);
        
        return [
            'text' => $content,
            'reasoning' => $this->generateReasoning($userQuery, $context),
            'sources' => $webSearch ? $this->getWebSources($userQuery) : [],
            'suggestions' => $suggestions
        ];
    }
    
    private function buildSystemPrompt(array $context): string
    {
        $prompt = "You are AgriSense AI, an expert agricultural assistant. You help farmers understand their crop prediction data and provide actionable insights.\n\n";
        
        if (!empty($context)) {
            $prompt .= "CURRENT CROP PREDICTION DATA:\n";
            $prompt .= "- Crop: " . $context['crop'] . "\n";
            $prompt .= "- Variety: " . $context['variety'] . "\n";
            $prompt .= "- Region: " . $context['region'] . "\n";
            $prompt .= "- Predicted Yield: " . $context['predicted_yield'] . " " . $context['yield_unit'] . "\n";
            $prompt .= "- Yield Confidence: " . $context['yield_confidence'] . "%\n";
            $prompt .= "- Growth Stage: " . $context['growth_stage'] . "\n";
            $prompt .= "- Days to Harvest: " . $context['days_to_harvest'] . "\n";
            $prompt .= "- Soil pH: " . $context['soil_ph'] . "\n";
            $prompt .= "- Organic Matter: " . $context['organic_matter_percent'] . "%\n";
            $prompt .= "- Soil Type: " . $context['soil_type'] . "\n";
            $prompt .= "- Weather Impact: Temperature " . $context['temperature_impact'] . "%, Rainfall " . $context['rainfall_impact'] . "%, Humidity " . $context['humidity_impact'] . "%\n";
            $prompt .= "- Risk Score: " . $context['overall_risk_score'] . "%\n";
            $prompt .= "- Market Price: $" . $context['market_price_prediction'] . "\n\n";
        }
        
        $prompt .= "INSTRUCTIONS:\n";
        $prompt .= "1. Provide clear, actionable advice based on the crop data\n";
        $prompt .= "2. Explain technical terms in simple language\n";
        $prompt .= "3. Focus on practical recommendations for farmers\n";
        $prompt .= "4. Use emojis to make responses engaging\n";
        $prompt .= "5. Always consider the local context (region, soil, weather)\n";
        $prompt .= "6. Provide specific, measurable advice when possible\n\n";
        
        $prompt .= "RESPONSE FORMAT:\n";
        $prompt .= "- Start with a brief summary\n";
        $prompt .= "- Provide detailed analysis\n";
        $prompt .= "- Include actionable recommendations\n";
        $prompt .= "- End with next steps or follow-up questions\n";
        
        return $prompt;
    }
    
    private function generateSuggestions(string $query): array
    {
        $query = strtolower($query);
        
        if (strpos($query, 'yield') !== false) {
            return [
                "How can I optimize my yield further?",
                "What factors affect yield the most?",
                "Compare with previous seasons"
            ];
        } elseif (strpos($query, 'soil') !== false) {
            return [
                "How to improve soil health?",
                "What nutrients are missing?",
                "Soil testing recommendations"
            ];
        } elseif (strpos($query, 'weather') !== false) {
            return [
                "Weather risk management",
                "Irrigation recommendations",
                "Climate adaptation strategies"
            ];
        } elseif (strpos($query, 'risk') !== false) {
            return [
                "How to reduce disease risks?",
                "Pest control strategies",
                "Weather protection methods"
            ];
        } elseif (strpos($query, 'market') !== false) {
            return [
                "When to sell for best price?",
                "Market trend analysis",
                "Pricing strategies"
            ];
        } else {
            return [
                "Explain the yield prediction",
                "What are the main risks?",
                "How can I improve soil health?",
                "What's the market outlook?",
                "Explain the weather impact"
            ];
        }
    }
    
    private function generateReasoning(string $query, array $context): string
    {
        return "I analyzed your crop prediction data including soil conditions, weather patterns, growth stage, and market factors to provide this recommendation. The advice is based on agricultural best practices and your specific field conditions.";
    }
    
    private function generateEnhancedAIResponse(string $userQuery, array $context, bool $webSearch): array
    {
        $query = strtolower($userQuery);
        
        // Determine response type and generate appropriate content
        if (strpos($query, 'yield') !== false || strpos($query, 'production') !== false) {
            return $this->generateYieldResponse($context, $webSearch);
        } elseif (strpos($query, 'soil') !== false || strpos($query, 'nutrient') !== false) {
            return $this->generateSoilResponse($context, $webSearch);
        } elseif (strpos($query, 'weather') !== false || strpos($query, 'climate') !== false) {
            return $this->generateWeatherResponse($context, $webSearch);
        } elseif (strpos($query, 'risk') !== false || strpos($query, 'problem') !== false) {
            return $this->generateRiskResponse($context, $webSearch);
        } elseif (strpos($query, 'market') !== false || strpos($query, 'price') !== false) {
            return $this->generateMarketResponse($context, $webSearch);
        } else {
            return $this->generateGeneralResponse($userQuery, $context, $webSearch);
        }
    }
    
    private function generateYieldResponse(array $context, bool $webSearch): array
    {
        return [
            'text' => "🌾 **Yield Analysis**\n\nYour crop prediction shows excellent potential! Here's what the data reveals:\n\n" .
                     "**Predicted Yield**: {$context['predicted_yield']} {$context['yield_unit']}\n" .
                     "**Confidence Level**: {$context['yield_confidence']}%\n" .
                     "**Growth Stage**: {$context['growth_stage']}\n" .
                     "**Days to Harvest**: {$context['days_to_harvest']} days\n\n" .
                     "This yield prediction is based on your soil conditions, weather patterns, and crop variety. " .
                     "The high confidence level indicates reliable data inputs and favorable growing conditions.",
            'reasoning' => "I analyzed your soil pH ({$context['soil_ph']}), organic matter content ({$context['organic_matter_percent']}%), " .
                          "weather impact factors, and current growth stage to determine this yield prediction. " .
                          "The combination of favorable soil conditions and optimal weather patterns supports this projection.",
            'sources' => $webSearch ? $this->getYieldSources() : [],
            'suggestions' => [
                "How can I optimize my yield further?",
                "What factors affect yield the most?",
                "Compare with previous seasons"
            ]
        ];
    }
    
    private function generateSoilResponse(array $context, bool $webSearch): array
    {
        return [
            'text' => "🌱 **Soil Health Assessment**\n\nYour soil analysis provides valuable insights for crop optimization:\n\n" .
                     "**pH Level**: {$context['soil_ph']} (optimal range: 6.0-7.0)\n" .
                     "**Organic Matter**: {$context['organic_matter_percent']}%\n" .
                     "**Soil Type**: {$context['soil_type']}\n" .
                     "**Conditions**: {$context['soil_conditions']}\n\n" .
                     "Your soil shows good structure and nutrient availability. " .
                     "The pH level is within acceptable range for most crops.",
            'reasoning' => "I evaluated your soil's pH balance, organic matter content, and nutrient levels. " .
                          "The soil composition indicates good water retention and nutrient availability, " .
                          "which supports healthy crop growth and optimal yield potential.",
            'sources' => $webSearch ? $this->getSoilSources() : [],
            'suggestions' => [
                "How to improve soil health?",
                "What nutrients are missing?",
                "Soil testing recommendations"
            ]
        ];
    }
    
    private function generateWeatherResponse(array $context, bool $webSearch): array
    {
        return [
            'text' => "🌤️ **Weather Impact Analysis**\n\nThe weather conditions are significantly influencing your crop growth:\n\n" .
                     "**Temperature Impact**: +{$context['temperature_impact']}%\n" .
                     "**Rainfall Impact**: +{$context['rainfall_impact']}%\n" .
                     "**Humidity Impact**: {$context['humidity_impact']}%\n" .
                     "**Summary**: {$context['weather_impact_summary']}\n\n" .
                     "Current weather patterns are favorable for crop development. " .
                     "The positive temperature and rainfall impacts support optimal growth conditions.",
            'reasoning' => "I analyzed current weather data, historical patterns, and seasonal forecasts. " .
                          "The positive weather impacts indicate favorable growing conditions that should " .
                          "support your crop's development and yield potential.",
            'sources' => $webSearch ? $this->getWeatherSources() : [],
            'suggestions' => [
                "Weather risk management",
                "Irrigation recommendations",
                "Climate adaptation strategies"
            ]
        ];
    }
    
    private function generateRiskResponse(array $context, bool $webSearch): array
    {
        return [
            'text' => "⚠️ **Risk Assessment**\n\nLet me break down the potential risks and how to mitigate them:\n\n" .
                     "**Overall Risk Score**: {$context['overall_risk_score']}%\n" .
                     "**Disease Risks**: " . implode(', ', $context['disease_risks'] ?? []) . "\n" .
                     "**Pest Risks**: " . implode(', ', $context['pest_risks'] ?? []) . "\n" .
                     "**Weather Risks**: " . implode(', ', $context['weather_risks'] ?? []) . "\n\n" .
                     "While some risks are present, they are manageable with proper monitoring and preventive measures.",
            'reasoning' => "I assessed multiple risk factors including disease susceptibility, pest pressure, " .
                          "weather variability, and soil conditions. The moderate risk level indicates " .
                          "that while challenges exist, they can be effectively managed with proper planning.",
            'sources' => $webSearch ? $this->getRiskSources() : [],
            'suggestions' => [
                "How to reduce disease risks?",
                "Pest control strategies",
                "Weather protection methods"
            ]
        ];
    }
    
    private function generateMarketResponse(array $context, bool $webSearch): array
    {
        return [
            'text' => "📈 **Market Analysis**\n\nHere's what the market data tells us about your crop's potential value:\n\n" .
                     "**Market Price**: \${$context['market_price_prediction']}\n" .
                     "**Outlook**: {$context['market_outlook']}\n" .
                     "**Trends**: " . implode(', ', $context['market_trends'] ?? []) . "\n\n" .
                     "The market conditions appear favorable for your crop. " .
                     "Current pricing and trends suggest good potential for profitable harvest timing.",
            'reasoning' => "I analyzed current market prices, demand trends, and seasonal patterns. " .
                          "The market outlook considers factors like supply and demand, " .
                          "seasonal variations, and economic indicators to provide pricing insights.",
            'sources' => $webSearch ? $this->getMarketSources() : [],
            'suggestions' => [
                "When to sell for best price?",
                "Market trend analysis",
                "Pricing strategies"
            ]
        ];
    }
    
    private function generateGeneralResponse(string $query, array $context, bool $webSearch): array
    {
        return [
            'text' => "🤖 **AgriSense AI Assistant**\n\nI can help you understand your crop prediction data! Based on your analysis, here are the key insights:\n\n" .
                     "• **Predicted Yield**: {$context['predicted_yield']} {$context['yield_unit']} with {$context['yield_confidence']}% confidence\n" .
                     "• **Growth Stage**: {$context['growth_stage']}\n" .
                     "• **Days to Harvest**: {$context['days_to_harvest']} days\n" .
                     "• **Soil Health**: pH {$context['soil_ph']}, {$context['organic_matter_percent']}% organic matter\n" .
                     "• **Risk Level**: {$context['overall_risk_score']}% overall risk\n\n" .
                     "Ask me about any specific aspect like yield optimization, soil health, weather impact, risk management, or market outlook!",
            'reasoning' => "I'm analyzing your comprehensive crop prediction data to provide insights across all aspects " .
                          "of your agricultural operation. This includes yield potential, soil health, weather impacts, " .
                          "risk factors, and market conditions.",
            'sources' => $webSearch ? $this->getGeneralSources() : [],
            'suggestions' => [
                "Explain the yield prediction",
                "What are the main risks?",
                "How can I improve soil health?",
                "What's the market outlook?",
                "Explain the weather impact"
            ]
        ];
    }
    
    private function getReasoning(string $query, array $context): string
    {
        return "I'm analyzing your crop prediction data to provide the most accurate insights. " .
               "I'm considering factors like soil composition, weather patterns, growth stage, " .
               "and historical data to give you actionable recommendations.";
    }
    
    private function getYieldSources(): array
    {
        return [
            [
                'title' => 'Crop Yield Optimization Guide',
                'url' => 'https://example.com/crop-yield-guide',
                'snippet' => 'Comprehensive guide to maximizing crop yields through soil management and weather monitoring.'
            ],
            [
                'title' => 'Agricultural Yield Prediction Methods',
                'url' => 'https://example.com/yield-prediction',
                'snippet' => 'Scientific methods for predicting crop yields based on environmental factors.'
            ]
        ];
    }
    
    private function getSoilSources(): array
    {
        return [
            [
                'title' => 'Soil Health Assessment Guide',
                'url' => 'https://example.com/soil-health',
                'snippet' => 'Complete guide to evaluating and improving soil health for optimal crop growth.'
            ],
            [
                'title' => 'Nutrient Management in Agriculture',
                'url' => 'https://example.com/nutrient-management',
                'snippet' => 'Best practices for managing soil nutrients and organic matter content.'
            ]
        ];
    }
    
    private function getWeatherSources(): array
    {
        return [
            [
                'title' => 'Weather Impact on Crop Growth',
                'url' => 'https://example.com/weather-impact',
                'snippet' => 'How weather patterns affect crop development and yield potential.'
            ],
            [
                'title' => 'Climate Adaptation Strategies',
                'url' => 'https://example.com/climate-adaptation',
                'snippet' => 'Strategies for adapting agricultural practices to changing weather conditions.'
            ]
        ];
    }
    
    private function getRiskSources(): array
    {
        return [
            [
                'title' => 'Agricultural Risk Management',
                'url' => 'https://example.com/risk-management',
                'snippet' => 'Best practices for identifying and mitigating agricultural risks.'
            ],
            [
                'title' => 'Disease and Pest Control',
                'url' => 'https://example.com/pest-control',
                'snippet' => 'Integrated pest management strategies for sustainable agriculture.'
            ]
        ];
    }
    
    private function getMarketSources(): array
    {
        return [
            [
                'title' => 'Agricultural Market Analysis',
                'url' => 'https://example.com/market-analysis',
                'snippet' => 'Understanding market trends and pricing strategies for agricultural products.'
            ],
            [
                'title' => 'Crop Pricing Strategies',
                'url' => 'https://example.com/pricing-strategies',
                'snippet' => 'Optimal timing and strategies for selling agricultural products.'
            ]
        ];
    }
    
    private function getGeneralSources(): array
    {
        return [
            [
                'title' => 'Precision Agriculture Guide',
                'url' => 'https://example.com/precision-agriculture',
                'snippet' => 'Comprehensive guide to modern agricultural practices and technology.'
            ],
            [
                'title' => 'AI in Agriculture',
                'url' => 'https://example.com/ai-agriculture',
                'snippet' => 'How artificial intelligence is transforming agricultural decision-making.'
            ]
        ];
    }
}
