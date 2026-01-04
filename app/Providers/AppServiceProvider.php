<?php

namespace App\Providers;

use Inertia\Inertia;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Inertia::share([
            'auth' => fn() => auth()->check() ? [
                'user' => [
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'roles' => auth()->user()->roles->pluck('name'),
                ],
            ] : null,
        ]);
    }
}
