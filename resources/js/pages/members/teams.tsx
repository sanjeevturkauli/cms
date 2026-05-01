import { Head, router } from '@inertiajs/react';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
    teams: PaginatedTeams;
    filters: {
        search: string;
        status: string;
        is_active: string;
    };
}

export default function MemberTeams({ teams, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [isActive, setIsActive] = useState(filters.is_active || '');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Status configuration
    const statusConfig: Record<
        string,
        { label: string; className: string }
    > = {
        pending: {
            label: 'Pending',
            className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        },
        approved: {
            label: 'Approved',
            className: 'bg-green-100 text-green-800 border-green-200',
        },
        rejected: {
            label: 'Rejected',
            className: 'bg-red-100 text-red-800 border-red-200',
        },
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters();
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Apply filters immediately for dropdowns
    useEffect(() => {
        if (filters.status !== status || filters.is_active !== isActive) {
            applyFilters();
        }
    }, [status, isActive]);

    const applyFilters = () => {
        router.get(
            '/member/teams',
            {
                search: search,
                status: status,
                is_active: isActive,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get(
            '/member/teams',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsRefreshing(false),
            },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/member/teams',
            {
                page: page,
                search: search,
                status: status,
                is_active: isActive,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleViewTeam = (signedUrl: string) => {
        router.visit(signedUrl);
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
            <Head title="My Teams" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">
                                        My Teams
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Teams you are a member of
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="cursor-pointer"
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                    />
                                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>

                            {/* Filters */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Filters</CardTitle>
                                    <CardDescription>
                                        Search and filter your teams
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="md:col-span-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search by team name or code..."
                                                    value={search}
                                                    onChange={(e) =>
                                                        setSearch(e.target.value)
                                                    }
                                                    className="pl-8"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Select
                                                value={status}
                                                onValueChange={setStatus}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">
                                                        All Status
                                                    </SelectItem>
                                                    <SelectItem value="pending">
                                                        Pending
                                                    </SelectItem>
                                                    <SelectItem value="approved">
                                                        Approved
                                                    </SelectItem>
                                                    <SelectItem value="rejected">
                                                        Rejected
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Select
                                                value={isActive}
                                                onValueChange={setIsActive}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Active Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">
                                                        All Active Status
                                                    </SelectItem>
                                                    <SelectItem value="1">
                                                        Active
                                                    </SelectItem>
                                                    <SelectItem value="0">
                                                        Inactive
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Teams Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Teams List</CardTitle>
                                    <CardDescription>
                                        Showing {teams.from || 0} to{' '}
                                        {teams.to || 0} of {teams.total} teams
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Team Name</TableHead>
                                                    <TableHead>Team Code</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Active</TableHead>
                                                    <TableHead>Members</TableHead>
                                                    <TableHead>Joined Date</TableHead>
                                                    <TableHead className="text-right">
                                                        Actions
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {teams.data.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="text-center py-8 text-muted-foreground"
                                                        >
                                                            No teams found. You are not a member of any team yet.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    teams.data.map((team) => (
                                                        <TableRow key={team.id}>
                                                            <TableCell className="font-medium">
                                                                {team.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="font-mono text-xs"
                                                                >
                                                                    {team.team_id}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={`text-xs ${statusConfig[team.status]?.className ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                                                    variant="outline"
                                                                >
                                                                    {statusConfig[team.status]?.label ?? 'Unknown'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        team.is_active
                                                                            ? 'default'
                                                                            : 'destructive'
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {team.is_active
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {team.members_count}
                                                            </TableCell>
                                                            <TableCell>
                                                                {team.joined_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleViewTeam(
                                                                            team.signed_url,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
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
                                    {teams.last_page > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Page {teams.current_page} of{' '}
                                                {teams.last_page}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            teams.current_page - 1,
                                                        )
                                                    }
                                                    disabled={
                                                        teams.current_page === 1
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            teams.current_page + 1,
                                                        )
                                                    }
                                                    disabled={
                                                        teams.current_page ===
                                                        teams.last_page
                                                    }
                                                    className="cursor-pointer"
                                                >
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
