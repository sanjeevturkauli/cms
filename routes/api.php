<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
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

Route::get('/test-auth', function (Request $request) {
    $user = Auth::guard('api')->user();
    
    return response()->json([
        'status' => 'success',
        'message' => 'Auth test',
        'authenticated' => Auth::guard('api')->check(),
        'user' => $user ? [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ] : null,
        'token_present' => $request->bearerToken() ? 'yes' : 'no',
        'token_preview' => $request->bearerToken() ? substr($request->bearerToken(), 0, 20) . '...' : null,
    ]);
})->middleware('api.auth');

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

Route::prefix('member')->middleware(['api.auth'])->group(function (): void {
    Route::get('profile', [AuthController::class, 'profile']);
    Route::post('profile', [AuthController::class, 'profile']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::prefix('mpin')->group(function () {
        Route::post('/', [MpinController::class, 'store']);
        Route::delete('/', [MpinController::class, 'destroy']);
        Route::post('/verify', [MpinController::class, 'verify']);
        Route::post('/update', [MpinController::class, 'update']);
    });

    // KYC Routes
    Route::prefix('kyc')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\KycController::class, 'myKyc']);
        Route::post('/', [App\Http\Controllers\Api\KycController::class, 'store']);
        Route::put('/{kyc}', [App\Http\Controllers\Api\KycController::class, 'update']);
        Route::get('/{kyc}', [App\Http\Controllers\Api\KycController::class, 'show']);
        Route::delete('/{kyc}', [App\Http\Controllers\Api\KycController::class, 'destroy']);
    });

    Route::get('/teams', [TeamController::class, 'memberTeams']);
    Route::get('/teams/{teamId}', [TeamController::class, 'getTeamData']);
    Route::get('/payment-banner', [App\Http\Controllers\Api\MemberPaymentController::class, 'getPaymentBanner']);
    Route::get('/payment-methods', [App\Http\Controllers\Api\MemberPaymentController::class, 'getPaymentMethods']);
    Route::post('/payment-initiate', [App\Http\Controllers\Api\MemberPaymentController::class, 'initiatePayment']);
    Route::post('/payment-verify', [App\Http\Controllers\Api\MemberPaymentController::class, 'verifyPayment']);
    Route::get('/transactions', [App\Http\Controllers\Api\MemberPaymentController::class, 'getTransactions']);
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

