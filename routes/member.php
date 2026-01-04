<?php

use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Member Routes
|--------------------------------------------------------------------------
|
| Here are all the member-specific routes. These routes are loaded by the
| RouteServiceProvider and all of them will be assigned to the "member" middleware group.
| All routes here will have /member prefix and member. name prefix.
|
*/

// Member Management Routes
Route::get('/', [TeamController::class, 'members'])->middleware('permission:view members')
->name('index');

Route::patch('/{member}/toggle-status', [TeamController::class, 'toggleMemberStatus'])
    ->middleware('permission:edit members')
    ->name('toggleStatus');

Route::delete('/{member}', [TeamController::class, 'removeMember'])
    ->middleware('permission:delete members')
    ->name('remove');

// Member Dashboard
Route::get('/dashboard', function () {
    return inertia('member/dashboard');
})->name('dashboard');
