import { Head, router } from '@inertiajs/react';
import { Users, Trash2, Edit, BadgeCheckIcon, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    roles: string[];
    is_active: boolean;
    joined_at: string;
    teams_count: number;
    email_verified_at: string | null;
    can_be_removed: boolean;
}

interface Team {
    id: number;
    name: string;
    team_id: string;
}

interface Permissions {
    canManageMembers: boolean;
    isTeamOwner: boolean;
    userRoles: string[];
}

interface Props {
    members: Member[];
    team: Team;
    permissions: Permissions;
    roles: { id: number; name: string; }[];
}

export default function MembersIndex({ members, team, permissions, roles }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter members based on search and filters
    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            roleFilter === 'all' || member.roles.includes(roleFilter);
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && member.is_active) ||
            (statusFilter === 'inactive' && !member.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/team/members', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };
    const handleToggleStatus = (memberId: number, currentStatus: boolean) => {
        router.patch(`/members/${memberId}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleEdit = (memberId: number) => {
        // TODO: Implement edit functionality
        console.log('Edit member:', memberId);
    };

    const handleMemberRemove = (memberId: number, memberName: string) => {
        toast.promise(
            new Promise((resolve, reject) => {
                router.delete(`/members/${memberId}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        resolve({ name: memberName });
                    },
                    onError: (errors) => {
                        reject(new Error('Failed to remove member'));
                    }
                });
            }),
            {
                loading: "Removing member...",
                success: (data: any) => `${data.name} has been removed from the team`,
                error: "Failed to remove member",
            }
        );
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <Head title="Members" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">Team Members</h1>
                                <p className="text-muted-foreground">
                                    Manage members of {team.name} (Code: {team.team_id})
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Members List</CardTitle>
                                            <CardDescription>
                                                Total {filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRefresh}
                                                disabled={isRefreshing}
                                                className="flex items-center gap-2  cursor-pointer"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                                {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters */}
                                    <div className="justify-between items-center mb-6 flex flex-col gap-4 sm:flex-row">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className='flex gap-2'>
                                            {/* <Select
                                                value={roleFilter}
                                                onValueChange={setRoleFilter}
                                            >
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Roles</SelectItem>
                                                    {roles?.map((role) => (
                                                        <SelectItem key={role.id} value={role.name}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select> */}
                                            <Select
                                                value={statusFilter}
                                                onValueChange={setStatusFilter}
                                            >
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {filteredMembers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground text-center">
                                                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                                                    ? 'No members found matching your filters.'
                                                    : 'No members in this team yet.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Roles</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Joined</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredMembers.map((member) => (
                                                        <TableRow key={member.id}>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{member.name}</span>
                                                                    {member.teams_count === 1 && (
                                                                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                                                            Only Team
                                                                        </Badge>
                                                                    )}
                                                                    {member.teams_count > 1 && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {member.teams_count} Teams
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="flex items-center gap-1">
                                                                    {member.email}
                                                                    {member?.email_verified_at && (
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <BadgeCheckIcon size={15} className="text-green-500" />
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Verified</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    )}
                                                                </span>
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {member.roles.length > 0 ? (
                                                                        member.roles.map((role) => (
                                                                            <Badge
                                                                                key={role}
                                                                                variant="secondary"
                                                                                className="text-xs"
                                                                            >
                                                                                {role}
                                                                            </Badge>
                                                                        ))
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            No Role
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {/* <Badge
                                                                        variant={member.is_active ? 'default' : 'destructive'}
                                                                    >
                                                                        {member.is_active ? 'Active' : 'Inactive'}
                                                                    </Badge> */}
                                                                    {permissions.canManageMembers && (
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                                                                    <Badge
                                                                                        variant={member.is_active ? 'default' : 'destructive'}
                                                                                        className="cursor-pointer text-xs"
                                                                                    >
                                                                                        {!member.is_active ? 'Inactive' : 'Active'}
                                                                                    </Badge>
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="start" className="w-32">
                                                                                <DropdownMenuCheckboxItem
                                                                                    checked={!member.is_active}
                                                                                    onCheckedChange={() =>
                                                                                        handleToggleStatus(member.id, member.is_active)
                                                                                    }
                                                                                >
                                                                                    {member.is_active ? 'Inactive' : 'Active'}
                                                                                </DropdownMenuCheckboxItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {member.joined_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {permissions.canManageMembers && (
                                                                    <div className="flex items-center justify-end">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleEdit(member.id)}
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        {member.can_be_removed ? (
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
                                                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            This action cannot be undone. This will permanently remove <b>{member.name}</b> from the team and remove their access to all team resources.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction className='cursor-pointer'
                                                                                            onClick={() => handleMemberRemove(member.id, member.name)}
                                                                                        >
                                                                                            Remove Member
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        ) : (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                disabled
                                                                                className="h-8 w-8 p-0 cursor-pointer text-muted-foreground cursor-not-allowed"
                                                                                title={`Cannot remove ${member.name}. User must belong to at least one team.`}
                                                                            >
                                                                                <Trash2 className="h-4 w-4 " />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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
        </SidebarProvider>
    );
}
