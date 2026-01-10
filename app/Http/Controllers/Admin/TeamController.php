<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function index()
    {
        $teams = Team::with(['user', 'members.user'])
            ->withCount('members')
            ->get()
            ->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'owner' => [
                        'id' => $team->user->id,
                        'name' => $team->user->name,
                        'email' => $team->user->email,
                    ],
                    'members_count' => $team->members_count,
                    'status' => $team->status,
                    'is_active' => $team->is_active,
                    'created_at' => $team->created_at->format('M d, Y'),
                    'updated_at' => $team->updated_at->format('M d, Y'),
                    'members' => $team->members->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'user_id' => $member->user->id,
                            'name' => $member->user->name,
                            'email' => $member->user->email,
                            'is_active' => $member->user->is_active,
                            'joined_at' => $member->created_at->format('M d, Y'),
                        ];
                    }),
                ];
            });

        return Inertia::render('admin/teams/index', [
            'teams' => $teams,
            'permissions' => [
                'canDeleteTeams' => true,
                'canEditTeams' => true,
                'canCreateTeams' => true,
                'canViewTeams' => true,
                'canToggleStatus' => true,
            ],
        ]);
    }
    public function update(Request $request, Team $team)
    {
        $user = Auth::user();

        if (!$user->can('edit teams') && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to edit teams.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:teams,name,' . $team->id],
            'status' => ['string', 'in:pending,approved,rejected'],
            'is_active' => ['boolean'],
        ]);

        $team->update($request->only(['name', 'status', 'is_active']));

        return redirect()->back()->with('success', "Team '{$team->name}' has been updated successfully.");
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

    public function updateStatus(Request $request, Team $team)
    {
        $user = Auth::user();

        if (!$user->can('edit teams') && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to change team status.');
        }

        $request->validate([
            'status' => ['required', 'string', 'in:pending,approved,rejected'],
        ]);

        $team->update([
            'status' => $request->status,
        ]);

        return redirect()->back()->with('success', "Team '{$team->name}' status has been updated to {$request->status}.");
    }

    public function destroy(Team $team)
    {
        $user = Auth::user();

        $hasPermission = $user->can('delete teams') || $user->hasRole('admin');

        if (!$hasPermission) {
            return redirect()->back()->with('error', 'You do not have permission to delete teams.');
        }

        // For admin, check if team owner has other teams (unless admin override)
        if (!$user->hasRole('admin')) {
            $totalTeamsOwned = Team::where('user_id', $team->user_id)->count();
            if ($totalTeamsOwned <= 1) {
                return redirect()->back()->with('error', 'Cannot delete the team owner\'s only team. They must have at least one team.');
            }
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