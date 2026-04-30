import { Head, router, usePage } from '@inertiajs/react';
import { Bell, Check, Trash2, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import * as React from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
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

export default function MemberNotificationsIndex({
    notifications,
    filters,
    types,
    unreadCount,
}: NotificationsPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Apply filters function
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        if (searchTerm) params.set('search', searchTerm);
        if (selectedType !== 'all') params.set('type', selectedType);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);

        router.get('/member/notifications', Object.fromEntries(params));
    };

    // Handle search input change (real-time search)
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        // Apply search filter immediately
        const params = new URLSearchParams();
        if (value) params.set('search', value);
        if (selectedType !== 'all') params.set('type', selectedType);
        if (selectedStatus !== 'all') params.set('status', selectedStatus);

        router.get('/member/notifications', Object.fromEntries(params));
    };

    // Handle search on Enter key
    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedStatus('all');
        router.get('/member/notifications');
    };

    // Check if any filter is active
    const hasActiveFilters = searchTerm || selectedType !== 'all' || selectedStatus !== 'all';

    // Handle refresh
    const handleRefresh = () => {
        router.reload();
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await axios.patch('/member/notifications/mark-all-read');
            router.reload({ only: ['notifications', 'unreadCount'] });
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to mark all notifications as read');
        }
    };

    // Delete notification with confirmation
    const confirmDelete = async (notificationId: number) => {
        try {
            await axios.delete(`/member/notifications/${notificationId}`);
            router.reload({ only: ['notifications', 'unreadCount'] });
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
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
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="Member - Notifications" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Notification Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Stay updated with your team and member notifications
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Notifications List</CardTitle>
                                            <CardDescription>
                                                Total {notifications.data?.length || 0} of {notifications.meta?.total || 0} notifications
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefresh}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Refresh
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters */}
                                    <div className="justify-between items-center mb-6 flex flex-col gap-4 sm:flex-row">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search by title, message..."
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                className="pl-10"
                                                onKeyPress={handleSearchKeyPress}
                                            />
                                        </div>
                                        <div className='flex gap-2'>
                                            <Select value={selectedType} onValueChange={(value) => {
                                                setSelectedType(value);
                                                // Apply filters immediately after state update
                                                setTimeout(() => {
                                                    const params = new URLSearchParams();
                                                    if (searchTerm) params.set('search', searchTerm);
                                                    if (value !== 'all') params.set('type', value);
                                                    if (selectedStatus !== 'all') params.set('status', selectedStatus);
                                                    router.get('/member/notifications', Object.fromEntries(params));
                                                }, 0);
                                            }}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="All Types" />
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

                                            <Select value={selectedStatus} onValueChange={(value) => {
                                                setSelectedStatus(value);
                                                // Apply filters immediately after state update
                                                setTimeout(() => {
                                                    const params = new URLSearchParams();
                                                    if (searchTerm) params.set('search', searchTerm);
                                                    if (selectedType !== 'all') params.set('type', selectedType);
                                                    if (value !== 'all') params.set('status', value);
                                                    router.get('/member/notifications', Object.fromEntries(params));
                                                }, 0);
                                            }}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="unread">Unread</SelectItem>
                                                    <SelectItem value="read">Read</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {hasActiveFilters && (
                                                <Button onClick={clearFilters} variant="outline" className="cursor-pointer">
                                                    Clear
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {notifications.data.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {Object.values(filters).some(f => f) 
                                                    ? "No notifications found matching your filters."
                                                    : "No notifications yet."
                                                }
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Title</TableHead>
                                                        <TableHead>Message</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {notifications.data.map((notification) => (
                                                        <TableRow key={notification.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {formatType(notification.type)}
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div>
                                                                    <div className="font-medium flex items-center gap-2">
                                                                        {notification.title}
                                                                        {!notification.is_read && (
                                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="max-w-md">
                                                                    <div className="text-sm text-muted-foreground truncate">
                                                                        {notification.message}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={notification.is_read ? "secondary" : "default"} className="text-xs">
                                                                    {notification.is_read ? "Read" : "Unread"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                <div className="text-sm">
                                                                    <div>{notification.time_ago}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {notification.created_at}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end">
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 cursor-pointer text-destructive hover:text-destructive"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Are you sure you want to delete this notification?</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This action cannot be undone. This will permanently delete the notification.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => confirmDelete(notification.id)}
                                                                                    className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                                                                >
                                                                                    Delete Notification
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

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
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}