<?php

use App\Http\Middleware\ApiAuthMiddleware;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Application;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;

use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
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

            // Settings Routes
            Route::middleware(['web', 'auth', 'verified'])
                ->group(base_path('routes/settings.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.auth' => ApiAuthMiddleware::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'check.subscription' => \App\Http\Middleware\CheckTeamSubscription::class,
        ]);

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle invalid signature exceptions
        $exceptions->render(function (\Illuminate\Routing\Exceptions\InvalidSignatureException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'This link has expired or is invalid. Please return to the teams page and try again.',
                ], 403);
            }

            return redirect()->route('team.index')
                ->with('error', 'This link has expired or is invalid. Please click on the team again to generate a new link.');
        });
    })
    ->create();
