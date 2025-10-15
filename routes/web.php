<?php

use App\Http\Controllers\MainController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Services\UtilitiesService;

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
Route::get('/api/predictions/latest', [MainController::class, 'getLatestPredictions'])->name('predictions.latest');
Route::get('/api/predictions/status/{submissionKey}', [MainController::class, 'checkPredictionStatus'])->name('predictions.status');
