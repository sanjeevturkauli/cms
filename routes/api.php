<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MpinController;
use App\Http\Controllers\Api\TeamController;

Route::get('/test', function (Request $request) {
    return response()->json([
        'status'=>'success',
        'statusCode'=>200,
        'message'=>"API successfuly tested Latest ok."
    ]);
});

Route::get('/test-models', function () {
    try {
        $teamCount = \App\Models\Team::count();
        $teamInfoCount = \App\Models\TeamInfo::count();
        $kycCount = \App\Models\Kyc::count();
        
        return response()->json([
            'status' => 'success',
            'message' => 'Models are working correctly',
            'data' => [
                'teams' => $teamCount,
                'team_info' => $teamInfoCount,
                'kyc' => $kycCount,
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// OTP Routes
Route::post('/otp/create', [App\Http\Controllers\Api\OtpController::class, 'createOtpForUser']);
Route::post('/verify-otp', [App\Http\Controllers\Api\OtpController::class, 'verifyOtp']);

// Password Reset Routes
Route::post('/password/forgot', [App\Http\Controllers\Api\PasswordResetController::class, 'createPasswordResetForEmail']);
Route::post('/password/reset', [App\Http\Controllers\Api\PasswordResetController::class, 'resetPasswordWithToken']);

Route::prefix('user')->middleware(['api.auth'])->group(function (): void {
    Route::get('profile', [AuthController::class, 'profile']);
    Route::post('profile', [AuthController::class, 'profile']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::prefix('teams')->group(function () {
        Route::get('/my/{id?}', [TeamController::class, 'myTeams']);
    });

    Route::prefix('mpin')->group(function () {
        Route::post('/', [MpinController::class, 'store']);
        Route::put('/', [MpinController::class, 'update']);
        Route::delete('/', [MpinController::class, 'destroy']);
        Route::post('/verify', [MpinController::class, 'verify']);
    });

    // KYC Routes
    Route::prefix('kyc')->group(function () {
        Route::get('/my', [App\Http\Controllers\Api\KycController::class, 'myKyc']);
        Route::post('/', [App\Http\Controllers\Api\KycController::class, 'store']);
        Route::put('/{kyc}', [App\Http\Controllers\Api\KycController::class, 'update']);
        Route::get('/{kyc}', [App\Http\Controllers\Api\KycController::class, 'show']);
        Route::delete('/{kyc}', [App\Http\Controllers\Api\KycController::class, 'destroy']);
    });
});

// Admin/Team Management Routes
Route::prefix('admin')->middleware(['api.auth', 'role:admin|team'])->group(function () {
    // Team Info Management
    Route::apiResource('team-info', App\Http\Controllers\Api\TeamInfoController::class);
    Route::get('teams/{team}/info', [App\Http\Controllers\Api\TeamInfoController::class, 'getByTeam']);
    Route::post('teams/{team}/update-member-count', [App\Http\Controllers\Api\TeamInfoController::class, 'updateMemberCount']);
    
    // KYC Management
    Route::get('kyc', [App\Http\Controllers\Api\KycController::class, 'index']);
    Route::get('kyc/{kyc}', [App\Http\Controllers\Api\KycController::class, 'show']);
    Route::post('kyc/{kyc}/approve', [App\Http\Controllers\Api\KycController::class, 'approve']);
    Route::post('kyc/{kyc}/reject', [App\Http\Controllers\Api\KycController::class, 'reject']);
    Route::delete('kyc/{kyc}', [App\Http\Controllers\Api\KycController::class, 'destroy']);
});

