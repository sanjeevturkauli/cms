<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeamInfoRequest;
use App\Models\TeamInfo;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamInfoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $teamInfos = TeamInfo::with('team')
            ->when(request('team_id'), function ($query, $teamId) {
                return $query->where('team_id', $teamId);
            })
            ->when(request('plan'), function ($query, $plan) {
                return $query->where('plan', $plan);
            })
            ->when(request('status'), function ($query, $status) {
                if ($status === 'active') {
                    return $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    return $query->where('is_active', false);
                }
                return $query;
            })
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $teamInfos,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TeamInfoRequest $request): JsonResponse
    {
        $teamInfo = TeamInfo::create($request->validated());
        
        // Update member count
        $teamInfo->updateMemberCount();

        return response()->json([
            'success' => true,
            'message' => 'Team info created successfully.',
            'data' => $teamInfo->load('team'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(TeamInfo $teamInfo): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $teamInfo->load('team'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TeamInfoRequest $request, TeamInfo $teamInfo): JsonResponse
    {
        $teamInfo->update($request->validated());
        
        // Update member count if needed
        if ($request->has('total_member_limit')) {
            $teamInfo->updateMemberCount();
        }

        return response()->json([
            'success' => true,
            'message' => 'Team info updated successfully.',
            'data' => $teamInfo->load('team'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TeamInfo $teamInfo): JsonResponse
    {
        $teamInfo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Team info deleted successfully.',
        ]);
    }

    /**
     * Get team info by team ID
     */
    public function getByTeam(Team $team): JsonResponse
    {
        $teamInfo = $team->teamInfo;

        if (!$teamInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Team info not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $teamInfo,
        ]);
    }

    /**
     * Update member count for a team
     */
    public function updateMemberCount(Team $team): JsonResponse
    {
        $teamInfo = $team->teamInfo;

        if (!$teamInfo) {
            return response()->json([
                'success' => false,
                'message' => 'Team info not found.',
            ], 404);
        }

        $teamInfo->updateMemberCount();

        return response()->json([
            'success' => true,
            'message' => 'Member count updated successfully.',
            'data' => $teamInfo,
        ]);
    }
}
