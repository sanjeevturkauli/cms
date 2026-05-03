<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();
        
        // Get all teams where user is a member
        $members = Member::where('user_id', $user->id)->with('team')->get();
        $teamIds = $members->pluck('team_id');
        
        // Get current team from session
        $currentTeamId = session('current_team_id');
        
        // Validate that current team is one user belongs to
        if ($currentTeamId && !$teamIds->contains($currentTeamId)) {
            $currentTeamId = null;
        }
        
        // If no current team or invalid, set first team as current
        if (!$currentTeamId && $teamIds->isNotEmpty()) {
            $currentTeamId = $teamIds->first();
            session(['current_team_id' => $currentTeamId]);
        }
        
        // Get current team details
        $currentTeam = null;
        if ($currentTeamId) {
            $currentTeam = $members->firstWhere('team_id', $currentTeamId)?->team;
        }
        
        // Total teams user is part of
        $totalTeams = $members->count();
        
        // Calculate stats for current team
        if ($currentTeamId) {
            // Total payments made by this user for current team
            $totalPayments = \App\Models\MemberPayment::where('user_id', $user->id)
                ->where('team_id', $currentTeamId)
                ->where('status', 'paid')
                ->sum('amount');
            
            // Payments last month for current team
            $paymentsLastMonth = \App\Models\MemberPayment::where('user_id', $user->id)
                ->where('team_id', $currentTeamId)
                ->where('status', 'paid')
                ->whereNotNull('paid_date')
                ->where('paid_date', '>=', now()->subMonth())
                ->sum('amount');
            
            // Calculate payment growth percentage
            $paymentGrowth = $totalPayments > 0 ? round(($paymentsLastMonth / $totalPayments) * 100, 1) : 0;
            
            // Active subscriptions for current team
            $activeSubscriptions = \App\Models\Subscription::where('team_id', $currentTeamId)
                ->where('status', 'active')
                ->count();
            
            // Pending payments count for current team
            $pendingPayments = \App\Models\MemberPayment::where('user_id', $user->id)
                ->where('team_id', $currentTeamId)
                ->where('status', 'pending')
                ->count();
            
            // Chart data - User's payment history for current team (last 12 months)
            $chartData = collect();
            for ($i = 11; $i >= 0; $i--) {
                $month = now()->subMonths($i);
                $startDate = $month->copy()->startOfMonth();
                $endDate = $month->copy()->endOfMonth();
                
                $revenue = \App\Models\MemberPayment::where('user_id', $user->id)
                    ->where('team_id', $currentTeamId)
                    ->where('status', 'paid')
                    ->whereNotNull('paid_date')
                    ->whereBetween('paid_date', [$startDate, $endDate])
                    ->sum('amount');
                
                $chartData->push([
                    'month' => $month->format('M Y'),
                    'date' => $month->format('Y-m-d'),
                    'revenue' => (float) $revenue,
                ]);
            }
            
            // Get recent transactions for current team (last 5)
            $recentTransactions = \App\Models\MemberPayment::where('user_id', $user->id)
                ->where('team_id', $currentTeamId)
                ->with(['team:id,name'])
                ->latest('created_at')
                ->take(5)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'team_name' => $payment->team->name ?? 'N/A',
                        'amount' => '₹' . number_format($payment->amount, 2),
                        'status' => ucfirst($payment->status),
                        'date' => $payment->paid_date 
                            ? \Carbon\Carbon::parse($payment->paid_date)->format('M d, Y')
                            : \Carbon\Carbon::parse($payment->created_at)->format('M d, Y'),
                        'payment_method' => ucfirst($payment->payment_method ?? 'N/A'),
                    ];
                });
        } else {
            // No team - show zeros
            $totalPayments = 0;
            $paymentGrowth = 0;
            $activeSubscriptions = 0;
            $pendingPayments = 0;
            $chartData = collect();
            $recentTransactions = collect();
        }
        
        return Inertia::render('members/dashboard', [
            'stats' => [
                'total_members' => (string) $totalTeams,
                'member_growth' => 0,
                'total_payments' => '₹' . number_format($totalPayments, 2),
                'payment_growth' => $paymentGrowth,
                'active_subscriptions' => (string) $activeSubscriptions,
                'sub_growth' => 0,
                'pending_kyc' => (string) $pendingPayments,
                'kyc_growth' => 0,
            ],
            'chartData' => $chartData,
            'recentTransactions' => $recentTransactions,
            'currentTeam' => $currentTeam ? [
                'id' => $currentTeam->id,
                'name' => $currentTeam->name,
                'team_id' => $currentTeam->team_id,
            ] : null,
        ]);
    }

    public function teams(Request $request)
    {
        $user = Auth::user();

        // Get search and filter parameters
        $search = $request->input('search', '');
        $status = $request->input('status', '');
        $isActive = $request->input('is_active', '');

        // Get all teams where user is a member
        $query = Member::where('user_id', $user->id)
            ->with(['team' => function ($query) {
                $query->withCount('members');
            }]);

        // Apply filters
        if ($search) {
            $query->whereHas('team', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('team_id', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->whereHas('team', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        if ($isActive !== '' && $isActive !== 'all') {
            $query->whereHas('team', function ($q) use ($isActive) {
                $q->where('is_active', $isActive);
            });
        }

        $members = $query->latest()->paginate(20);

        $teams = $members->map(function ($member) {
            // Generate signed URL for team info with encrypted ID (expires in 60 minutes)
            $encryptedId = encrypt($member->team->id);
            $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                'member.team.info',
                now()->addMinutes(60),
                ['team' => $encryptedId]
            );

            return [
                'id' => $member->team->id,
                'name' => $member->team->name,
                'team_id' => $member->team->team_id,
                'status' => $member->team->status,
                'is_active' => $member->team->is_active,
                'members_count' => $member->team->members_count,
                'joined_at' => $member->created_at->format('M d, Y'),
                'created_at' => $member->team->created_at->format('M d, Y'),
                'signed_url' => $signedUrl,
            ];
        });

        return Inertia::render('members/teams', [
            'memberTeams' => [
                'data' => $teams,
                'current_page' => $members->currentPage(),
                'last_page' => $members->lastPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'from' => $members->firstItem(),
                'to' => $members->lastItem(),
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'is_active' => $isActive,
            ],
        ]);
    }
}
