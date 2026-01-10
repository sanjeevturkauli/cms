<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
    public function myTeams(Request $request, $id = null)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 401,
                    'message' => 'Unauthorized. Please login first.',
                    'data' => null
                ], 401);
            }

            // If ID is provided, return specific team details
            if ($id) {
                return $this->getSpecificTeam($user, $id);
            }

            // Otherwise return all teams (existing logic)
            return $this->getAllTeams($user);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'statusCode' => 500,
                'message' => 'An error occurred while retrieving teams.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'data' => null
            ], 500);
        }
    }

    private function getSpecificTeam($user, $teamId)
    {
        // Check if user owns this team
        $ownedTeam = Team::where('id', $teamId)
            ->where('user_id', $user->id)
            ->withCount('members')
            ->with(['members.user:id,name,email,is_active', 'members.user.roles:id,name'])
            ->first();

        // Check if user is a member of this team
        $memberTeam = null;
        if (!$ownedTeam) {
            $memberRecord = Member::where('user_id', $user->id)
                ->whereHas('team', function ($query) use ($teamId) {
                    $query->where('id', $teamId);
                })
                ->with(['team.user:id,name,email', 'team.members.user:id,name,email,is_active', 'team.members.user.roles:id,name'])
                ->first();

            $memberTeam = $memberRecord ? $memberRecord->team : null;
        }

        $team = $ownedTeam ?: $memberTeam;

        if (!$team) {
            return response()->json([
                'status' => 'error',
                'statusCode' => 404,
                'message' => 'Team not found or you do not have access to this team.',
                'data' => null
            ], 404);
        }

        // Prepare detailed team information
        $teamData = [
            'id' => $team->id,
            'name' => $team->name,
            'team_id' => $team->team_id,
            'is_active' => $team->is_active,
            'members_count' => $ownedTeam ? $team->members_count : $team->members->count(),
            'role_in_team' => $ownedTeam ? 'owner' : 'member',
            'is_owner' => (bool) $ownedTeam,
            'created_at' => $team->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $team->updated_at->format('Y-m-d H:i:s'),
            'joined_at' => $ownedTeam
                ? $team->created_at->format('Y-m-d H:i:s')
                : ($memberRecord ? $memberRecord->created_at->format('Y-m-d H:i:s') : null),
            'description' => $team->description ?? null,
            'settings' => [
                'allow_member_invite' => $team->allow_member_invite ?? true,
                'is_public' => $team->is_public ?? false,
            ],
            'members' => $team->members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'user_id' => $member->user->id,
                    'name' => $member->user->name,
                    'email' => $member->user->email,
                    'is_active' => $member->user->is_active ?? true,
                    'roles' => $member->user->roles->pluck('name')->toArray(),
                    'joined_at' => $member->created_at->format('Y-m-d H:i:s'),
                    'last_activity' => $member->updated_at->format('Y-m-d H:i:s'),
                ];
            }),
            'owner' => [
                'id' => $team->user->id,
                'name' => $team->user->name,
                'email' => $team->user->email,
            ],
            'statistics' => [
                'total_members' => $team->members->count(),
                'active_members' => $team->members->filter(function ($member) {
                    return $member->user->is_active ?? true;
                })->count(),
                'inactive_members' => $team->members->filter(function ($member) {
                    return !($member->user->is_active ?? true);
                })->count(),
            ]
        ];

        return response()->json([
            'status' => 'success',
            'statusCode' => 200,
            'message' => 'Team details retrieved successfully.',
            'data' => $teamData
        ], 200);
    }

    private function getAllTeams($user)
    {
        // Get teams where user is the owner
        $ownedTeams = Team::where('user_id', $user->id)
            ->withCount('members')
            ->with(['members.user:id,name,email'])
            ->get()
            ->map(function ($team) use ($user) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'is_active' => $team->is_active,
                    'members_count' => $team->members_count,
                    'role_in_team' => 'owner',
                    'is_owner' => true,
                    'created_at' => $team->created_at->format('Y-m-d H:i:s'),
                    'joined_at' => $team->created_at->format('Y-m-d H:i:s'),
                    'members' => $team->members->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'user_id' => $member->user->id,
                            'name' => $member->user->name,
                            'email' => $member->user->email,
                            'joined_at' => $member->created_at->format('Y-m-d H:i:s'),
                        ];
                    }),
                    'owner' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ]
                ];
            });

        // Get teams where user is a member
        $memberTeams = Member::where('user_id', $user->id)
            ->with(['team.user:id,name,email', 'team.members.user:id,name,email'])
            ->get()
            ->map(function ($member) {
                $team = $member->team;
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'is_active' => $team->is_active,
                    'members_count' => $team->members->count(),
                    'role_in_team' => 'member',
                    'is_owner' => false,
                    'created_at' => $team->created_at->format('Y-m-d H:i:s'),
                    'joined_at' => $member->created_at->format('Y-m-d H:i:s'),
                    'members' => $team->members->map(function ($teamMember) {
                        return [
                            'id' => $teamMember->id,
                            'user_id' => $teamMember->user->id,
                            'name' => $teamMember->user->name,
                            'email' => $teamMember->user->email,
                            'joined_at' => $teamMember->created_at->format('Y-m-d H:i:s'),
                        ];
                    }),
                    'owner' => [
                        'id' => $team->user->id,
                        'name' => $team->user->name,
                        'email' => $team->user->email,
                    ]
                ];
            });

        // Combine both collections
        $allTeams = $ownedTeams->concat($memberTeams);
        $sortedTeams = $allTeams->sortByDesc('joined_at')->values();

        return response()->json([
            'status' => 'success',
            'statusCode' => 200,
            'message' => 'Teams retrieved successfully.',
            'data' => [
                'teams' => $sortedTeams,
                'summary' => [
                    'total_teams' => $sortedTeams->count(),
                    'owned_teams' => $ownedTeams->count(),
                    'member_teams' => $memberTeams->count(),
                    'active_teams' => $sortedTeams->where('is_active', true)->count(),
                    'inactive_teams' => $sortedTeams->where('is_active', false)->count(),
                ]
            ]
        ], 200);
    }
}
