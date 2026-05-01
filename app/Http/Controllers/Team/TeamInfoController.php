<?php

namespace App\Http\Controllers\Team;

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

        return Inertia::render('teams/info', [
            'team' => [
                'id' => $team->id,
                'name' => $team->name,
                'team_id' => $team->team_id,
                'status' => $team->status,
                'is_active' => $team->is_active,
                'created_at' => $team->created_at->format('M d, Y'),
                'encrypted_id' => $encryptedTeamId, // Pass encrypted ID to frontend
            ],
            'teamInfo' => [
                'id' => $teamInfo->id ?? null,
                'plan' => $teamInfo->plan,
                'duration_months' => $teamInfo->duration_months,
                'plan_start_date' => $teamInfo->plan_start_date?->format('Y-m-d'),
                'plan_end_date' => $teamInfo->plan_end_date?->format('Y-m-d'),
                'total_member_limit' => $teamInfo->total_member_limit,
                'current_members' => $teamInfo->current_members,
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
    public function updateBasicInfo(Request $request, $encryptedTeamId)
    {
        try {
            $teamId = decrypt($encryptedTeamId);
            $team = Team::findOrFail($teamId);
        } catch (\Exception $e) {
            abort(403, 'Invalid team identifier.');
        }

        $user = Auth::user();
        $isOwner = $team->user_id === $user->id;

        if (!$isOwner && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to update team info.');
        }

        $request->validate([
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $teamInfo = $team->teamInfo ?: $team->teamInfo()->create(['team_id' => $team->id]);
        
        $teamInfo->update($request->only(['description', 'category']));

        return redirect()->back()->with('success', 'Basic information updated successfully.');
    }

    public function updateLocation(Request $request, $encryptedTeamId)
    {
        try {
            $teamId = decrypt($encryptedTeamId);
            $team = Team::findOrFail($teamId);
        } catch (\Exception $e) {
            abort(403, 'Invalid team identifier.');
        }

        $user = Auth::user();
        $isOwner = $team->user_id === $user->id;

        if (!$isOwner && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to update team location.');
        }

        $request->validate([
            'address' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $teamInfo = $team->teamInfo ?: $team->teamInfo()->create(['team_id' => $team->id]);
        
        $teamInfo->update($request->only([
            'address', 'country', 'state', 'city', 'area', 'pincode', 
            'latitude', 'longitude', 'location'
        ]));

        return redirect()->back()->with('success', 'Location information updated successfully.');
    }

    public function updatePlan(Request $request, $encryptedTeamId)
    {
        try {
            $teamId = decrypt($encryptedTeamId);
            $team = Team::findOrFail($teamId);
        } catch (\Exception $e) {
            abort(403, 'Invalid team identifier.');
        }

        $user = Auth::user();
        $isOwner = $team->user_id === $user->id;

        if (!$isOwner && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to update team plan.');
        }

        $request->validate([
            'plan' => ['nullable', 'string', 'max:100'],
            'duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'plan_start_date' => ['nullable', 'date'],
            'plan_end_date' => ['nullable', 'date', 'after:plan_start_date'],
            'total_member_limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'monthly_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $teamInfo = $team->teamInfo ?: $team->teamInfo()->create(['team_id' => $team->id]);
        
        $teamInfo->update($request->only([
            'plan', 'duration_months', 'plan_start_date', 'plan_end_date',
            'total_member_limit', 'monthly_amount', 'total_amount'
        ]));

        return redirect()->back()->with('success', 'Plan information updated successfully.');
    }

    public function updateSettings(Request $request, $encryptedTeamId)
    {
        try {
            $teamId = decrypt($encryptedTeamId);
            $team = Team::findOrFail($teamId);
        } catch (\Exception $e) {
            abort(403, 'Invalid team identifier.');
        }

        $user = Auth::user();
        $isOwner = $team->user_id === $user->id;

        if (!$isOwner && !$user->hasRole('admin')) {
            return redirect()->back()->with('error', 'You do not have permission to update team settings.');
        }

        $request->validate([
            'settings' => ['nullable', 'array'],
        ]);

        $teamInfo = $team->teamInfo ?: $team->teamInfo()->create(['team_id' => $team->id]);
        
        $teamInfo->update([
            'settings' => $request->settings ?? [],
            'last_activity' => now(),
        ]);

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}