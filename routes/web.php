<?php

use App\Http\Controllers\Team\TeamController;
use App\Http\Controllers\Team\TeamInfoController;
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
});

// Include settings routes if they exist
require __DIR__.'/settings.php';