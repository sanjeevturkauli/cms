<?php

namespace App\Http\Controllers\Team;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Kyc;
use App\Models\MemberPayment;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = ActivityLog::with(['subject', 'causer'])
            ->where(function ($q) use ($user) {
                // Show logs where user is the causer
                $q->where('causer_id', $user->id)
                  // KYC logs for this user
                  ->orWhere(function ($subQ) use ($user) {
                      $subQ->where('log_name', 'kyc')
                           ->where('subject_type', Kyc::class)
                           ->whereIn('subject_id', function ($kycQ) use ($user) {
                               $kycQ->select('id')
                                    ->from('kyc')
                                    ->where('user_id', $user->id);
                           });
                  })
                  // Subscription logs for teams owned by this user
                  ->orWhere(function ($subQ) use ($user) {
                      $subQ->where('log_name', 'subscription')
                           ->where('subject_type', \App\Models\Subscription::class)
                           ->whereIn('subject_id', function ($sQ) use ($user) {
                               $sQ->select('subscriptions.id')
                                  ->from('subscriptions')
                                  ->join('teams', 'teams.id', '=', 'subscriptions.team_id')
                                  ->where('teams.user_id', $user->id);
                           });
                  })
                  // Payment logs for member payments received in user's teams
                  ->orWhere(function ($subQ) use ($user) {
                      $subQ->where('log_name', 'payment')
                           ->where('subject_type', MemberPayment::class)
                           ->whereIn('subject_id', function ($mpQ) use ($user) {
                               $mpQ->select('member_payments.id')
                                   ->from('member_payments')
                                   ->join('teams', 'teams.id', '=', 'member_payments.team_id')
                                   ->where('teams.user_id', $user->id);
                           });
                  });
            })
            ->orderBy('created_at', 'desc');

        // Filter by log name
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        // Filter by event
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        $logs = $query->paginate(15)->withQueryString();

        return Inertia::render('team/activity-logs/index', [
            'logs' => [
                'data' => $logs->through(function ($log) {
                    return [
                        'id' => $log->id,
                        'log_name' => $log->log_name,
                        'description' => $log->description,
                        'event' => $log->event,
                        'properties' => $log->properties,
                        'created_at' => $log->created_at->format('d M, Y H:i:s'),
                        'created_at_human' => $log->created_at->diffForHumans(),
                    ];
                })->items(),
                'links' => $logs->linkCollection()->toArray(),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'from' => $logs->firstItem(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'to' => $logs->lastItem(),
                    'total' => $logs->total(),
                ],
            ],
            'filters' => $request->only(['log_name', 'event']),
        ]);
    }
}