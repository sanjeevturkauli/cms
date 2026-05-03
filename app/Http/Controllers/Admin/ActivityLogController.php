<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with(['subject', 'causer'])
            ->orderBy('created_at', 'desc');

        // Filter by log name (kyc, transaction, etc.)
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        // Filter by event (approved, rejected, etc.)
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        // Search by description
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/activity-logs/index', [
            'logs' => [
                'data' => $logs->through(function ($log) {
                    return [
                        'id' => $log->id,
                        'log_name' => $log->log_name,
                        'description' => $log->description,
                        'event' => $log->event,
                        'subject' => $log->subject ? [
                            'id' => $log->subject->id,
                            'type' => class_basename($log->subject_type),
                            'name' => $this->getSubjectName($log->subject),
                        ] : null,
                        'causer' => $log->causer ? [
                            'id' => $log->causer->id,
                            'name' => $log->causer->name ?? 'System',
                            'email' => $log->causer->email ?? null,
                        ] : ['name' => 'System'],
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
            'filters' => $request->only(['log_name', 'event', 'search', 'date_from', 'date_to']),
            'logNames' => ActivityLog::distinct()->pluck('log_name')->filter()->values(),
            'events' => ActivityLog::distinct()->pluck('event')->filter()->values(),
        ]);
    }

    private function getSubjectName($subject): string
    {
        if (!$subject) return 'Unknown';
        
        if (method_exists($subject, 'name')) {
            return $subject->name;
        }
        
        if (isset($subject->title)) {
            return $subject->title;
        }
        
        if (isset($subject->id)) {
            return class_basename(get_class($subject)) . ' #' . $subject->id;
        }
        
        return 'Unknown';
    }
}