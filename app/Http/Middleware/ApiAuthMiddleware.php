<?php

namespace App\Http\Middleware;

use App\Traits\ResponseHandler;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiAuthMiddleware
{
    use ResponseHandler;

    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated via API guard
        if (!Auth::guard('api')->check()) {
            return $this->response(401, 'Unauthenticated', [], false);
        }

        return $next($request);
    }
}
