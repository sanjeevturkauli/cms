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
            return $this->response(401, 'Unauthorized. Please login first.', [], false);
        }

        // Set the authenticated user in the request for easy access
        $request->setUserResolver(function () {
            return Auth::guard('api')->user();
        });

        return $next($request);
    }
}
