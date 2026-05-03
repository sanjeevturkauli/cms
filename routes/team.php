<?php

use App\Http\Controllers\Team\TeamController;
use App\Http\Controllers\Team\TeamInfoController;
use Illuminate\Support\Facades\Route;

/*
 * |--------------------------------------------------------------------------
 * | Team Routes
 * |--------------------------------------------------------------------------
 * | Only accessible by users with 'team' role.
 * | Prefix: /team, Name prefix: team.
 */

// Notification Routes
Route::prefix('notifications')->name('notifications.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Team\NotificationController::class, 'index'])->name('index');
    Route::get('/unread-count', [\App\Http\Controllers\Team\NotificationController::class, 'getUnreadCount'])->name('unread-count');
    Route::get('/recent', [\App\Http\Controllers\Team\NotificationController::class, 'getRecent'])->name('recent');
    Route::patch('/{notification}/read', [\App\Http\Controllers\Team\NotificationController::class, 'markAsRead'])->name('mark-read');
    Route::patch('/mark-all-read', [\App\Http\Controllers\Team\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
    Route::delete('/{notification}', [\App\Http\Controllers\Team\NotificationController::class, 'destroy'])->name('destroy');
});

// Subscription Routes
Route::prefix('subscriptions')->name('subscriptions.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Team\SubscriptionController::class, 'index'])->name('index');
    Route::get('/history', [\App\Http\Controllers\Team\SubscriptionController::class, 'history'])->name('history');
    Route::post('/subscribe', [\App\Http\Controllers\Team\SubscriptionController::class, 'subscribe'])->name('subscribe');
    Route::patch('/{subscription}/cancel', [\App\Http\Controllers\Team\SubscriptionController::class, 'cancel'])->name('cancel');
    Route::get('/logs', [\App\Http\Controllers\Team\SubscriptionController::class, 'logs'])->name('logs');
});

// Payment Routes
Route::prefix('payment')->name('payment.')->group(function () {
    Route::post('/initiate', [\App\Http\Controllers\Team\PaymentController::class, 'initiatePayment'])->name('initiate');
    Route::post('/callback/razorpay', [\App\Http\Controllers\Team\PaymentController::class, 'razorpayCallback'])->name('callback.razorpay');
    Route::post('/callback/stripe', [\App\Http\Controllers\Team\PaymentController::class, 'stripeCallback'])->name('callback.stripe');
    Route::get('/success/{transactionId}', [\App\Http\Controllers\Team\PaymentController::class, 'paymentSuccess'])->name('success');
    Route::get('/failed/{transactionId}', [\App\Http\Controllers\Team\PaymentController::class, 'paymentFailed'])->name('failed');
});

// KYC Routes
Route::prefix('kyc')->name('kyc.')->group(function () {
    Route::get('/create', [\App\Http\Controllers\KycController::class, 'create'])->name('create');
    Route::post('/', [\App\Http\Controllers\KycController::class, 'store'])->name('store');
    Route::get('/', [\App\Http\Controllers\KycController::class, 'show'])->name('show');
});

// Activity Logs Routes
Route::prefix('activity-logs')->name('activity-logs.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Team\ActivityLogController::class, 'index'])->name('index');
});

// Team Info Routes
Route::get('/{team}/info', [TeamInfoController::class, 'show'])->name('info')->middleware('signed');
Route::patch('/{team}/info/basic', [TeamInfoController::class, 'updateBasicInfo'])->name('updateBasicInfo');
Route::patch('/{team}/info/location', [TeamInfoController::class, 'updateLocation'])->name('updateLocation');
Route::patch('/{team}/info/plan', [TeamInfoController::class, 'updatePlan'])->name('updatePlan');
Route::patch('/{team}/info/settings', [TeamInfoController::class, 'updateSettings'])->name('updateSettings');

// Team Management Routes (with subscription check)
Route::middleware('check.subscription')->group(function () {
    Route::get('/', [TeamController::class, 'index'])->middleware('permission:view teams')->name('index');
    Route::get('/dashboard', [TeamController::class, 'dashboard'])->name('dashboard');
    Route::post('/', [TeamController::class, 'store'])->middleware('permission:create teams')->name('store');
    Route::patch('/{team}/toggle-active', [TeamController::class, 'toggleActive'])->name('toggleActive');
    Route::delete('/{team}', [TeamController::class, 'destroy'])->name('destroy');

    // Members Management
    Route::get('/members', [TeamController::class, 'members'])->name('members');
    Route::patch('/members/{member}/toggle-status', [TeamController::class, 'toggleMemberStatus'])->name('members.toggleStatus');
    Route::delete('/members/{member}', [TeamController::class, 'removeMember'])->name('members.remove');
});
