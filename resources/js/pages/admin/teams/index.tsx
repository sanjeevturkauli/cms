import { Head, router } from '@inertiajs/react';
import {
    Edit,
    Eye,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Users,
    Building2,
} from 'lucide-react';
import { useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface TeamMember {
    id: number;
    user_id: number;
    name: string;
    email: string;
    is_active: boolean;
    joined_at: string;
}

interface TeamOwner {
    id: number;
    name: string;
    email: string;
}

interface Team {
    id: number;
    name: string;
    team_id: string;
    owner: TeamOwner;
    members_count: number;
    is_active: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    members: TeamMember[];
}

interface Props {
    teams: Team[];
    permissions: {
        canDeleteTeams: boolean;
        canEditTeams: boolean;
        canCreateTeams: boolean;
        canViewTeams: boolean;
        canToggleStatus: boolean;
    };
}
export default function AdminTeamsIndex({ teams, permissions }: Props) {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [dialogType, setDialogType] = useState<'edit' | 'view' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const statusConfig: Record<
        string,
        { label: string; className: string }
    > = {
        pending: {
            label: "Pending",
            className: "bg-yellow-500 text-white",
        },
        approved: {
            label: "Approved",
            className: "bg-green-600 text-white",
        },
        rejected: {
            label: "Rejected",
            className: "bg-red-600 text-white",
        },
    };

    // Edit form states
    const [editForm, setEditForm] = useState({
        name: '',
        status: 'pending' as 'pending' | 'approved' | 'rejected',
        is_active: true,
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter teams based on search and filters
    const filteredTeams = teams.filter((team) => {
        const matchesSearch =
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.team_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.owner.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && team.is_active) ||
            (statusFilter === 'inactive' && !team.is_active);

        return matchesSearch && matchesStatus;
    });

    const handleEdit = (teamId: number) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
            setEditForm({
                name: team.name,
                status: team.status,
                is_active: team.is_active,
            });
            setDialogType('edit');
            setIsDialogOpen(true);
        }
    };

    const handleToggleActive = (teamId: number, currentStatus: boolean) => {
        router.patch(
            `/admin/teams/${teamId}/toggle-active`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleUpdateStatus = (teamId: number, status: 'pending' | 'approved' | 'rejected') => {
        router.patch(
            `/admin/teams/${teamId}/status`,
            { status },
            {
                preserveScroll: true,
            },
        );
    };

    const handleView = (teamId: number) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            setSelectedTeam(team);
            setDialogType('view');
            setIsDialogOpen(true);
        }
    };

    const handleSaveEdit = () => {
        if (!selectedTeam) return;

        router.patch(`/admin/teams/${selectedTeam.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                setSelectedTeam(null);
                setEditForm({ name: '', status: 'pending', is_active: true });
            },
        });
    };

    const handleDelete = (teamId: number, teamName: string) => {
        router.delete(`/admin/teams/${teamId}`, {
            preserveScroll: true,
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/admin/teams', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedTeam(null);
        setEditForm({ name: '', status: 'pending', is_active: true });
        setDialogType(null);
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
            <Head title="Team Management" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Team Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage all teams and their members
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Teams List</CardTitle>
                                            <CardDescription>
                                                Total {filteredTeams.length} of{' '}
                                                {teams.length} team
                                                {teams.length !== 1 ? 's' : ''}
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
                                                placeholder="Search by team name, code, or owner..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className='flex gap-2'>
                                            <Select
                                                value={statusFilter}
                                                onValueChange={setStatusFilter}
                                            >
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All Status
                                                    </SelectItem>
                                                    <SelectItem value="active">
                                                        Active
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        Inactive
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {filteredTeams.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'No teams found matching your filters.'
                                                    : 'No teams found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            Team
                                                        </TableHead>
                                                        <TableHead>
                                                            Owner
                                                        </TableHead>
                                                        <TableHead>
                                                            Members
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead>
                                                            Active
                                                        </TableHead>
                                                        <TableHead>
                                                            Created
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredTeams.map(
                                                        (team) => (
                                                            <TableRow key={team.id}>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {team.name}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            Code: {team.team_id}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {team.owner.name}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {team.owner.email}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                                        <span>{team.members_count}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Badge
                                                                                    className={`cursor-pointer text-xs ${statusConfig[team.status]?.className ??
                                                                                        "bg-gray-500 text-white"
                                                                                        }`}
                                                                                >
                                                                                    {statusConfig[team.status]?.label ?? "Unknown"}
                                                                                </Badge>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="start" className="w-32">
                                                                                <DropdownMenuCheckboxItem
                                                                                    checked={team.status === 'pending'}
                                                                                    onCheckedChange={() => handleUpdateStatus(team.id, 'pending')}
                                                                                >
                                                                                    Pending
                                                                                </DropdownMenuCheckboxItem>
                                                                                <DropdownMenuCheckboxItem
                                                                                    checked={team.status === 'approved'}
                                                                                    onCheckedChange={() => handleUpdateStatus(team.id, 'approved')}
                                                                                >
                                                                                    Approved
                                                                                </DropdownMenuCheckboxItem>
                                                                                <DropdownMenuCheckboxItem
                                                                                    checked={team.status === 'rejected'}
                                                                                    onCheckedChange={() => handleUpdateStatus(team.id, 'rejected')}
                                                                                >
                                                                                    Rejected
                                                                                </DropdownMenuCheckboxItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Badge
                                                                                    variant={
                                                                                        team.is_active
                                                                                            ? 'default'
                                                                                            : 'destructive'
                                                                                    }
                                                                                    className="cursor-pointer text-xs"
                                                                                >
                                                                                    {team.is_active
                                                                                        ? 'Active'
                                                                                        : 'Inactive'}
                                                                                </Badge>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="start" className="w-32">
                                                                                <DropdownMenuCheckboxItem
                                                                                    checked={!team.is_active}
                                                                                    onCheckedChange={() => handleToggleActive(team.id, team.is_active)}
                                                                                >
                                                                                    {team.is_active ? 'Inactive' : 'Active'}
                                                                                </DropdownMenuCheckboxItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">
                                                                    {team.created_at}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleView(team.id)}
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        {permissions.canEditTeams && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleEdit(team.id)}
                                                                                className="h-8 w-8 p-0 cursor-pointer"
                                                                                title="Edit Team"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                        {permissions.canDeleteTeams && (
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0 cursor-pointer text-destructive hover:text-destructive"
                                                                                        title="Delete Team"
                                                                                    >
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Are you sure you want to delete this team?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            Team "{team.name}" with {team.members_count} member(s) will be permanently deleted. This action cannot be undone.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction
                                                                                            onClick={() => handleDelete(team.id, team.name)}
                                                                                            className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                                                                        >
                                                                                            Delete Team
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
            {/* Edit/View Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'edit' && `Edit Team - ${selectedTeam?.name}`}
                            {dialogType === 'view' && `Team Details - ${selectedTeam?.name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'edit' && 'Update team information below.'}
                            {dialogType === 'view' && 'View detailed information about this team and its members.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {dialogType === 'view' && selectedTeam && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Team Name</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedTeam.name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Team Code</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedTeam.team_id}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Owner</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            <div className="font-medium">{selectedTeam.owner.name}</div>
                                            <div className="text-sm text-muted-foreground">{selectedTeam.owner.email}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            <Badge variant={
                                                selectedTeam.status === 'approved'
                                                    ? 'default'
                                                    : selectedTeam.status === 'pending'
                                                        ? 'secondary'
                                                        : 'destructive'
                                            }>
                                                {selectedTeam.status === 'pending' && 'Pending'}
                                                {selectedTeam.status === 'approved' && 'Approved'}
                                                {selectedTeam.status === 'rejected' && 'Rejected'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Active Status</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            <Badge variant={selectedTeam.is_active ? 'default' : 'destructive'}>
                                                {selectedTeam.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Team Members ({selectedTeam.members_count})</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        {selectedTeam.members.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedTeam.members.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                                        <div>
                                                            <div className="font-medium">{member.name}</div>
                                                            <div className="text-sm text-muted-foreground">{member.email}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={member.is_active ? 'default' : 'destructive'} className="text-xs">
                                                                {member.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                Joined: {member.joined_at}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No members in this team</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedTeam.created_at}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedTeam.updated_at}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {dialogType === 'edit' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Team Name</Label>
                                        <Input
                                            id="name"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter team name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={editForm.status}
                                            onValueChange={(value: 'pending' | 'approved' | 'rejected') => setEditForm(prev => ({ ...prev, status: value }))}
                                        >
                                            <SelectTrigger className='w-full'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="active">Active Status</Label>
                                        <Select
                                            value={editForm.is_active ? 'active' : 'inactive'}
                                            onValueChange={(value) => setEditForm(prev => ({ ...prev, is_active: value === 'active' }))}
                                        >
                                            <SelectTrigger className='w-full'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {dialogType === 'edit' && (
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog} className='cursor-pointer'>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveEdit} className='cursor-pointer'>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}