<?php

use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Team Routes
|--------------------------------------------------------------------------
|
| Here are all the team-specific routes. These routes are loaded by the
| RouteServiceProvider and all of them will be assigned to the "team" middleware group.
| All routes here will have /team prefix and team. name prefix.
|
*/

// Team Management Routes
Route::get('/', [TeamController::class, 'index'])->middleware('permission:view teams')->name('index');

Route::post('/', [TeamController::class, 'store'])->middleware('permission:create teams')->name('store');

Route::post('/join', [TeamController::class, 'join'])->middleware('permission:join teams')->name('join');

Route::patch('/{team}/toggle-active', [TeamController::class, 'toggleActive'])->name('toggleActive');

Route::delete('/{team}', [TeamController::class, 'destroy'])->name('destroy');

Route::post('/switch/{team}', [TeamController::class, 'switchTeam'])->middleware('permission:switch teams')->name('switch');


