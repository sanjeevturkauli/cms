<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Member;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeamController extends Controller
{
    public function memberTeams(Request $request)
    {
        try {
            // Get authenticated user (set by middleware)
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 401,
                    'message' => 'Unauthorized. Please login first.',
                    'data' => null
                ], 401);
            }

            // Check if user has member role
            if (!$user->hasRole('member')) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 403,
                    'message' => 'Access denied. Member role required.',
                    'data' => null
                ], 403);
            }

            // Get all teams where user is a member
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

    public function getTeamData(Request $request, $teamId)
    {
        try {
            // Get authenticated user (set by middleware)
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 401,
                    'message' => 'Unauthorized. Please login first.',
                    'data' => null
                ], 401);
            }

            // Check if user has member role
            if (!$user->hasRole('member')) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 403,
                    'message' => 'Access denied. Member role required.',
                    'data' => null
                ], 403);
            }

            // Check if user is a member of this team
            $memberRecord = Member::where('user_id', $user->id)
                ->where('team_id', $teamId)
                ->first();

            if (!$memberRecord) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 403,
                    'message' => 'Access denied. You are not a member of this team.',
                    'data' => null
                ], 403);
            }

            // Get full team data with all relationships
            $team = Team::where('id', $teamId)
                ->withCount('members')
                ->with([
                    'user:id,name,email,mobile',
                    'members.user:id,name,email,mobile,is_active',
                    'members.user.roles:id,name',
                    'members.user.kyc:id,user_id,status',
                    'teamInfo',
                    'subscriptions' => function ($query) {
                        $query->where('status', 'active')->latest();
                    },
                    'subscriptions.package:id,name,price,duration,team_limit,member_limit'
                ])
                ->first();

            if (!$team) {
                return response()->json([
                    'status' => 'error',
                    'statusCode' => 404,
                    'message' => 'Team not found.',
                    'data' => null
                ], 404);
            }

            // Prepare team info data
            $teamInfoData = null;
            if ($team->teamInfo) {
                $teamInfoData = [
                    'id' => $team->teamInfo->id,
                    'plan' => $team->teamInfo->plan,
                    'duration_months' => $team->teamInfo->duration,
                    'plan_start_date' => $team->teamInfo->plan_start_date?->format('Y-m-d'),
                    'plan_end_date' => $team->teamInfo->plan_end_date?->format('Y-m-d'),
                    'total_member_limit' => $team->teamInfo->total_member_limit,
                    'current_members' => $team->teamInfo->current_members,
                    'remaining_member_slots' => $team->teamInfo->remaining_member_slots,
                    'member_usage_percentage' => $team->teamInfo->member_usage_percentage,
                    'monthly_amount' => $team->teamInfo->monthly_amount,
                    'total_amount' => $team->teamInfo->total_amount,
                    'paid_members' => $team->teamInfo->paid_members,
                    'location' => $team->teamInfo->location,
                    'address' => $team->teamInfo->address,
                    'city' => $team->teamInfo->city,
                    'state' => $team->teamInfo->state,
                    'country' => $team->teamInfo->country,
                    'pincode' => $team->teamInfo->pincode,
                    'latitude' => $team->teamInfo->latitude,
                    'longitude' => $team->teamInfo->longitude,
                    'description' => $team->teamInfo->description,
                    'category' => $team->teamInfo->category,
                    'settings' => $team->teamInfo->settings,
                    'is_active' => $team->teamInfo->is_active,
                    'plan_status' => $team->teamInfo->plan_status,
                    'is_expired' => $team->teamInfo->is_expired,
                    'last_activity' => $team->teamInfo->last_activity?->format('Y-m-d H:i:s'),
                ];
            }

            // Prepare subscription data
            $subscriptionData = null;
            if ($team->subscriptions->isNotEmpty()) {
                $subscription = $team->subscriptions->first();
                $subscriptionData = [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                    'start_date' => $subscription->start_date?->format('Y-m-d'),
                    'end_date' => $subscription->end_date?->format('Y-m-d'),
                    'is_active' => $subscription->status === 'active',
                    'package' => $subscription->package ? [
                        'id' => $subscription->package->id,
                        'name' => $subscription->package->name,
                        'price' => $subscription->package->price,
                        'duration_months' => $subscription->package->duration,
                        'team_limit' => $subscription->package->team_limit,
                        'member_limit' => $subscription->package->member_limit,
                    ] : null,
                ];
            }

            // Get member payments for this user in this team
            $memberPayments = \App\Models\MemberPayment::where('user_id', $user->id)
                ->where('team_id', $teamId)
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => (float) $payment->amount,
                        'month_label' => $payment->month_label,
                        'due_date' => $payment->due_date->format('Y-m-d'),
                        'paid_date' => $payment->paid_date?->format('Y-m-d'),
                        'status' => $payment->status,
                        'is_overdue' => $payment->is_overdue,
                        'payment_method' => $payment->payment_method,
                        'transaction_ref' => $payment->transaction_ref,
                    ];
                });

            // Prepare detailed team information
            $teamData = [
                'id' => $team->id,
                'name' => $team->name,
                'team_id' => $team->team_id,
                'is_active' => $team->is_active,
                'status' => $team->status,
                'members_count' => $team->members_count,
                'created_at' => $team->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $team->updated_at->format('Y-m-d H:i:s'),
                'joined_at' => $memberRecord->created_at->format('Y-m-d H:i:s'),
                'team_info' => $teamInfoData,
                'subscription' => $subscriptionData,
                'owner' => [
                    'id' => $team->user->id,
                    'name' => $team->user->name,
                    'email' => $team->user->email,
                    'phone' => $team->user->mobile,
                ],
                'members' => $team->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'user_id' => $member->user->id,
                        'name' => $member->user->name,
                        'email' => $member->user->email,
                        'phone' => $member->user->mobile,
                        'is_active' => $member->user->is_active ?? true,
                        'roles' => $member->user->roles->pluck('name')->toArray(),
                        'kyc_status' => $member->user->kyc?->status ?? 'not_submitted',
                        'joined_at' => $member->created_at->format('Y-m-d H:i:s'),
                        'last_activity' => $member->updated_at->format('Y-m-d H:i:s'),
                    ];
                }),
                'my_payments' => $memberPayments,
                'statistics' => [
                    'total_members' => $team->members->count(),
                    'active_members' => $team->members->filter(function ($member) {
                        return $member->user->is_active ?? true;
                    })->count(),
                    'inactive_members' => $team->members->filter(function ($member) {
                        return !($member->user->is_active ?? true);
                    })->count(),
                    'my_total_payments' => $memberPayments->where('status', 'paid')->sum('amount'),
                    'my_pending_payments' => $memberPayments->where('status', 'pending')->count(),
                ]
            ];

            return response()->json([
                'status' => 'success',
                'statusCode' => 200,
                'message' => 'Team data retrieved successfully.',
                'data' => $teamData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'statusCode' => 500,
                'message' => 'An error occurred while retrieving team data.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'data' => null
            ], 500);
        }
    }

    public function myTeams(Request $request, $id = null)
    {
        try {
            // Get authenticated user (set by middleware)
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
            ->with([
                'members.user:id,name,email,is_active', 
                'members.user.roles:id,name',
                'teamInfo'
            ])
            ->first();

        // Check if user is a member of this team
        $memberTeam = null;
        if (!$ownedTeam) {
            $memberRecord = Member::where('user_id', $user->id)
                ->whereHas('team', function ($query) use ($teamId) {
                    $query->where('id', $teamId);
                })
                ->with([
                    'team.user:id,name,email', 
                    'team.members.user:id,name,email,is_active', 
                    'team.members.user.roles:id,name',
                    'team.teamInfo'
                ])
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

        // Prepare team info data
        $teamInfoData = null;
        if ($team->teamInfo) {
            $teamInfoData = [
                'id' => $team->teamInfo->id,
                'plan' => $team->teamInfo->plan,
                'duration_months' => $team->teamInfo->duration,
                'plan_start_date' => $team->teamInfo->plan_start_date?->format('Y-m-d'),
                'plan_end_date' => $team->teamInfo->plan_end_date?->format('Y-m-d'),
                'total_member_limit' => $team->teamInfo->total_member_limit,
                'current_members' => $team->teamInfo->current_members,
                'remaining_member_slots' => $team->teamInfo->remaining_member_slots,
                'member_usage_percentage' => $team->teamInfo->member_usage_percentage,
                'monthly_amount' => $team->teamInfo->monthly_amount,
                'total_amount' => $team->teamInfo->total_amount,
                'paid_members' => $team->teamInfo->paid_members,
                'location' => $team->teamInfo->location,
                'address' => $team->teamInfo->address,
                'city' => $team->teamInfo->city,
                'state' => $team->teamInfo->state,
                'country' => $team->teamInfo->country,
                'pincode' => $team->teamInfo->pincode,
                'latitude' => $team->teamInfo->latitude,
                'longitude' => $team->teamInfo->longitude,
                'description' => $team->teamInfo->description,
                'category' => $team->teamInfo->category,
                'settings' => $team->teamInfo->settings,
                'is_active' => $team->teamInfo->is_active,
                'plan_status' => $team->teamInfo->plan_status,
                'is_expired' => $team->teamInfo->is_expired,
                'last_activity' => $team->teamInfo->last_activity?->format('Y-m-d H:i:s'),
            ];
        }

        // Prepare detailed team information
        $teamData = [
            'id' => $team->id,
            'name' => $team->name,
            'team_id' => $team->team_id,
            'is_active' => $team->is_active,
            'status' => $team->status,
            'members_count' => $ownedTeam ? $team->members_count : $team->members->count(),
            'role_in_team' => $ownedTeam ? 'owner' : 'member',
            'is_owner' => (bool) $ownedTeam,
            'created_at' => $team->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $team->updated_at->format('Y-m-d H:i:s'),
            'joined_at' => $ownedTeam
                ? $team->created_at->format('Y-m-d H:i:s')
                : ($memberRecord ? $memberRecord->created_at->format('Y-m-d H:i:s') : null),
            'team_info' => $teamInfoData,
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
            ->with(['members.user:id,name,email', 'teamInfo'])
            ->get()
            ->map(function ($team) use ($user) {
                // Prepare team info data
                $teamInfoData = null;
                if ($team->teamInfo) {
                    $teamInfoData = [
                        'id' => $team->teamInfo->id,
                        'plan' => $team->teamInfo->plan,
                        'duration_months' => $team->teamInfo->duration,
                        'plan_start_date' => $team->teamInfo->plan_start_date?->format('Y-m-d'),
                        'plan_end_date' => $team->teamInfo->plan_end_date?->format('Y-m-d'),
                        'total_member_limit' => $team->teamInfo->total_member_limit,
                        'current_members' => $team->teamInfo->current_members,
                        'remaining_member_slots' => $team->teamInfo->remaining_member_slots,
                        'member_usage_percentage' => $team->teamInfo->member_usage_percentage,
                        'monthly_amount' => $team->teamInfo->monthly_amount,
                        'total_amount' => $team->teamInfo->total_amount,
                        'paid_members' => $team->teamInfo->paid_members,
                        'location' => $team->teamInfo->location,
                        'address' => $team->teamInfo->address,
                        'city' => $team->teamInfo->city,
                        'state' => $team->teamInfo->state,
                        'country' => $team->teamInfo->country,
                        'plan_status' => $team->teamInfo->plan_status,
                        'is_expired' => $team->teamInfo->is_expired,
                    ];
                }

                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'is_active' => $team->is_active,
                    'status' => $team->status,
                    'members_count' => $team->members_count,
                    'role_in_team' => 'owner',
                    'is_owner' => true,
                    'created_at' => $team->created_at->format('Y-m-d H:i:s'),
                    'joined_at' => $team->created_at->format('Y-m-d H:i:s'),
                    'team_info' => $teamInfoData,
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
            ->with(['team.user:id,name,email', 'team.members.user:id,name,email', 'team.teamInfo'])
            ->get()
            ->map(function ($member) {
                $team = $member->team;
                
                // Prepare team info data
                $teamInfoData = null;
                if ($team->teamInfo) {
                    $teamInfoData = [
                        'id' => $team->teamInfo->id,
                        'plan' => $team->teamInfo->plan,
                        'duration_months' => $team->teamInfo->duration,
                        'plan_start_date' => $team->teamInfo->plan_start_date?->format('Y-m-d'),
                        'plan_end_date' => $team->teamInfo->plan_end_date?->format('Y-m-d'),
                        'total_member_limit' => $team->teamInfo->total_member_limit,
                        'current_members' => $team->teamInfo->current_members,
                        'remaining_member_slots' => $team->teamInfo->remaining_member_slots,
                        'member_usage_percentage' => $team->teamInfo->member_usage_percentage,
                        'monthly_amount' => $team->teamInfo->monthly_amount,
                        'total_amount' => $team->teamInfo->total_amount,
                        'paid_members' => $team->teamInfo->paid_members,
                        'location' => $team->teamInfo->location,
                        'address' => $team->teamInfo->address,
                        'city' => $team->teamInfo->city,
                        'state' => $team->teamInfo->state,
                        'country' => $team->teamInfo->country,
                        'plan_status' => $team->teamInfo->plan_status,
                        'is_expired' => $team->teamInfo->is_expired,
                    ];
                }

                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'team_id' => $team->team_id,
                    'is_active' => $team->is_active,
                    'status' => $team->status,
                    'members_count' => $team->members->count(),
                    'role_in_team' => 'member',
                    'is_owner' => false,
                    'created_at' => $team->created_at->format('Y-m-d H:i:s'),
                    'joined_at' => $member->created_at->format('Y-m-d H:i:s'),
                    'team_info' => $teamInfoData,
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
