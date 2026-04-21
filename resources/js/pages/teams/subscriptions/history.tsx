import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Info,
    Search,
    RefreshCw,
    X,
    Eye,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SubscriptionLog {
    id: number;
    action: string;
    action_badge: {
        text: string;
        color: string;
    };
    team_name: string;
    from_package: string | null;
    to_package: string;
    amount_charged: string;
    description: string;
    created_at: string;
    days_used: number | null;
    days_remaining: number | null;
}

interface Props {
    logs: {
        data: SubscriptionLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        action: string | null;
        package: string | null;
        search: string | null;
    };
    packages: string[];
}

export default function SubscriptionHistory({ logs, filters, packages }: Props) {
    const [actionFilter, setActionFilter] = useState<string>(filters.action || 'all');
    const [packageFilter, setPackageFilter] = useState<string>(filters.package || 'all');
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');
    const [selectedLog, setSelectedLog] = useState<SubscriptionLog | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Immediate filter on dropdown change
    useEffect(() => {
        applyFilters();
    }, [actionFilter, packageFilter]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'new':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">New</Badge>;
            case 'upgrade':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upgrade</Badge>;
            case 'downgrade':
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Downgrade</Badge>;
            case 'cancel':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancel</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
        }
    };

    const formatAmount = (amount: string) => {
        const isNegative = amount.startsWith('-');
        return (
            <span className={isNegative ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {amount}
            </span>
        );
    };

    const applyFilters = () => {
        router.get('/team/subscriptions/history', {
            action: actionFilter !== 'all' ? actionFilter : undefined,
            package: packageFilter !== 'all' ? packageFilter : undefined,
            search: searchQuery || undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['logs'],
        });
    };

    const handleClearFilters = () => {
        setActionFilter('all');
        setPackageFilter('all');
        setSearchQuery('');
        router.get('/team/subscriptions/history', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const hasActiveFilters = actionFilter !== 'all' || packageFilter !== 'all' || searchQuery !== '';

    const handleViewDetails = (log: SubscriptionLog) => {
        setSelectedLog(log);
        setShowDetailsDialog(true);
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
            <Head title="Subscription History" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
                            {/* Header */}
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Subscription History
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage and view your subscription activities
                                </p>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-card rounded-lg border p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold">Activity Logs</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Total {logs.total} of {logs.total} records
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.reload()}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Refresh
                                    </Button>
                                </div>

                                {/* Search and Filters */}
                                <div className="mt-6 flex flex-col gap-4">
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                        {/* Left side - Search and Action Filter */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                                            {/* Search */}
                                            <div className="relative lg:col-span-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search by description..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>

                                            {/* Action Filter */}
                                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                                <SelectTrigger className='w-full sm:w-[160px]'>
                                                    <SelectValue placeholder="All Actions" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Actions</SelectItem>
                                                    <SelectItem value="new">New</SelectItem>
                                                    <SelectItem value="upgrade">Upgrade</SelectItem>
                                                    <SelectItem value="downgrade">Downgrade</SelectItem>
                                                    <SelectItem value="cancel">Cancel</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Right side - Package Filter */}
                                        <div className="w-full sm:w-auto ">
                                            <Select value={packageFilter} onValueChange={setPackageFilter}>
                                                <SelectTrigger className='w-full sm:w-[160px]'>
                                                    <SelectValue placeholder="All Packages" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Packages</SelectItem>
                                                    {packages.map((pkg) => (
                                                        <SelectItem key={pkg} value={pkg}>
                                                            {pkg}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Clear Filters Button */}
                                    {hasActiveFilters && (
                                        <div className="flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleClearFilters}
                                                className="cursor-pointer"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Clear Filters
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Table */}
                                <div className="mt-6 overflow-x-auto rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="font-semibold">Action</TableHead>
                                                <TableHead className="font-semibold">Description</TableHead>
                                                <TableHead className="font-semibold">From</TableHead>
                                                <TableHead className="font-semibold">To</TableHead>
                                                <TableHead className="font-semibold">Date</TableHead>
                                                <TableHead className="font-semibold">Amount</TableHead>
                                                <TableHead className="font-semibold w-20">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {logs.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                        No subscription history found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                logs.data.map((log) => (
                                                    <TableRow key={log.id} className="hover:bg-muted/50">
                                                        <TableCell>
                                                            {getActionBadge(log.action)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm">{log.description}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {log.from_package ? (
                                                                <Badge variant="outline" className="font-normal">
                                                                    {log.from_package}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-blue-50 font-normal">
                                                                {log.to_package}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                {log.created_at}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatAmount(log.amount_charged)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="sm" 
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            onClick={() => handleViewDetails(log)}
                                                                        >
                                                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>View Details</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {logs.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <div className="text-sm text-muted-foreground">
                                            Page {logs.current_page} of {logs.last_page}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={logs.current_page === 1}
                                                onClick={() => router.get(`/team/subscriptions/history?page=${logs.current_page - 1}`)}
                                                className="cursor-pointer"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={logs.current_page === logs.last_page}
                                                onClick={() => router.get(`/team/subscriptions/history?page=${logs.current_page + 1}`)}
                                                className="cursor-pointer"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Subscription Details
                        </DialogTitle>
                        <DialogDescription>
                            Complete information about this subscription activity
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            {/* Action and Status */}
                            <div className="flex items-center gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Action Type</div>
                                    {getActionBadge(selectedLog.action)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-muted-foreground mb-1">Team</div>
                                    <div className="font-medium">{selectedLog.team_name}</div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Description</div>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    {selectedLog.description}
                                </div>
                            </div>

                            {/* Package Change */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-2">From Package</div>
                                    {selectedLog.from_package ? (
                                        <Badge variant="outline" className="text-base px-3 py-1">
                                            {selectedLog.from_package}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-2">To Package</div>
                                    <Badge variant="outline" className="bg-blue-50 text-base px-3 py-1">
                                        {selectedLog.to_package}
                                    </Badge>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Amount</div>
                                    <div className="text-2xl font-bold">
                                        {formatAmount(selectedLog.amount_charged)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">Date & Time</div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{selectedLog.created_at}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Details */}
                            {(selectedLog.days_used !== null || selectedLog.days_remaining !== null) && (
                                <div className="border-t pt-4">
                                    <div className="text-sm font-semibold mb-3">Pro-rated Calculation</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {selectedLog.days_used !== null && (
                                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                <div className="text-xs text-orange-600 mb-1">Days Used</div>
                                                <div className="text-xl font-bold text-orange-700">
                                                    {selectedLog.days_used} days
                                                </div>
                                            </div>
                                        )}
                                        {selectedLog.days_remaining !== null && (
                                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                                <div className="text-xs text-green-600 mb-1">Days Remaining</div>
                                                <div className="text-xl font-bold text-green-700">
                                                    {selectedLog.days_remaining} days
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Amount was calculated based on pro-rated usage of the subscription period.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
