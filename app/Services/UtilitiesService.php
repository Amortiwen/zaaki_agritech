<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class UtilitiesService
{
    public function getCurrentWeather(Request $request )
    {
        $validator = Validator::make($request->all(), [
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);
    
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 400);
        }
    
        $data = $validator->validated();
    
        $url = "https://api.open-meteo.com/v1/forecast";
        $params = [
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'current_weather' => true,
            'hourly' => 'temperature_2m,relative_humidity_2m,precipitation',
        ];
    
        try {
            $response = Http::withoutVerifying()->get($url, $params);

    
            if ($response->failed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch weather data',
                    'error' => $response->json(),
                ], $response->status());
            }
    
            return response()->json([
                'success' => true,
                'message' => 'Current weather fetched successfully',
                'data' => $response->json(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching weather data',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function getCurrentWeatherForOpenAi($latitude, $longitude)
    {
        return $this->getCurrentWeather(request()->merge(['latitude' => $latitude, 'longitude' => $longitude]));
    }
    
}
