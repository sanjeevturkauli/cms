import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { RefreshCw, ScrollText, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogItem {
    id: number;
    log_name: string;
    description: string;
    event: string;
    properties?: Record<string, any> | null;
    created_at: string;
    created_at_human: string;
}

interface Props {
    logs: {
        data: LogItem[];
        links?: any[];
        meta?: any;
    };
    filters: {
        log_name?: string;
        event?: string;
    };
}

const getLogBadgeColor = (logName: string) => {
    switch (logName) {
        case 'kyc': return 'bg-blue-100 text-blue-800';
        case 'transaction': return 'bg-green-100 text-green-800';
        case 'team': return 'bg-purple-100 text-purple-800';
        case 'subscription': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const getEventBadgeColor = (event: string) => {
    switch (event) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'submitted': return 'bg-blue-100 text-blue-800';
        case 'created': return 'bg-emerald-100 text-emerald-800';
        case 'updated': return 'bg-yellow-100 text-yellow-800';
        case 'paid': return 'bg-green-100 text-green-800';
        case 'failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default function TeamActivityLogsIndex({ logs, filters }: Props) {
    const [logName, setLogName] = useState(filters.log_name || 'all');
    const [event, setEvent] = useState(filters.event || 'all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // Use current URL path so this page works for both /team/activity-logs and /member/activity-logs
    const baseUrl = window.location.pathname;

    const handleFilter = () => {
        router.get(baseUrl, {
            log_name: logName !== 'all' ? logName : undefined,
            event: event !== 'all' ? event : undefined,
        }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setLogName('all'); setEvent('all');
        router.get(baseUrl, {}, { preserveState: true, replace: true });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get(baseUrl, {}, {
            preserveScroll: true, preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <SidebarProvider style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}>
            <Head title="Activity Logs" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">Activity Logs</h1>
                                <p className="text-muted-foreground">Your account activity history including KYC, transactions, and more.</p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>My Activity History</CardTitle>
                                            <CardDescription>Total {logs.meta?.total || 0} log entries</CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                        <Select value={logName} onValueChange={setLogName}>
                                            <SelectTrigger className="w-full sm:w-[160px]">
                                                <SelectValue placeholder="All Modules" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Modules</SelectItem>
                                                <SelectItem value="kyc">KYC</SelectItem>
                                                <SelectItem value="transaction">Transaction</SelectItem>
                                                <SelectItem value="subscription">Subscription</SelectItem>
                                                <SelectItem value="team">Team</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={event} onValueChange={setEvent}>
                                            <SelectTrigger className="w-full sm:w-[160px]">
                                                <SelectValue placeholder="All Events" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Events</SelectItem>
                                                <SelectItem value="submitted">Submitted</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                                <SelectItem value="created">Created</SelectItem>
                                                <SelectItem value="updated">Updated</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleFilter} size="sm">Filter</Button>
                                        <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                                    </div>

                                    {logs.data.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <ScrollText className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">No activity logs found.</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-8"></TableHead>
                                                        <TableHead>Module</TableHead>
                                                        <TableHead>Event</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead>Date & Time</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {logs.data.map((log) => (
                                                        <>
                                                            <TableRow
                                                                key={log.id}
                                                                className="cursor-pointer hover:bg-muted/50"
                                                                onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                                            >
                                                                <TableCell>
                                                                    {expandedRow === log.id
                                                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={cn('text-xs capitalize', getLogBadgeColor(log.log_name))}>
                                                                        {log.log_name}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={cn('text-xs capitalize', getEventBadgeColor(log.event))}>
                                                                        {log.event}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <p className="text-sm">{log.description}</p>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div>
                                                                        <p className="text-sm">{log.created_at}</p>
                                                                        <p className="text-xs text-muted-foreground">{log.created_at_human}</p>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                            {expandedRow === log.id && log.properties && (
                                                                <TableRow key={`${log.id}-expanded`}>
                                                                    <TableCell colSpan={5} className="bg-muted/30 px-6 py-3">
                                                                        <div className="text-sm">
                                                                            <p className="font-medium mb-2 text-muted-foreground">Details:</p>
                                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                                {Object.entries(log.properties).map(([key, value]) => (
                                                                                    value !== null && value !== undefined && key !== 'admin_id' && (
                                                                                        <div key={key} className="bg-background rounded p-2 border">
                                                                                            <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                                                                                            <p className="text-sm font-medium">{String(value)}</p>
                                                                                        </div>
                                                                                    )
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {logs.meta && logs.meta.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-6">
                                            <div className="text-sm text-muted-foreground">
                                                Showing {logs.meta?.from || 0} to {logs.meta?.to || 0} of {logs.meta?.total || 0} results
                                            </div>
                                            <div className="flex space-x-2">
                                                {logs.links?.map((link, index) => (
                                                    <Button key={index} variant={link.active ? "default" : "outline"} size="sm"
                                                        disabled={!link.url} onClick={() => link.url && router.visit(link.url)}
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