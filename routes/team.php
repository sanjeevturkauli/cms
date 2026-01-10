<?php

use App\Http\Controllers\Team\TeamController;
use App\Http\Controllers\Team\TeamInfoController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
 * |--------------------------------------------------------------------------
 * | Team Routes
 * |--------------------------------------------------------------------------
 * |
 * | Here are all the team-specific routes. These routes are loaded by the
 * | RouteServiceProvider and all of them will be assigned to the "team" middleware group.
 * | All routes here will have /team prefix and team. name prefix.
 * |
 */

// Subscription Management Routes (no subscription check needed)
Route::group(['prefix' => 'subscriptions', 'as' => 'subscriptions.'], function () {
    Route::get('/', [\App\Http\Controllers\Team\SubscriptionController::class, 'index'])->name('index');
    Route::post('/subscribe', [\App\Http\Controllers\Team\SubscriptionController::class, 'subscribe'])->name('subscribe');
    Route::patch('/{subscription}/cancel', [\App\Http\Controllers\Team\SubscriptionController::class, 'cancel'])->name('cancel');
    Route::get('/logs', [\App\Http\Controllers\Team\SubscriptionController::class, 'logs'])->name('logs');
});

// Payment Routes (no subscription check needed)
Route::group(['prefix' => 'payment', 'as' => 'payment.'], function () {
    Route::post('/initiate', [\App\Http\Controllers\Team\PaymentController::class, 'initiatePayment'])->name('initiate');
    Route::post('/callback/razorpay', [\App\Http\Controllers\Team\PaymentController::class, 'razorpayCallback'])->name('callback.razorpay');
    Route::get('/success/{transactionId}', [\App\Http\Controllers\Team\PaymentController::class, 'paymentSuccess'])->name('success');
    Route::get('/failed/{transactionId}', [\App\Http\Controllers\Team\PaymentController::class, 'paymentFailed'])->name('failed');
});

// Team Management Routes (with subscription check) - ALL OTHER ROUTES
Route::middleware('check.subscription')->group(function () {
    Route::get('/', [TeamController::class, 'index'])->middleware('permission:view teams')->name('index');
    Route::get('/dashboard', [TeamController::class, 'dashboard'])->name('dashboard');

    Route::post('/', [TeamController::class, 'store'])->middleware('permission:create teams')->name('store');

    Route::post('/join', [TeamController::class, 'join'])->middleware('permission:join teams')->name('join');

    Route::patch('/{team}/toggle-active', [TeamController::class, 'toggleActive'])->name('toggleActive');

    Route::delete('/{team}', [TeamController::class, 'destroy'])->name('destroy');

    Route::post('/switch/{team}', [TeamController::class, 'switchTeam'])->middleware('permission:switch teams')->name('switch');

    // Team Info Routes
    Route::get('/{team}/info', [TeamInfoController::class, 'show'])->name('info');
    Route::patch('/{team}/info/basic', [TeamInfoController::class, 'updateBasicInfo'])->name('updateBasicInfo');
    Route::patch('/{team}/info/location', [TeamInfoController::class, 'updateLocation'])->name('updateLocation');
    Route::patch('/{team}/info/plan', [TeamInfoController::class, 'updatePlan'])->name('updatePlan');
    Route::patch('/{team}/info/settings', [TeamInfoController::class, 'updateSettings'])->name('updateSettings');

    // Member Routes
    Route::get('/members', [TeamController::class, 'members'])->name('members');
    Route::patch('/members/{member}/toggle-status', [TeamController::class, 'toggleMemberStatus'])->name('members.toggleStatus');
    Route::delete('/members/{member}', [TeamController::class, 'removeMember'])->name('members.remove');
});
