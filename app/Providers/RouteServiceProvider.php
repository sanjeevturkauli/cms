<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        $this->routes(function () {
            // API Routes
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Web Routes (Public and Auth)
            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            // Admin Routes - Only for admin role
            Route::middleware(['web', 'auth', 'verified', 'role:admin'])
                ->prefix('admin')
                ->name('admin.')
                ->group(base_path('routes/admin.php'));

            // Team Routes - For team role and above
            Route::middleware(['web', 'auth', 'verified', 'role:team|admin'])
                ->prefix('team')
                ->name('team.')
                ->group(base_path('routes/team.php'));

            // Member Routes - For member role and above
            Route::middleware(['web', 'auth', 'verified', 'role:member|team|admin'])
                ->prefix('member')
                ->name('member.')
                ->group(base_path('routes/member.php'));

            // Console Routes (if needed)
            if (file_exists(base_path('routes/console.php'))) {
                Route::middleware('web')
                    ->prefix('console')
                    ->name('console.')
                    ->group(base_path('routes/console.php'));
            }

            // Settings Routes (if needed)
            if (file_exists(base_path('routes/settings.php'))) {
                Route::middleware(['web', 'auth', 'verified'])
                    ->prefix('settings')
                    ->name('settings.')
                    ->group(base_path('routes/settings.php'));
            }
        });
    }
}
