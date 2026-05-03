import { Head, router } from '@inertiajs/react';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Team {
    id: number;
    name: string;
    team_id: string;
    status: 'pending' | 'approved' | 'rejected';
    is_active: boolean;
    members_count: number;
    joined_at: string;
    created_at: string;
    signed_url: string;
}

interface PaginatedTeams {
    data: Team[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    memberTeams: PaginatedTeams;
    filters: {
        search: string;
        status: string;
        is_active: string;
    };
}

export default function MemberTeams({ memberTeams: teams, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [isActive, setIsActive] = useState(filters.is_active || 'all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const statusConfig: Record<string, { label: string; className: string }> = {
        pending:  { label: 'Pending',  className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
        rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
    };

    useEffect(() => {
        const timer = setTimeout(() => applyFilters(), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (filters.status !== status || filters.is_active !== isActive) {
            applyFilters();
        }
    }, [status, isActive]);

    const applyFilters = () => {
        router.get('/member/teams', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            is_active: isActive !== 'all' ? isActive : undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/member/teams', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <SidebarProvider style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}>
            <Head title="My Teams" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">My Teams</h1>
                                <p className="text-muted-foreground">Teams you are a member of</p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Teams List</CardTitle>
                                            <CardDescription>
                                                Total {teams?.from || 0} of {teams?.total || 0} teams
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="cursor-pointer">
                                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters - same style as Users Management */}
                                    <div className="justify-between items-center mb-6 flex flex-col gap-4 sm:flex-row">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search by team name or code..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="w-full sm:w-[160px]">
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="approved">Approved</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={isActive} onValueChange={setIsActive}>
                                                <SelectTrigger className="w-full sm:w-[160px]">
                                                    <SelectValue placeholder="All Active Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Active Status</SelectItem>
                                                    <SelectItem value="1">Active</SelectItem>
                                                    <SelectItem value="0">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Team Name</TableHead>
                                                    <TableHead>Team Code</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Active</TableHead>
                                                    <TableHead>Members</TableHead>
                                                    <TableHead>Joined Date</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!teams?.data || teams.data.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                            No teams found. You are not a member of any team yet.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    teams.data.map((team) => (
                                                        <TableRow key={team.id}>
                                                            <TableCell>
                                                                <div className="font-medium">{team.name}</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className="font-mono text-xs">
                                                                    {team.team_id}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={`text-xs ${statusConfig[team.status]?.className ?? 'bg-gray-100 text-gray-800'}`}
                                                                    variant="outline"
                                                                >
                                                                    {statusConfig[team.status]?.label ?? 'Unknown'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={team.is_active ? 'default' : 'destructive'} className="text-xs">
                                                                    {team.is_active ? 'Active' : 'Inactive'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {team.members_count}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {team.joined_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => router.visit(team.signed_url)}
                                                                    className="h-8 w-8 p-0 cursor-pointer"
                                                                    title="View Team Details"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {teams?.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Showing {teams.from} to {teams.to} of {teams.total} teams
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" disabled={teams.current_page === 1}
                                                    onClick={() => router.get('/member/teams', { page: teams.current_page - 1, search, status, is_active: isActive }, { preserveState: true })}>
                                                    Previous
                                                </Button>
                                                <Button variant="outline" size="sm" disabled={teams.current_page === teams.last_page}
                                                    onClick={() => router.get('/member/teams', { page: teams.current_page + 1, search, status, is_active: isActive }, { preserveState: true })}>
                                                    Next
                                                </Button>
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
