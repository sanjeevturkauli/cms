<?php

use App\Http\Controllers\Team\TeamController;
use App\Http\Controllers\RedirectHandler;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
 * |--------------------------------------------------------------------------
 * | Web Routes
 * |--------------------------------------------------------------------------
 * |
 * | Here is where you can register web routes for your application. These
 * | routes are loaded by the RouteServiceProvider and all of them will
 * | be assigned to the "web" middleware group. Make something great!
 * |
 */

// Public Routes
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/users', [UserController::class, 'index'])->name('users');
Route::get('/dashboard', [RedirectHandler::class, 'dashboard'])->name('dashboard');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Main Dashboard
    // Route::get('/dashboard', function () {
    //     return Inertia::render('dashboard');
    // })->name('dashboard');

    // Basic Team Routes (accessible to all authenticated users)
    // Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');
    // Route::get('/teams/{team}/info', [TeamInfoController::class, 'show'])->name('teams.info');
    // Route::patch('/teams/{team}/info/basic', [TeamInfoController::class, 'updateBasicInfo'])->name('teams.updateBasicInfo');
    // Route::patch('/teams/{team}/info/location', [TeamInfoController::class, 'updateLocation'])->name('teams.updateLocation');
    // Route::patch('/teams/{team}/info/plan', [TeamInfoController::class, 'updatePlan'])->name('teams.updatePlan');
    // Route::patch('/teams/{team}/info/settings', [TeamInfoController::class, 'updateSettings'])->name('teams.updateSettings');
    // Route::post('/teams', [TeamController::class, 'store'])->name('teams.store');
    // Route::post('/teams/join', [TeamController::class, 'join'])->name('teams.join');
    // Route::patch('/teams/{team}/toggle-active', [TeamController::class, 'toggleActive'])->name('teams.toggleActive');
    // Route::post('/teams/switch/{team}', [TeamController::class, 'switchTeam'])->name('teams.switch');

    // Basic Member Routes (accessible to all authenticated users)
    // Route::get('/members', [TeamController::class, 'members'])->name('teams.members');
    // Route::patch('/members/{member}/toggle-status', [TeamController::class, 'toggleMemberStatus'])->name('members.toggleStatus');
    // Route::delete('/members/{member}', [TeamController::class, 'removeMember'])->name('members.remove');

    Route::post('/switch/{team}', [TeamController::class, 'switchTeam'])->name('switch');
    
    // Role-based Notification Routes
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('index');
            Route::get('/unread-count', [\App\Http\Controllers\Admin\NotificationController::class, 'getUnreadCount'])->name('unread-count');
            Route::get('/recent', [\App\Http\Controllers\Admin\NotificationController::class, 'getRecent'])->name('recent');
            Route::patch('/{notification}/read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAsRead'])->name('mark-read');
            Route::patch('/mark-all-read', [\App\Http\Controllers\Admin\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
            Route::delete('/{notification}', [\App\Http\Controllers\Admin\NotificationController::class, 'destroy'])->name('destroy');
        });
    });

    Route::middleware(['role:team'])->prefix('team')->name('team.')->group(function () {
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Team\NotificationController::class, 'index'])->name('index');
            Route::get('/unread-count', [\App\Http\Controllers\Team\NotificationController::class, 'getUnreadCount'])->name('unread-count');
            Route::get('/recent', [\App\Http\Controllers\Team\NotificationController::class, 'getRecent'])->name('recent');
            Route::patch('/{notification}/read', [\App\Http\Controllers\Team\NotificationController::class, 'markAsRead'])->name('mark-read');
            Route::patch('/mark-all-read', [\App\Http\Controllers\Team\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
            Route::delete('/{notification}', [\App\Http\Controllers\Team\NotificationController::class, 'destroy'])->name('destroy');
        });
    });

    Route::middleware(['role:member'])->prefix('member')->name('member.')->group(function () {
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Member\NotificationController::class, 'index'])->name('index');
            Route::get('/unread-count', [\App\Http\Controllers\Member\NotificationController::class, 'getUnreadCount'])->name('unread-count');
            Route::get('/recent', [\App\Http\Controllers\Member\NotificationController::class, 'getRecent'])->name('recent');
            Route::patch('/{notification}/read', [\App\Http\Controllers\Member\NotificationController::class, 'markAsRead'])->name('mark-read');
            Route::patch('/mark-all-read', [\App\Http\Controllers\Member\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
            Route::delete('/{notification}', [\App\Http\Controllers\Member\NotificationController::class, 'destroy'])->name('destroy');
        });
    });
    
    // Test route to create sample notifications (remove in production)
    Route::get('/test-notifications', function () {
        $user = Auth::user();
        
        // Create a test new member notification
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'type' => 'new_member',
            'title' => 'New Member Joined',
            'message' => 'John Doe has joined your team "Development Team"',
            'data' => [
                'member_name' => 'John Doe',
                'member_email' => 'john@example.com',
                'team_name' => 'Development Team',
            ],
        ]);
        
        // Create a test new team notification
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'type' => 'new_team',
            'title' => 'New Team Registration',
            'message' => 'Jane Smith has registered a new team "Marketing Team"',
            'data' => [
                'team_name' => 'Marketing Team',
                'team_owner_name' => 'Jane Smith',
                'team_owner_email' => 'jane@example.com',
            ],
        ]);
        
        return redirect()->back()->with('success', 'Test notifications created!');
    })->name('test-notifications');
});

// Include settings routes if they exist
require __DIR__.'/settings.php';