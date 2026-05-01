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
        return Inertia::render('members/dashboard');
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

        if ($status) {
            $query->whereHas('team', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        if ($isActive !== '') {
            $query->whereHas('team', function ($q) use ($isActive) {
                $q->where('is_active', $isActive);
            });
        }

        $members = $query->latest()->paginate(20);

        $teams = $members->map(function ($member) {
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
                'members_count' => $member->team->members_count,
                'joined_at' => $member->created_at->format('M d, Y'),
                'created_at' => $member->team->created_at->format('M d, Y'),
                'signed_url' => $signedUrl,
            ];
        });

        return Inertia::render('members/teams', [
            'teams' => [
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
