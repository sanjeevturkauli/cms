<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Models\Team;
use App\Models\Member;

class NotificationService
{
    public static function notifyNewMember(Member $member): void
    {
        $team = $member->team;
        $newUser = $member->user;
        
        // Notify team owner
        if ($team->user_id) {
            Notification::create([
                'user_id' => $team->user_id,
                'type' => 'new_member',
                'title' => 'New Member Joined',
                'message' => "{$newUser->name} has joined your team '{$team->name}'",
                'data' => [
                    'member_id' => $member->id,
                    'member_name' => $newUser->name,
                    'member_email' => $newUser->email,
                    'team_id' => $team->id,
                    'team_name' => $team->name,
                ],
            ]);
        }

        // Notify all admins
        $admins = User::whereHas('roles', function($query) {
            $query->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_member',
                'title' => 'New Member Registration',
                'message' => "{$newUser->name} has joined team '{$team->name}'",
                'data' => [
                    'member_id' => $member->id,
                    'member_name' => $newUser->name,
                    'member_email' => $newUser->email,
                    'team_id' => $team->id,
                    'team_name' => $team->name,
                ],
            ]);
        }
    }

    public static function notifyNewTeam(Team $team): void
    {
        $teamOwner = $team->user;
        
        // Notify all admins about new team registration
        $admins = User::whereHas('roles', function($query) {
            $query->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_team',
                'title' => 'New Team Registration',
                'message' => "{$teamOwner->name} has registered a new team '{$team->name}'",
                'data' => [
                    'team_id' => $team->id,
                    'team_name' => $team->name,
                    'team_owner_id' => $teamOwner->id,
                    'team_owner_name' => $teamOwner->name,
                    'team_owner_email' => $teamOwner->email,
                ],
            ]);
        }
    }

    public static function markAsRead(int $notificationId, int $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    public static function markAllAsRead(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    public static function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}