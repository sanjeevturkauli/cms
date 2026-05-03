<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Team;
use App\Models\Member;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function dashboard()
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // Total Revenue from payment_transactions table
        $totalRevenue = PaymentTransaction::where('status', 'completed')->sum('amount');
        $lastMonthRevenue = PaymentTransaction::where('status', 'completed')
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->sum('amount');
        $thisMonthRevenue = PaymentTransaction::where('status', 'completed')
            ->where('created_at', '>=', $thisMonthStart)->sum('amount');
        $revenueGrowth = $lastMonthRevenue > 0
            ? round((($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : ($thisMonthRevenue > 0 ? 100 : 0);

        // Total Users
        $totalUsers = User::count();
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonthStart)->count();
        $lastMonthUsers = User::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $userGrowth = $lastMonthUsers > 0
            ? round(($newUsersThisMonth / $lastMonthUsers) * 100, 1)
            : ($newUsersThisMonth > 0 ? 100 : 0);

        // Active Teams
        $activeTeams = Team::where('status', 'approved')->where('is_active', true)->count();
        $newTeamsThisMonth = Team::where('created_at', '>=', $thisMonthStart)->count();
        $lastMonthTeams = Team::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $teamGrowth = $lastMonthTeams > 0
            ? round(($newTeamsThisMonth / $lastMonthTeams) * 100, 1)
            : ($newTeamsThisMonth > 0 ? 100 : 0);

        // Active Subscriptions
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $newSubsThisMonth = Subscription::where('created_at', '>=', $thisMonthStart)->count();
        $lastMonthSubs = Subscription::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])->count();
        $subGrowth = $lastMonthSubs > 0
            ? round(($newSubsThisMonth / $lastMonthSubs) * 100, 1)
            : ($newSubsThisMonth > 0 ? 100 : 0);

        // Monthly revenue chart data (last 12 months for filter support)
        $chartData = [];
        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $startDate = $month->copy()->startOfMonth();
            $endDate = $month->copy()->endOfMonth();
            
            $revenue = PaymentTransaction::where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount');
            
            $chartData[] = [
                'date' => $month->format('Y-m-d'),
                'month' => $month->format('M Y'),
                'revenue' => (float) $revenue,
            ];
        }

        // Latest 5 Members
        $latestMembers = Member::with(['user', 'team'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->user->name,
                'email' => $m->user->email,
                'team' => $m->team->name,
                'joined_at' => $m->created_at->format('d M, Y'),
                'is_active' => $m->user->is_active ?? true,
            ]);

        // Latest 5 Teams
        $latestTeams = Team::with('user')
            ->withCount('members')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'team_id' => $t->team_id,
                'owner' => $t->user->name,
                'members_count' => $t->members_count,
                'status' => $t->status,
                'created_at' => $t->created_at->format('d M, Y'),
            ]);

        // Latest 5 Transactions (subscriptions)
        $latestTransactions = PaymentTransaction::with(['user', 'team', 'package'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($tx) => [
                'id' => $tx->id,
                'transaction_id' => $tx->transaction_id,
                'user' => $tx->user?->name ?? 'N/A',
                'team' => $tx->team?->name ?? 'N/A',
                'package' => $tx->package?->name ?? 'N/A',
                'amount' => $tx->formatted_amount,
                'status' => $tx->status,
                'status_badge' => $tx->status_badge,
                'payment_gateway' => $tx->payment_gateway,
                'created_at' => $tx->created_at->format('d M, Y H:i'),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total_revenue' => '₹' . number_format((float)$totalRevenue, 0),
                'revenue_growth' => $revenueGrowth,
                'total_users' => number_format($totalUsers),
                'user_growth' => $userGrowth,
                'active_teams' => number_format($activeTeams),
                'team_growth' => $teamGrowth,
                'active_subscriptions' => number_format($activeSubscriptions),
                'sub_growth' => $subGrowth,
            ],
            'chartData' => $chartData,
            'latestMembers' => $latestMembers,
            'latestTeams' => $latestTeams,
            'latestTransactions' => $latestTransactions,
        ]);
    }
}
