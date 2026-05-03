<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Team\TeamController;
use App\Http\Controllers\Member\MemberController;
use App\Http\Controllers\Member\TeamInfoController;

/*
 * |--------------------------------------------------------------------------
 * | Member Routes
 * |--------------------------------------------------------------------------
 * | Only accessible by users with 'member' role.
 * | Prefix: /member, Name prefix: member.
 */

// Member Dashboard
Route::get('/dashboard', [MemberController::class, 'dashboard'])->name('dashboard')->middleware('check.member.payment');

// Notification Routes
Route::prefix('notifications')->name('notifications.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Member\NotificationController::class, 'index'])->name('index');
    Route::get('/unread-count', [\App\Http\Controllers\Member\NotificationController::class, 'getUnreadCount'])->name('unread-count');
    Route::get('/recent', [\App\Http\Controllers\Member\NotificationController::class, 'getRecent'])->name('recent');
    Route::patch('/{notification}/read', [\App\Http\Controllers\Member\NotificationController::class, 'markAsRead'])->name('mark-read');
    Route::patch('/mark-all-read', [\App\Http\Controllers\Member\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
    Route::delete('/{notification}', [\App\Http\Controllers\Member\NotificationController::class, 'destroy'])->name('destroy');
});

// Member Teams - Show all teams where member is part of
Route::get('/teams', [MemberController::class, 'teams'])->name('teams');

// Join Team
Route::post('/join', [TeamController::class, 'join'])->middleware('permission:join teams')->name('join');

// KYC Routes for Members
Route::prefix('kyc')->name('kyc.')->group(function () {
    Route::get('/create', [\App\Http\Controllers\KycController::class, 'create'])->name('create');
    Route::post('/', [\App\Http\Controllers\KycController::class, 'store'])->name('store');
    Route::get('/', [\App\Http\Controllers\KycController::class, 'show'])->name('show');
});

// Activity Logs for Members
Route::prefix('activity-logs')->name('activity-logs.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Team\ActivityLogController::class, 'index'])->name('index');
});

// Team Info - Member can view team info (read only via signed URL)
Route::get('/team/{team}/info', [TeamInfoController::class, 'show'])->name('team.info')->middleware('signed');

// Member Payment Routes
Route::prefix('payments')->name('payments.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Member\MemberPaymentController::class, 'index'])->name('index');
    Route::patch('/{payment}/pay', [\App\Http\Controllers\Member\MemberPaymentController::class, 'markPaid'])->name('pay');

    // Payment Gateway Routes
    Route::post('/{payment}/initiate', [\App\Http\Controllers\Member\MemberPaymentGatewayController::class, 'initiate'])->name('initiate');
    Route::post('/callback/razorpay', [\App\Http\Controllers\Member\MemberPaymentGatewayController::class, 'razorpayCallback'])->name('callback.razorpay');
    Route::post('/callback/stripe', [\App\Http\Controllers\Member\MemberPaymentGatewayController::class, 'stripeCallback'])->name('callback.stripe');
});
