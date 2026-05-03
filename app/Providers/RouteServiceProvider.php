<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     */
    public const HOME = '/dashboard';

    /**
     * Routes are registered in bootstrap/app.php using the new Laravel 11 approach.
     * This file is kept only for the HOME constant.
     */
    public function boot(): void
    {
        // Routes are registered in bootstrap/app.php
    }
}
