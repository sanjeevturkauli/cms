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
 * | Public and general authenticated routes only.
 * | Role-based routes are in: admin.php, team.php, member.php
 */

// Public Routes
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/users', [UserController::class, 'index'])->name('users');
Route::get('/dashboard', [RedirectHandler::class, 'dashboard'])->name('dashboard');

// Authenticated Routes (no role restriction)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/switch/{team}', [TeamController::class, 'switchTeam'])->name('switch');
});

// Include settings routes
require __DIR__.'/settings.php';
