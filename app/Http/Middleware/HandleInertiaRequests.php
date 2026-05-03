<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $teams = [];
        $isTeamOwner = false;
        $wallet = null;
        $kycStatus = null;

        if ($request->user()) {
            $user = $request->user();

            // Ensure user has a wallet and get wallet data
            if (!$user->wallet) {
                $user->wallet()->create(['balance' => 0.00]);
            }
            
            $wallet = [
                'balance' => $user->wallet->formatted_balance,
                'raw_balance' => $user->wallet->balance,
            ];

            // Get KYC status for header (only for team and member users)
            if ($user->hasRole('team') || $user->hasRole('member')) {
                $kycStatus = $user->getKycStatusForHeader();
            }

            // Check if user is a team owner
            $isTeamOwner = \App\Models\Team::where('user_id', $user->id)->exists();

            if ($isTeamOwner) {
                $teams = \App\Models\Team::where('user_id', $user->id)
                    ->withCount('members')
                    ->get()
                    ->map(function ($team) {
                        return [
                            'id' => $team->id,
                            'name' => $team->name,
                            'team_id' => $team->team_id,
                            'members_count' => $team->members_count,
                        ];
                    })
                    ->toArray();
            } else if ($user->hasRole('member')) {
                // Get teams where user is a member - always fresh query
                $teams = \App\Models\Member::where('user_id', $user->id)
                    ->whereHas('team') // ensure team exists
                    ->with('team')
                    ->get()
                    ->map(function ($member) {
                        return [
                            'id' => $member->team->id,
                            'name' => $member->team->name,
                            'team_id' => $member->team->team_id,
                        ];
                    })
                    ->values()
                    ->toArray();
            }

            // Auto-set currentTeamId if not set
            if (!$request->session()->get('current_team_id') && !empty($teams)) {
                $request->session()->put('current_team_id', $teams[0]['id']);
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user()?->load('roles', 'permissions'),
            ],
            'routeName' => request()->route()?->getName(),
            'teams' => $request->user() ? $teams : [],
            'isTeamOwner' => $isTeamOwner,

            'isAdmin' => $request->user() ? $request->user()->hasRole('admin') : false,
            'isMember' => $request->user() ? $request->user()->hasRole('member') : false,

            'currentTeamId' => $request->session()->get('current_team_id'),
            'wallet' => $wallet,
            'kycStatus' => $kycStatus,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notificationCount' => $request->user() ? \App\Services\NotificationService::getUnreadCount($request->user()->id) : 0,
            'siteSettings' => [
                'site_name' => \App\Models\Setting::get('site_name', config('app.name')),
                'site_description' => \App\Models\Setting::get('site_description', 'Content Management System'),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
                'stripePayment' => $request->session()->get('stripePayment'),
            ],
        ];
    }
}
