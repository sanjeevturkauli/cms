<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\RolePermissionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'dashboard'])->name('dashboard');

    // User Management Routes
    Route::group(['prefix' => 'users', 'as' => 'users.'], function () {
        Route::get('/', [RolePermissionController::class, 'users'])->middleware('permission:view users')->name('index');
        Route::patch('/{user}/toggle-status', [RolePermissionController::class, 'toggleUserStatus'])->middleware('permission:edit users')->name('toggle-status');
        Route::patch('/{user}', [RolePermissionController::class, 'updateUser'])->middleware('permission:edit users')->name('update');
        Route::delete('/{user}', [RolePermissionController::class, 'deleteUser'])->middleware('permission:delete users')->name('delete');
        Route::post('/{user}/assign-role', [RolePermissionController::class, 'assignRole'])->middleware('permission:assign roles')->name('assign-role');
        Route::delete('/{user}/remove-role', [RolePermissionController::class, 'removeRole'])->middleware('permission:assign roles')->name('remove-role');
        Route::post('/{user}/assign-permission', [RolePermissionController::class, 'assignPermission'])->middleware('permission:assign permissions')->name('assign-permission');
        Route::delete('/{user}/remove-permission', [RolePermissionController::class, 'removePermission'])->middleware('permission:assign permissions')->name('remove-permission');
    });

    // Role Management Routes
    Route::group(['prefix' => 'roles', 'as' => 'roles.'], function () {
        Route::get('/', [RolePermissionController::class, 'roles'])->middleware('permission:view roles')->name('index');
        Route::post('/', [RolePermissionController::class, 'storeRole'])->middleware('permission:create roles')->name('store');
        Route::put('/{role}', [RolePermissionController::class, 'updateRole'])->middleware('permission:edit roles')->name('update');
        Route::delete('/{role}', [RolePermissionController::class, 'deleteRole'])->middleware('permission:delete roles')->name('delete');
    });

    // Permission Management Routes
    Route::group(['prefix' => 'permissions', 'as' => 'permissions.'], function () {
        Route::get('/', [RolePermissionController::class, 'permissions'])->middleware('permission:view permissions')->name('index');
        Route::post('/', [RolePermissionController::class, 'storePermission'])->middleware('permission:create permissions')->name('store');
        Route::put('/{permission}', [RolePermissionController::class, 'updatePermission'])->middleware('permission:edit permissions')->name('update');
        Route::delete('/{permission}', [RolePermissionController::class, 'deletePermission'])->middleware('permission:delete permissions')->name('delete');
    });

    // Team Management Routes (Admin can manage all teams)
    Route::group(['prefix' => 'teams', 'as' => 'teams.'], function () {
        Route::get('/', [\App\Http\Controllers\Admin\TeamController::class, 'index'])->middleware('permission:view teams')->name('index');
        Route::post('/', [\App\Http\Controllers\Admin\TeamController::class, 'store'])->middleware('permission:create teams')->name('store');
        Route::patch('/{team}', [\App\Http\Controllers\Admin\TeamController::class, 'update'])->middleware('permission:edit teams')->name('update');
        Route::patch('/{team}/toggle-active', [\App\Http\Controllers\Admin\TeamController::class, 'toggleActive'])->middleware('permission:edit teams')->name('toggleActive');
        Route::patch('/{team}/status', [\App\Http\Controllers\Admin\TeamController::class, 'updateStatus'])->middleware('permission:edit teams')->name('updateStatus');
        Route::delete('/{team}', [\App\Http\Controllers\Admin\TeamController::class, 'destroy'])->middleware('permission:delete teams')->name('destroy');
    });

    // Package Management Routes (Admin only)
    Route::group(['prefix' => 'packages', 'as' => 'packages.'], function () {
        Route::get('/', [\App\Http\Controllers\Admin\PackageController::class, 'index'])->middleware('role:admin')->name('index');
        Route::post('/', [\App\Http\Controllers\Admin\PackageController::class, 'store'])->middleware('role:admin')->name('store');
        Route::patch('/{package}', [\App\Http\Controllers\Admin\PackageController::class, 'update'])->middleware('role:admin')->name('update');
        Route::patch('/{package}/toggle-active', [\App\Http\Controllers\Admin\PackageController::class, 'toggleActive'])->middleware('role:admin')->name('toggleActive');
        Route::delete('/{package}', [\App\Http\Controllers\Admin\PackageController::class, 'destroy'])->middleware('role:admin')->name('destroy');
    });

    // Settings Management Routes (Admin only)
    Route::group(['prefix' => 'settings', 'as' => 'settings.'], function () {
        Route::get('/', [\App\Http\Controllers\Admin\SettingController::class, 'index'])->middleware('role:admin')->name('index');
        Route::post('/update', [\App\Http\Controllers\Admin\SettingController::class, 'update'])->middleware('role:admin')->name('update');
    });

    // Transaction Management Routes (Admin only)
    Route::group(['prefix' => 'transactions', 'as' => 'transactions.'], function () {
        Route::get('/', [\App\Http\Controllers\Admin\TransactionController::class, 'index'])->middleware('role:admin')->name('index');
        Route::get('/{transaction}', [\App\Http\Controllers\Admin\TransactionController::class, 'show'])->middleware('role:admin')->name('show');
    });
});
