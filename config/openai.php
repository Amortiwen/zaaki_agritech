<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenAI API Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for the OpenAI API integration.
    | You can set your API key in the .env file as OPENAI_API_KEY.
    |
    */

    'api_key' => env('OPENAI_API_KEY'),
    
    'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    
    'max_tokens' => env('OPENAI_MAX_TOKENS', 1000),
    
    'temperature' => env('OPENAI_TEMPERATURE', 0.7),
    
    'timeout' => env('OPENAI_TIMEOUT', 30),
];
