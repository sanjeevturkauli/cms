"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { router, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import axios from "axios"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type SharedData } from "@/types"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
  time_ago: string
}

export function NotificationBell() {
  const { props } = usePage<SharedData>()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(props.notificationCount || 0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch recent notifications when dropdown opens
  const fetchNotifications = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const user = props.auth?.user;
      let recentUrl = '/notifications/recent'; // fallback
      
      if (user?.roles && user.roles.length > 0) {
        const role = user.roles[0].name;
        switch (role) {
          case 'admin':
            recentUrl = '/admin/notifications/recent';
            break;
          case 'team':
            recentUrl = '/team/notifications/recent';
            break;
          case 'member':
            recentUrl = '/member/notifications/recent';
            break;
        }
      }
      
      const response = await axios.get(recentUrl)
      setNotifications(response.data.notifications)
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigate to notifications page based on user role
  const viewAllNotifications = () => {
    const user = props.auth?.user;
    let notificationUrl = '/notifications'; // fallback
    
    if (user?.roles && user.roles.length > 0) {
      const role = user.roles[0].name;
      switch (role) {
        case 'admin':
          notificationUrl = '/admin/notifications';
          break;
        case 'team':
          notificationUrl = '/team/notifications';
          break;
        case 'member':
          notificationUrl = '/member/notifications';
          break;
        default:
          notificationUrl = '/notifications';
      }
    }
    
    router.visit(notificationUrl);
    setIsOpen(false);
  }

  // Handle notification click - mark as read and redirect to notifications page
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        const user = props.auth?.user;
        let markReadUrl = `/notifications/${notification.id}/read`; // fallback
        
        if (user?.roles && user.roles.length > 0) {
          const role = user.roles[0].name;
          switch (role) {
            case 'admin':
              markReadUrl = `/admin/notifications/${notification.id}/read`;
              break;
            case 'team':
              markReadUrl = `/team/notifications/${notification.id}/read`;
              break;
            case 'member':
              markReadUrl = `/member/notifications/${notification.id}/read`;
              break;
          }
        }
        
        await axios.patch(markReadUrl);
      }
      
      // Close dropdown and redirect to notifications page
      setIsOpen(false);
      viewAllNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Still redirect even if marking as read fails
      setIsOpen(false);
      viewAllNotifications();
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const user = props.auth?.user;
      let markAllReadUrl = '/notifications/mark-all-read'; // fallback
      
      if (user?.roles && user.roles.length > 0) {
        const role = user.roles[0].name;
        switch (role) {
          case 'admin':
            markAllReadUrl = '/admin/notifications/mark-all-read';
            break;
          case 'team':
            markAllReadUrl = '/team/notifications/mark-all-read';
            break;
          case 'member':
            markAllReadUrl = '/member/notifications/mark-all-read';
            break;
        }
      }
      
      await axios.patch(markAllReadUrl)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_member':
        return '👥'
      case 'new_team':
        return '🏢'
      default:
        return '📢'
    }
  }

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_member':
        return 'bg-blue-50 border-blue-200'
      case 'new_team':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  // Handle dropdown open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchNotifications()
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative  cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96" align="end">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-l-4 cursor-pointer hover:bg-gray-100 transition-colors ${getNotificationColor(notification.type)} ${
                    !notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time_ago}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={viewAllNotifications} className="cursor-pointer">
          <span className="text-sm">View all notifications</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}