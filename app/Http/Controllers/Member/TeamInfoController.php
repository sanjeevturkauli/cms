<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\TeamInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TeamInfoController extends Controller
{
    public function show($encryptedTeamId)
    {
        try {
            // Decrypt the team ID
            $teamId = decrypt($encryptedTeamId);
            $team = Team::findOrFail($teamId);
        } catch (\Exception $e) {
            abort(403, 'Invalid team identifier.');
        }

        $user = Auth::user();

        // Check if user owns this team or is a member
        $isOwner = $team->user_id == $user->id;
        $isMember = $team->members()->where('user_id', $user->id)->exists();

        if (!$isOwner && !$isMember) {
            abort(403, 'You do not have access to this team.');
        }

        // Get or create team info
        $teamInfo = $team->teamInfo ?: new TeamInfo(['team_id' => $team->id]);

        // Get real member count from members table
        $actualMemberCount = $team->members()->count();

        return Inertia::render('members/team/info', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'team_id' => $team->team_id,
                'status' => $team->status,
                'is_active' => $team->is_active,
                'created_at' => $team->created_at->format('M d, Y'),
                'updated_at' => $team->updated_at->format('M d, Y H:i'),
                'encrypted_id' => $encryptedTeamId,
            ],
            'teamInfo' => [
                'id' => $teamInfo->id ?? null,
                'plan' => $teamInfo->plan,
                'duration_months' => $teamInfo->duration_months,
                'plan_start_date' => $teamInfo->plan_start_date?->format('Y-m-d'),
                'plan_end_date' => $teamInfo->plan_end_date?->format('Y-m-d'),
                'total_member_limit' => $teamInfo->total_member_limit,
                'current_members' => $actualMemberCount,  // Real count from members table
                'monthly_amount' => $teamInfo->monthly_amount,
                'total_amount' => $teamInfo->total_amount,
                'paid_members' => $teamInfo->paid_members,
                'latitude' => $teamInfo->latitude,
                'longitude' => $teamInfo->longitude,
                'location' => $teamInfo->location,
                'address' => $teamInfo->address,
                'country' => $teamInfo->country,
                'state' => $teamInfo->state,
                'city' => $teamInfo->city,
                'area' => $teamInfo->area,
                'pincode' => $teamInfo->pincode,
                'description' => $teamInfo->description,
                'category' => $teamInfo->category,
                'settings' => $teamInfo->settings,
                'is_active' => $teamInfo->is_active,
                'last_activity' => $teamInfo->last_activity?->format('M d, Y H:i'),
            ],
            'permissions' => [
                'canEdit' => $isOwner || $user->hasRole('admin'),
                'isOwner' => $isOwner,
            ],
        ]);
    }
}
