import { Head, router, usePage } from '@inertiajs/react';
import { Bell, Check, Trash2, Filter, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import axios from 'axios';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    time_ago: string;
}

interface NotificationsPageProps {
    notifications: {
        data: Notification[];
        links: any[];
        meta: any;
    };
    filters: {
        type?: string;
        status?: string;
        search?: string;
    };
    types: string[];
    unreadCount: number;
}

export default function NotificationsIndex({
    notifications,
    filters,
    types,
    unreadCount,
}: NotificationsPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);

    // Apply filters
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        if (searchTerm) params.set('search', searchTerm);
        if (selectedType !== 'all') params.set('type', selectedType);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);

        router.get('/notifications', Object.fromEntries(params));
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedStatus('all');
        router.get('/notifications');
    };

    // Mark notification as read
    const markAsRead = async (notificationId: number) => {
        try {
            await axios.patch(`/notifications/${notificationId}/read`);
            router.reload({ only: ['notifications', 'unreadCount'] });
            toast.success('Notification marked as read');
        } catch (error) {
            toast.error('Failed to mark notification as read');
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await axios.patch('/notifications/mark-all-read');
            router.reload({ only: ['notifications', 'unreadCount'] });
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all notifications as read');
        }
    };

    // Delete notification with confirmation
    const handleDeleteClick = (notificationId: number) => {
        setNotificationToDelete(notificationId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!notificationToDelete) return;

        try {
            await axios.delete(`/notifications/${notificationToDelete}`);
            router.reload({ only: ['notifications', 'unreadCount'] });
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        } finally {
            setDeleteDialogOpen(false);
            setNotificationToDelete(null);
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_member':
                return '👥';
            case 'new_team':
                return '🏢';
            default:
                return '📢';
        }
    };

    // Get notification color based on type
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'new_member':
                return 'border-l-blue-500 bg-blue-50';
            case 'new_team':
                return 'border-l-green-500 bg-green-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    // Format notification type for display
    const formatType = (type: string) => {
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Head title="Notifications" />

                    <div className="mx-auto w-full max-w-6xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                                <p className="text-muted-foreground">
                                    Manage your notifications and stay updated
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <Button onClick={markAllAsRead} variant="outline">
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark All Read ({unreadCount})
                                    </Button>
                                )}
                                <Button onClick={() => router.reload()} variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Search</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search notifications..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <Select value={selectedType} onValueChange={setSelectedType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {types.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {formatType(type)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="unread">Unread</SelectItem>
                                                <SelectItem value="read">Read</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Actions</label>
                                        <div className="flex gap-2">
                                            <Button onClick={applyFilters} className="flex-1">
                                                Apply
                                            </Button>
                                            <Button onClick={clearFilters} variant="outline" className="flex-1">
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notifications List */}
                        <div className="space-y-4">
                            {notifications.data.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                                        <p className="text-muted-foreground text-center">
                                            {Object.values(filters).some(f => f) 
                                                ? "Try adjusting your filters to see more notifications."
                                                : "You don't have any notifications yet."
                                            }
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                notifications.data.map((notification) => (
                                    <Card 
                                        key={notification.id} 
                                        className={`border-l-4 ${getNotificationColor(notification.type)} ${
                                            !notification.is_read ? 'shadow-md' : ''
                                        }`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-lg">
                                                                {notification.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {formatType(notification.type)}
                                                                </Badge>
                                                                {!notification.is_read && (
                                                                    <Badge variant="default" className="text-xs">
                                                                        Unread
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-muted-foreground mb-3">
                                                        {notification.message}
                                                    </p>
                                                    
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>{notification.time_ago}</span>
                                                        <span>•</span>
                                                        <span>{notification.created_at}</span>
                                                        {notification.read_at && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Read: {notification.read_at}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(notification.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {notifications.links && notifications.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <div className="flex items-center gap-2">
                                    {notifications.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => link.url && router.get(link.url)}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this notification? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={confirmDelete}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}