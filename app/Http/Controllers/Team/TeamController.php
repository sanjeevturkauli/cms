<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Subscription;
use App\Models\Team;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();
        
        // Get current team
        $currentTeamId = session('current_team_id');
        $team = null;
        
        if ($currentTeamId) {
            $team = Team::where('id', $currentTeamId)
                ->where(function($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhereHas('members', fn($query) => $query->where('user_id', $user->id));
                })
                ->first();
        }
        
        if (!$team) {
            // Get first team user owns or is member of
            $team = Team::where('user_id', $user->id)
                ->where('is_active', true)
                ->first();
                
            if (!$team) {
                $team = Member::where('user_id', $user->id)
                    ->with('team')
                    ->whereHas('team', fn($q) => $q->where('is_active', true))
                    ->first()?->team;
            }
        }
        
        if (!$team) {
            return Inertia::render('teams/dashboard', [
                'stats' => [
                    'total_members' => '0',
                    'member_growth' => 0,
                    'total_payments' => '₹0',
                    'payment_growth' => 0,
                    'active_subscriptions' => '0',
                    'sub_growth' => 0,
                    'pending_kyc' => '0',
                    'kyc_growth' => 0,
                ],
                'recentMembers' => [],
                'recentTransactions' => [],
                'chartData' => [],
                'team' => null,
            ]);
        }
        
        session(['current_team_id' => $team->id]);
        
        // Calculate stats
        $totalMembers = Member::where('team_id', $team->id)->count();
        $membersLastMonth = Member::where('team_id', $team->id)
            ->where('created_at', '>=', now()->subMonth())
            ->count();
        $membersGrowth = $totalMembers > 0 ? round(($membersLastMonth / $totalMembers) * 100, 1) : 0;
        
        // Payment stats
        $totalPayments = \App\Models\MemberPayment::where('team_id', $team->id)
            ->where('status', 'paid')
            ->sum('amount');
        $paymentsLastMonth = \App\Models\MemberPayment::where('team_id', $team->id)
            ->where('status', 'paid')
            ->where('created_at', '>=', now()->subMonth())
            ->sum('amount');
        $paymentGrowth = $totalPayments > 0 ? round(($paymentsLastMonth / $totalPayments) * 100, 1) : 0;
        
        // Subscription stats
        $activeSubscriptions = \App\Models\Subscription::where('team_id', $team->id)
            ->where('status', 'active')
            ->count();
        $subsLastMonth = \App\Models\Subscription::where('team_id', $team->id)
            ->where('status', 'active')
            ->where('created_at', '>=', now()->subMonth())
            ->count();
        $subGrowth = $activeSubscriptions > 0 ? round(($subsLastMonth / $activeSubscriptions) * 100, 1) : 0;
        
        // KYC stats
        $pendingKyc = Member::where('team_id', $team->id)
            ->whereHas('user.kyc', fn($q) => $q->where('status', 'pending'))
            ->count();
        $kycLastMonth = Member::where('team_id', $team->id)
            ->whereHas('user.kyc', fn($q) => $q->where('status', 'pending')->where('created_at', '>=', now()->subMonth()))
            ->count();
        $kycGrowth = $pendingKyc > 0 ? round(($kycLastMonth / $pendingKyc) * 100, 1) : 0;
        
        // Recent members
        $recentMembers = Member::where('team_id', $team->id)
            ->with(['user'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn($member) => [
                'id' => $member->id,
                'name' => $member->user->name,
                'email' => $member->user->email,
                'joined_at' => $member->created_at->format('M d, Y'),
                'status' => $member->user->is_active ? 'Active' : 'Inactive',
            ]);
        
        // Recent transactions (only paid)
        $recentTransactions = \App\Models\MemberPayment::where('team_id', $team->id)
            ->where('status', 'paid')
            ->with(['member.user'])
            ->latest('paid_date')
            ->take(10)
            ->get()
            ->map(fn($payment) => [
                'id' => $payment->id,
                'member_name' => $payment->member->user->name,
                'amount' => '₹' . number_format($payment->amount, 2),
                'status' => ucfirst($payment->status),
                'date' => $payment->paid_date 
                    ? $payment->paid_date->format('M d, Y') 
                    : $payment->created_at->format('M d, Y'),
                'payment_method' => $payment->payment_method ?? 'N/A',
            ]);
        
        // Chart data - Last 12 months revenue
        $chartData = collect();
        for ($i = 11; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $startDate = $month->copy()->startOfMonth();
            $endDate = $month->copy()->endOfMonth();
            
            $revenue = \App\Models\MemberPayment::where('team_id', $team->id)
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
        
        return Inertia::render('teams/dashboard', [
            'stats' => [
                'total_members' => (string) $totalMembers,
                'member_growth' => $membersGrowth,
                'total_payments' => '₹' . number_format($totalPayments, 2),
                'payment_growth' => $paymentGrowth,
                'active_subscriptions' => (string) $activeSubscriptions,
                'sub_growth' => $subGrowth,
                'pending_kyc' => (string) $pendingKyc,
                'kyc_growth' => $kycGrowth,
            ],
            'recentMembers' => $recentMembers,
            'recentTransactions' => $recentTransactions,
            'chartData' => $chartData,
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'team_id' => $team->team_id,
            ],
        ]);
    }

    private function isTeamLimitReached($user): bool
    {
        $activeSubscription = \App\Models\Subscription::where('status', 'active')
            ->whereHas('team', fn($q) => $q->where('user_id', $user->id))
            ->latest()
            ->first();

        if (!$activeSubscription)
            return false;

        $teamLimit = $activeSubscription->team_limit ?? 1;
        $currentCount = Team::where('user_id', $user->id)->count();
        return $currentCount >= $teamLimit;
    }

    private function getTeamLimit($user): int
    {
        $activeSubscription = \App\Models\Subscription::where('status', 'active')
            ->whereHas('team', fn($q) => $q->where('user_id', $user->id))
            ->latest()
            ->first();

        return $activeSubscription?->team_limit ?? 1;
    }

    public function index()
    {
        $user = Auth::user();
        // Check if user is a team owner or admin
        $isTeamOwner = Team::where('user_id', $user->id)->exists();
        $isAdmin = $user->hasRole(['admin']);
        $canManageTeams = $isTeamOwner || $isAdmin;

        if ($isTeamOwner) {
            // Get all teams owned by this user
            $teams = Team::where('user_id', $user->id)
                ->withCount('members')
                ->with(['user.kyc', 'teamInfo'])
                ->get()
                ->map(function ($team) use ($user) {
                    // Count total teams owned by this user
                    $totalTeamsOwned = Team::where('user_id', $user->id)->count();

                    // Generate signed URL for team info with encrypted ID (expires in 60 minutes)
                    $encryptedId = encrypt($team->id);
                    $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                        'team.info',
                        now()->addMinutes(60),
                        ['team' => $encryptedId]
                    );

                    return [
                        'id' => $team->id,
                        'name' => $team->name,
                        'team_id' => $team->team_id,
                        'status' => $team->status,
                        'members_count' => $team->members_count,
                        'is_active' => $team->is_active,
                        'created_at' => $team->created_at->format('M d, Y'),
                        'can_be_deleted' => $totalTeamsOwned > 1 && $team->members_count == 0,
                        'total_teams_owned' => $totalTeamsOwned,
                        'signed_url' => $signedUrl,
                        'kyc_status' => $team->getOwnerKycStatus(),
                        'kyc_approved' => $team->isOwnerKycApproved(),
                        'kyc_completion' => $team->getOwnerKycCompletionPercentage(),
                        'team_info_complete' => $team->isTeamInfoComplete(),
                        'completion_message' => $team->getCompletionStatusMessage(),
                    ];
                });
        } else {
            // Get all teams this user is a member of
            $teams = Member::where('user_id', $user->id)
                ->with('team')
                ->get()
                ->map(function ($member) {
                    // Generate signed URL for team info with encrypted ID (expires in 60 minutes)
                    $encryptedId = encrypt($member->team->id);
                    $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
                        'team.info',
                        now()->addMinutes(60),
                        ['team' => $encryptedId]
                    );

                    return [
                        'id' => $member->team->id,
                        'name' => $member->team->name,
                        'team_id' => $member->team->team_id,
                        'status' => $member->team->status,
                        'is_active' => $member->team->is_active,
                        'joined_at' => $member->created_at->format('M d, Y'),
                        'can_be_deleted' => false,  // Members can't delete teams
                        'total_teams_owned' => 0,
                        'signed_url' => $signedUrl,
                    ];
                });
        }

        return Inertia::render('teams/index', [
            'teams' => $teams,
            'isTeamOwner' => $isTeamOwner,
            'canManageTeams' => $canManageTeams,
            'userRoles' => $user->roles->pluck('name')->toArray(),
            'kycApproved' => $user->kyc?->status === 'approved',
            'kycStatusValue' => $user->kyc?->status ?? 'pending',
            'teamLimitReached' => $this->isTeamLimitReached($user),
            'teamLimit' => $this->getTeamLimit($user),
            'permissions' => [
                'canDeleteTeams' => $user->can('delete teams') || $user->hasRole('admin'),
                'canEditTeams' => $user->can('edit teams') || $user->hasRole('admin'),
                'canCreateTeams' => $user->can('create teams') || $user->hasRole('admin'),
                'canViewTeams' => $user->can('view teams') || $user->hasRole('admin'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $kyc = $user->kyc;

        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:teams,name'],
        ]);

        if (!$kyc || $kyc->status !== 'approved') {
            $kycMessage = match ($kyc?->status) {
                'pending' => 'KYC verification required. Please complete your KYC before creating a team.',
                'submitted' => 'KYC is under review. Please wait for approval before creating a team.',
                'rejected' => 'KYC was rejected. Please resubmit your KYC and wait for approval.',
                default => 'KYC verification required. Please complete your KYC before creating a team.',
            };

            throw ValidationException::withMessages([
                'kyc' => [$kycMessage],
            ]);
        }

        $activeSubscription = Subscription::where('status', 'active')
            ->whereHas('team', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->latest()->first();


        if ($activeSubscription) {
            $teamLimit = $activeSubscription->team_limit ?? 1;
            $currentTeamCount = Team::where('user_id', $user->id)->count();

            if ($currentTeamCount >= $teamLimit) {
                throw ValidationException::withMessages([
                    'kyc' => ["Team limit reached. Your current subscription allows maximum {$teamLimit} team(s). You already have {$currentTeamCount} team(s). Please upgrade your subscription to create more teams."],
                ]);
            }
        }

        $team = Team::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
        ]);

        NotificationService::notifyNewTeam($team);

        return redirect()->back()->with(
            'success',
            'Team created successfully! Team Code: ' . $team->team_id
        );
    }

    public function join(Request $request)
    {
        $request->validate([
            'team_code' => [
                'required',
                'string',
                'size:8',
                function ($attribute, $value, $fail) {
                    $team = Team::where('team_id', $value)->with('teamInfo')->first();

                    if (!$team) {
                        $fail('Invalid team code. Please check the team code and try again.');
                        return;
                    }

                    if (!$team->is_active) {
                        $fail('This team is currently inactive. Please contact the team administrator.');
                        return;
                    }

                    if ($team->status !== 'approved') {
                        $statusMessage = match ($team->status) {
                            'pending' => 'This team is still pending approval. Please wait for admin approval.',
                            'rejected' => 'This team has been rejected. Please contact support for more information.',
                            default => 'This team is not available for new members at this time.',
                        };
                        $fail($statusMessage);
                        return;
                    }

                    if (!$team->canAcceptNewMembers()) {
                        $memberLimit = $team->getMemberLimit();
                        $currentCount = $team->getCurrentMemberCount();
                        $fail("This team has reached its member limit ({$currentCount}/{$memberLimit}). Please contact the team administrator to upgrade the subscription.");
                        return;
                    }
                },
            ],
        ]);

        $team = Team::where('team_id', $request->team_code)->with('teamInfo')->first();

        $existingMember = Member::where('user_id', Auth::id())
            ->where('team_id', $team->id)
            ->exists();

        if ($existingMember) {
            return redirect()->back()->with('success', 'You are already a member of this team.');
        }

        $member = Member::create([
            'user_id' => Auth::id(),
            'team_id' => $team->id,
        ]);

        NotificationService::notifyNewMember($member);

        return redirect()->back()->with('success', 'Successfully joined team: ' . $team->name);
    }

    public function toggleActive(Request $request, Team $team)
    {
        $user = Auth::user();

        if (!$user->can('toggle team status') && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to change team status.');
        }

        $team->update([
            'is_active' => !$team->is_active,
        ]);

        $status = $team->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Team '{$team->name}' has been {$status}.");
    }

    public function switchTeam(Request $request, Team $team)
    {
        $user = $request->user();

        $hasAccess = $team->user_id === $user->id ||
            $team->members()->where('user_id', $user->id)->exists();

        if (!$hasAccess) {
            return back()->with('error', 'You do not have access to this team.');
        }

        if (
            $team->user_id !== $user->id &&
            !$user->hasRole('admin') &&
            !$user->can('switch teams')
        ) {
            return back()->with(
                'error',
                'You do not have permission to switch this team.'
            );
        }

        session()->put('current_team_id', $team->id);

        return back()->with('info', "Switched to team: {$team->name}");
    }

    public function members()
    {
        $user = Auth::user();

        $isTeamOwner = Team::where('user_id', $user->id)->exists();

        if (!$isTeamOwner) {
            return redirect()->route('teams.index')->with('error', 'Only team owners can access members page.');
        }

        $currentTeamId = session('current_team_id');

        if ($currentTeamId) {
            $team = Team::where('id', $currentTeamId)
                ->where('user_id', $user->id)
                ->first();
        }

        if (!isset($team) || !$team) {
            $team = Team::where('user_id', $user->id)
                ->where('is_active', true)
                ->first();
        }

        if (!$team) {
            return redirect()->route('teams.index')->with('warning', 'Please activate a team first.');
        }

        session(['current_team_id' => $team->id]);

        $members = Member::where('team_id', $team->id)
            ->with(['user.roles'])
            ->get()
            ->map(function ($member) {
                $teamsCount = Member::where('user_id', $member->user_id)->count();

                return [
                    'id' => $member->id,
                    'user_id' => $member->user->id,
                    'name' => $member->user->name,
                    'email' => $member->user->email,
                    'roles' => $member->user->roles->pluck('name')->toArray(),
                    'is_active' => $member->user->is_active ?? true,
                    'joined_at' => $member->created_at->format('M d, Y'),
                    'teams_count' => $teamsCount,
                    'email_verified_at' => $member->user->email_verified_at,
                    'can_be_removed' => $teamsCount > 1,
                ];
            });

        $canManageMembers = $user->hasRole(['admin', 'team']) || $isTeamOwner;

        $roles = \Spatie\Permission\Models\Role::where('name', '!=', 'admin')->get(['id', 'name']);

        return Inertia::render('members/index', [
            'members' => $members,
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'team_id' => $team->team_id,
            ],
            'permissions' => [
                'canManageMembers' => $canManageMembers,
                'isTeamOwner' => $isTeamOwner,
                'userRoles' => $user->roles->pluck('name')->toArray(),
            ],
            'roles' => $roles,
        ]);
    }

    public function toggleMemberStatus(Request $request, Member $member)
    {
        $user = Auth::user();

        $isTeamOwner = Team::where('id', $member->team_id)
            ->where('user_id', $user->id)
            ->exists();

        $canManageMembers = $user->hasRole(['admin', 'team']) || $isTeamOwner;

        if (!$canManageMembers) {
            return redirect()->back()->with('error', 'You do not have permission to manage member status.');
        }

        $member->user->update([
            'is_active' => !($member->user->is_active ?? true),
        ]);

        $status = $member->user->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('info', "Member '{$member->user->name}' has been {$status}.");
    }

    public function removeMember(Request $request, Member $member)
    {
        $user = Auth::user();

        $isTeamOwner = Team::where('id', $member->team_id)
            ->where('user_id', $user->id)
            ->exists();

        $canManageMembers = $user->hasRole(['admin', 'team']) || $isTeamOwner;

        if (!$canManageMembers) {
            return redirect()->back()->with('error', 'You do not have permission to remove members.');
        }

        if ($member->user_id === $user->id) {
            return redirect()->back()->with('error', 'You cannot remove yourself from the team.');
        }

        $memberTeamsCount = Member::where('user_id', $member->user_id)->count();

        if ($memberTeamsCount <= 1) {
            return redirect()->back()->with('error', 'Cannot remove member. User must belong to at least one team. Please add them to another team first before removing from this team.');
        }

        $memberName = $member->user->name;

        $member->delete();

        return redirect()->back()->with('success', "{$memberName} has been successfully removed from the team.");
    }

    public function destroy(Team $team)
    {
        $user = Auth::user();

        $isTeamOwner = $team->user_id === $user->id;
        $hasPermission = $user->can('delete teams') || $user->hasRole('admin');

        if (!$hasPermission || !$isTeamOwner) {
            return redirect()->back()->with(
                'error',
                'You must be the team owner and have permission to delete.'
            );
        }

        $totalTeamsOwned = Team::where('user_id', $user->id)->count();
        if ($totalTeamsOwned <= 1) {
            return redirect()->back()->with('error', 'Cannot delete your only team. You must have at least one team.');
        }

        $membersCount = $team->members()->count();
        if ($membersCount > 0) {
            return redirect()->back()->with('error', "Cannot delete team '{$team->name}'. Please remove all {$membersCount} member(s) first before deleting the team.");
        }

        $teamName = $team->name;

        $team->delete();

        return redirect()->back()->with('success', "Team '{$teamName}' has been successfully deleted.");
    }
}
