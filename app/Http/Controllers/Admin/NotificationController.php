<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            if ($request->status === 'read') {
                $query->where('is_read', true);
            } elseif ($request->status === 'unread') {
                $query->where('is_read', false);
            }
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('message', 'like', '%' . $request->search . '%');
            });
        }

        $notifications = $query->paginate(20)->through(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'data' => $notification->data,
                'is_read' => $notification->is_read,
                'read_at' => $notification->read_at?->format('M d, Y H:i'),
                'created_at' => $notification->created_at->format('M d, Y H:i'),
                'time_ago' => $notification->time_ago,
            ];
        });

        // Get notification types for filter
        $types = Notification::where('user_id', $user->id)
            ->select('type')
            ->distinct()
            ->pluck('type')
            ->toArray();

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'filters' => [
                'type' => $request->type,
                'status' => $request->status,
                'search' => $request->search,
            ],
            'types' => $types,
            'unreadCount' => NotificationService::getUnreadCount($user->id),
        ]);
    }

    public function getUnreadCount()
    {
        $user = Auth::user();
        return response()->json([
            'count' => NotificationService::getUnreadCount($user->id)
        ]);
    }

    public function getRecent()
    {
        $user = Auth::user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $notification->data,
                    'is_read' => $notification->is_read,
                    'created_at' => $notification->created_at->format('M d, Y H:i'),
                    'time_ago' => $notification->time_ago,
                ];
            });

        return response()->json([
            'notifications' => $notifications,
            'unreadCount' => NotificationService::getUnreadCount($user->id),
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'unreadCount' => NotificationService::getUnreadCount($user->id),
        ]);
    }

    public function markAllAsRead()
    {
        $user = Auth::user();
        NotificationService::markAllAsRead($user->id);

        return response()->json([
            'success' => true,
            'unreadCount' => 0,
        ]);
    }

    public function destroy(Notification $notification)
    {
        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'unreadCount' => NotificationService::getUnreadCount($user->id),
        ]);
    }
}
