import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Eye, Search, Filter, RefreshCw, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    email: string;
}

interface KycItem {
    id: number;
    user: User;
    status: string;
    status_badge: {
        class: string;
        text: string;
    };
    submitted_at: string | null;
    created_at: string;
}

interface Props {
    kycs: {
        data: KycItem[];
        links?: any[];
        meta?: any;
    };
    filters: {
        status?: string;
        search?: string;
    };
}

export default function KycIndex({ kycs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleFilter = () => {
        router.get('/admin/kyc', {
            search: search || undefined,
            status: status && status !== 'all' ? status : undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        router.get('/admin/kyc', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/admin/kyc', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-100 text-gray-800';
            case 'submitted':
                return 'bg-blue-100 text-blue-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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
            <Head title="KYC Management" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">KYC Management</h1>
                                <p className="text-muted-foreground">
                                    Manage and review KYC applications from users.
                                </p>
                            </div>

                            {/* KYC List */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>KYC Applications</CardTitle>
                                            <CardDescription>
                                                Total {kycs.meta?.total || 0} applications
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <RefreshCw
                                                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                            />
                                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters */}
                                    <div className="justify-between items-center mb-6 flex flex-col gap-4 sm:flex-row">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-10"
                                                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="submitted">Submitted</SelectItem>
                                                    <SelectItem value="approved">Approved</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={handleFilter} className="flex items-center gap-2">
                                                <Filter className="h-4 w-4" />
                                                Filter
                                            </Button>
                                            <Button variant="outline" onClick={clearFilters}>
                                                Clear
                                            </Button>
                                        </div>
                                    </div>

                                    {kycs.data.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {search || status !== 'all'
                                                    ? 'No KYC applications found matching your filters.'
                                                    : 'No KYC applications found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>User</TableHead>
                                                        <TableHead>KYC Status</TableHead>
                                                        <TableHead>Submitted Date</TableHead>
                                                        <TableHead>Created Date</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {kycs.data.map((kyc) => (
                                                        <TableRow key={kyc.id}>
                                                            <TableCell>
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                                        <span className="text-sm font-semibold text-primary">
                                                                            {kyc.user.name.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium">{kyc.user.name}</div>
                                                                        <div className="text-sm text-muted-foreground">{kyc.user.email}</div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={cn('text-xs', getStatusColor(kyc.status))}>
                                                                    {kyc.status_badge.text}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {kyc.submitted_at || '-'}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {kyc.created_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Link href={`/admin/kyc/${kyc.id}`}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                                        title="View KYC Details"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {kycs.meta && kycs.meta.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-6">
                                            <div className="text-sm text-muted-foreground">
                                                Showing {kycs.meta?.from || 0} to {kycs.meta?.to || 0} of {kycs.meta?.total || 0} results
                                            </div>
                                            <div className="flex space-x-2">
                                                {kycs.links?.map((link, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={link.active ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={!link.url}
                                                        onClick={() => link.url && router.visit(link.url)}
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