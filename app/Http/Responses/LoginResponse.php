<?php

namespace App\Http\Responses;

use App\Models\Subscription;
use App\Models\Team;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function toResponse($request)
    {
        $user = Auth::user();

        // Check if user has team role
        if ($user && $user->hasRole('team')) {
            // Get user's teams
            $teams = Team::where('user_id', $user->id)->get();

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

            // If no active subscription, redirect to subscriptions page
            if (!$hasActiveSubscription) {
                return redirect()->route('team.subscriptions.index')
                    ->with('warning', 'Please subscribe to a package to access team features.');
            }
        }

        // Default redirect to dashboard
        return redirect()->intended(config('fortify.home'));
    }
}
