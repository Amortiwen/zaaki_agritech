<?php

use App\Http\Controllers\MainController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\UtilitiesService;

Route::get('/',  fn() => redirect()->route('home'));

Route::get('/select-field', function () {
    return Inertia::render('select-field');
})->name('home');

Route::get('/field-mapping/{region?}/{zone?}', function ($region = 'Tamale', $zone = 'Northern Ghana (Savannah Zone)') {
    return Inertia::render('field-mapping', [
        'region' => $region,
        'zone' => $zone
    ]);
})->name('field-mapping');

Route::get('/prediction/{submissionKey?}', [MainController::class, 'showPredictionPage'])->name('prediction');

Route::get('/current-weather', [UtilitiesService::class, 'getCurrentWeather'])->name('current-weather');
Route::get('/predict-crop-yield', [MainController::class, 'predictCropYield'])->name('predict-crop-yield');
Route::post('/fields', [MainController::class, 'storeFields'])->name('fields.store');
Route::get('/api/predictions/{submissionKey}', [MainController::class, 'getLatestPrediction'])->name('predictions.latest');
// Route::get('/api/predictions/latest', [MainController::class, 'getLatestPredictions'])->name('predictions.latest');
Route::get('/api/predictions/status/{submissionKey}', [MainController::class, 'checkPredictionStatus'])->name('predictions.status');

// AI Chatbot routes
Route::post('/api/chat', [ChatController::class, 'chat'])->name('chat')->middleware('web');

// Test route for CSRF
Route::get('/api/csrf-token', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Debug route for CSRF
Route::post('/api/debug-csrf', function (Request $request) {
    return response()->json([
        'csrf_token' => csrf_token(),
        'request_token' => $request->header('X-CSRF-TOKEN'),
        'session_token' => session()->token(),
        'valid' => $request->header('X-CSRF-TOKEN') === csrf_token()
    ]);
})->middleware('web');
