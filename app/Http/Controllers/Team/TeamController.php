<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('teams/dashboard');
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
                ->get()
                ->map(function ($team) use ($user) {
                    // Count total teams owned by this user
                    $totalTeamsOwned = Team::where('user_id', $user->id)->count();

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
                    ];
                });
        } else {
            // Get all teams this user is a member of
            $teams = Member::where('user_id', $user->id)
                ->with('team')
                ->get()
                ->map(function ($member) {
                    return [
                        'id' => $member->team->id,
                        'name' => $member->team->name,
                        'team_id' => $member->team->team_id,
                        'status' => $member->team->status,
                        'is_active' => $member->team->is_active,
                        'joined_at' => $member->created_at->format('M d, Y'),
                        'can_be_deleted' => false, // Members can't delete teams
                        'total_teams_owned' => 0,
                    ];
                });
        }

        return Inertia::render('teams/index', [
            'teams' => $teams,
            'isTeamOwner' => $isTeamOwner,
            'canManageTeams' => $canManageTeams,
            'userRoles' => $user->roles->pluck('name')->toArray(),
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
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:teams,name'],
        ]);

        $team = Team::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
        ]);

        return redirect()->back()->with(
            'success',
            'Team created successfully! Team Code: ' . $team->team_id
        );
    }

    public function join(Request $request)
    {
        $request->validate([
            'team_code' => ['required', 'string', 'size:8', 'exists:teams,team_id'],
        ]);

        $team = Team::where('team_id', $request->team_code)->first();

        // Check if user is already a member
        $existingMember = Member::where('user_id', Auth::id())
            ->where('team_id', $team->id)
            ->exists();

        if ($existingMember) {
            return redirect()->back()->with('success', 'You are already a member of this team.');
        }

        Member::create([
            'user_id' => Auth::id(),
            'team_id' => $team->id,
        ]);

        return redirect()->back()->with('success', 'Successfully joined team: ' . $team->name);
    }

    public function toggleActive(Request $request, Team $team)
    {
        $user = Auth::user();

        // Check if user has permission to toggle team status
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
        $user = Auth::user();

        // Check if user owns this team or is a member
        $isOwner = $team->user_id === $user->id;
        $isMember = Member::where('user_id', $user->id)
            ->where('team_id', $team->id)
            ->exists();

        if (!$isOwner && !$isMember) {
            return redirect()->back()->with('error', 'You do not have access to this team.');
        }

        // Store selected team in session
        session(['current_team_id' => $team->id]);

        return redirect()->back()->with('info', "Switched to team: {$team->name}");
    }

    public function members()
    {
        $user = Auth::user();

        // Check if user is a team owner
        $isTeamOwner = Team::where('user_id', $user->id)->exists();

        if (!$isTeamOwner) {
            return redirect()->route('teams.index')->with('error', 'Only team owners can access members page.');
        }

        // Get current selected team from session or first active team
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

        // Store current team in session
        session(['current_team_id' => $team->id]);

        // Get all members of the team
        $members = Member::where('team_id', $team->id)
            ->with(['user.roles'])
            ->get()
            ->map(function ($member) {
                // Count how many teams this member belongs to
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

        // Check current user permissions
        $canManageMembers = $user->hasRole(['admin', 'team']) || $isTeamOwner;

        // Get all available roles for filtering
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

        // Check if user has permission to manage members
        $isTeamOwner = Team::where('id', $member->team_id)
            ->where('user_id', $user->id)
            ->exists();

        $canManageMembers = $user->hasRole(['admin', 'team']) || $isTeamOwner;

        if (!$canManageMembers) {
            return redirect()->back()->with('error', 'You do not have permission to manage member status.');
        }

        // Update user's is_active status
        $member->user->update([
            'is_active' => !($member->user->is_active ?? true),
        ]);

        $status = $member->user->is_active ? 'activated' : 'deactivated';
        return redirect()->back()->with('info', "Member '{$member->user->name}' has been {$status}.");
    }

    public function removeMember(Request $request, Member $member)
    {
        $user = Auth::user();

        // Check if user has permission to manage members
        $isTeamOwner = Team::where('id', $member->team_id)
            ->where('user_id', $user->id)
            ->exists();

        $canManageMembers = $user->hasRole(['admin', 'team']) || $isTeamOwner;

        if (!$canManageMembers) {
            return redirect()->back()->with('error', 'You do not have permission to remove members.');
        }

        // Prevent team owner from removing themselves if they are also a member
        if ($member->user_id === $user->id) {
            return redirect()->back()->with('error', 'You cannot remove yourself from the team.');
        }

        // Check if member belongs to other teams
        $memberTeamsCount = Member::where('user_id', $member->user_id)->count();

        if ($memberTeamsCount <= 1) {
            return redirect()->back()->with('error', 'Cannot remove member. User must belong to at least one team. Please add them to another team first before removing from this team.');
        }

        $memberName = $member->user->name;

        // Delete the member record
        $member->delete();

        return redirect()->back()->with('success', "{$memberName} has been successfully removed from the team.");
    }

    public function destroy(Team $team)
    {
        $user = Auth::user();

        // Check if user has permission to delete teams
        $isTeamOwner = $team->user_id === $user->id;
        $hasPermission = $user->can('delete teams') || $user->hasRole('admin');

        if (!$hasPermission || !$isTeamOwner) {
            return redirect()->back()->with(
                'error',
                'You must be the team owner and have permission to delete.'
            );
        }

        // Check if this is the user's only team
        $totalTeamsOwned = Team::where('user_id', $user->id)->count();
        if ($totalTeamsOwned <= 1) {
            return redirect()->back()->with('error', 'Cannot delete your only team. You must have at least one team.');
        }

        // Prevent deletion if team has members
        $membersCount = $team->members()->count();
        if ($membersCount > 0) {
            return redirect()->back()->with('error', "Cannot delete team '{$team->name}'. Please remove all {$membersCount} member(s) first before deleting the team.");
        }

        $teamName = $team->name;

        // Delete the team (this will also cascade delete related records if configured)
        $team->delete();

        return redirect()->back()->with('success', "Team '{$teamName}' has been successfully deleted.");
    }
}
