<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Team;
use App\Models\Subscription;

class CheckTeamSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip check for non-authenticated users
        if (!$user) {
            return $next($request);
        }

        // Skip check for admin users
        if ($user->hasRole('admin')) {
            return $next($request);
        }

        // Only check for team role users
        if ($user->hasRole('team')) {
            // Get user's teams
            $teams = Team::where('user_id', $user->id)->get();

            if ($teams->isEmpty()) {
                // No teams found, redirect to create team
                return redirect()->route('teams.index')->with('error', 'Please create a team first.');
            }

            // Check if any team has an active subscription
            $hasActiveSubscription = false;
            foreach ($teams as $team) {
                $subscription = Subscription::where('team_id', $team->id)
                    ->where('status', 'active')
                    ->first();

                if ($subscription && $subscription->is_active) {
                    $hasActiveSubscription = true;
                    break;
                }
            }

            // If no active subscription and not on subscription/payment pages, redirect
            if (!$hasActiveSubscription &&
                !$request->routeIs('team.subscriptions.*') &&
                !$request->routeIs('team.payment.*')) {
                return redirect()->route('team.subscriptions.index')->with('error', 'Please subscribe to a package to access team features.');
            }
        }

        return $next($request);
    }
}
