import { Head, router, useForm } from '@inertiajs/react';
import { Check, Copy, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { join, store, toggleActive } from '@/routes/teams';

interface Team {
    id: number;
    name: string;
    team_id: string;
    status: 'pending' | 'approved' | 'rejected';
    members_count?: number;
    is_active?: boolean;
    created_at?: string;
    joined_at?: string;
    can_be_deleted?: boolean;
    total_teams_owned?: number;
}

interface Props {
    teams: Team[];
    isTeamOwner: boolean;
    canManageTeams: boolean;
    userRoles: string[];
    permissions: {
        canDeleteTeams: boolean;
        canEditTeams: boolean;
        canCreateTeams: boolean;
        canViewTeams: boolean;
    };
}

export default function TeamsIndex({ teams, isTeamOwner, permissions }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [copiedTeamId, setCopiedTeamId] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [formData, setFormData] = useState({
        team_code: '',
    });

    // Status configuration for colors
    const statusConfig: Record<
        string,
        { label: string; className: string }
    > = {
        pending: {
            label: "Pending",
            className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        },
        approved: {
            label: "Approved", 
            className: "bg-green-100 text-green-800 border-green-200",
        },
        rejected: {
            label: "Rejected",
            className: "bg-red-100 text-red-800 border-red-200",
        },
    };

    // useForm for Create Team
    const {
        data: createData,
        setData: setCreateData,
        post: createPost,
        processing: createProcessing,
        errors: createErrors,
        reset: createReset,
    } = useForm({
        name: '',
    });

    // useForm for Join Team
    const {
        data: joinData,
        setData: setJoinData,
        post: joinPost,
        processing: joinProcessing,
        errors: joinErrors,
        reset: joinReset,
    } = useForm({
        team_code: '',
    });

    const handleCopyTeamCode = (teamCode: string, teamId: number) => {
        navigator.clipboard.writeText(teamCode);
        setCopiedTeamId(teamId);
        setTimeout(() => setCopiedTeamId(null), 2000);
    };

    const handleCreateTeam = (e: React.FormEvent) => {
        e.preventDefault();

        createPost(store.url(), {
            onSuccess: () => {
                createReset();
                setIsDialogOpen(false);
            },
        });
    };

    const handleJoinTeam = (e: React.FormEvent) => {
        e.preventDefault();

        joinPost(join.url(), {
            onSuccess: () => {
                joinReset();
                setIsDialogOpen(false);
            },
        });
    };

    const handleToggleActive = (teamId: number) => {
        router.patch(
            toggleActive.url(teamId),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleDeleteTeam = (teamId: number) => {
        router.delete(`/team/${teamId}`, {
            preserveScroll: true,
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/teams', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
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
            <Head title="Teams" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">
                                        Teams
                                    </h1>
                                    <p className="text-muted-foreground">
                                        {isTeamOwner
                                            ? 'Manage your teams'
                                            : 'Your team memberships'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
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

                                    <Dialog
                                        open={isDialogOpen}
                                        onOpenChange={setIsDialogOpen}
                                    >
                                        <DialogTrigger asChild>
                                            <Button className="cursor-pointer">
                                                <Plus className="h-4 w-4" />
                                                {isTeamOwner
                                                    ? 'Create New Team'
                                                    : 'Join New Team'}
                                            </Button>
                                        </DialogTrigger>
                                    <DialogContent>
                                        <form
                                            onSubmit={
                                                isTeamOwner
                                                    ? handleCreateTeam
                                                    : handleJoinTeam
                                            }
                                        >
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {isTeamOwner
                                                        ? 'Create New Team'
                                                        : 'Join New Team'}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {isTeamOwner
                                                        ? 'Create a new team and get a unique team code to share with members.'
                                                        : 'Enter the team code provided by your team owner to join.'}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="grid gap-4 py-4">
                                                {isTeamOwner ? (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">
                                                            Team Name
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            value={
                                                                createData.name
                                                            }
                                                            onChange={(e) =>
                                                                setCreateData(
                                                                    'name',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Enter team name"
                                                            required
                                                        />
                                                        {createErrors.name && (
                                                            <p className="text-sm text-red-500">
                                                                {
                                                                    createErrors.name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="team_code">
                                                            Team Code
                                                        </Label>
                                                        <Input
                                                            id="team_code"
                                                            value={
                                                                joinData.team_code
                                                            }
                                                            onChange={(e) =>
                                                                setJoinData(
                                                                    'team_code',
                                                                    e.target.value.toUpperCase(),
                                                                )
                                                            }
                                                            placeholder="Enter team code (e.g., HDJFU764)"
                                                            maxLength={8}
                                                            className="uppercase"
                                                            required
                                                        />
                                                        {joinErrors.team_code && (
                                                            <p className="text-sm text-red-500">
                                                                {
                                                                    joinErrors.team_code
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        isTeamOwner
                                                            ? createProcessing
                                                            : joinProcessing
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    {(isTeamOwner
                                                        ? createProcessing
                                                        : joinProcessing) && (
                                                        <Spinner className="mr-2" />
                                                    )}
                                                    {isTeamOwner
                                                        ? 'Create Team'
                                                        : 'Join Team'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {teams.length === 0 ? (
                                    <Card className="col-span-full">
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {isTeamOwner
                                                    ? 'No teams yet. Create your first team to get started.'
                                                    : 'Not a member of any team yet. Join a team using a team code.'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    teams.map((team) => (
                                        <Card
                                            key={team.id}
                                            className={`relative border-l-4 ${
                                                team.status === 'approved' 
                                                    ? 'border-l-green-500' 
                                                    : team.status === 'pending'
                                                    ? 'border-l-yellow-500'
                                                    : 'border-l-red-500'
                                            }`}
                                        >
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle 
                                                            className="cursor-pointer hover:text-primary transition-colors"
                                                            onClick={() => router.get(`/teams/${team.id}/info`)}
                                                        >
                                                            {team.name}
                                                        </CardTitle>
                                                        <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                                                            <span>
                                                                Team Code:
                                                            </span>
                                                            <Badge
                                                                variant="secondary"
                                                                className="font-mono text-sm"
                                                            >
                                                                {team.team_id}
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 cursor-pointer p-0"
                                                                onClick={() =>
                                                                    handleCopyTeamCode(
                                                                        team.team_id,
                                                                        team.id,
                                                                    )
                                                                }
                                                            >
                                                                {copiedTeamId ===
                                                                team.id ? (
                                                                    <Check className="h-3 w-3 text-green-500" />
                                                                ) : (
                                                                    <Copy className="h-3 w-3" />
                                                                )}
                                                            </Button>
                                                        </CardDescription>
                                                        
                                                        {/* Status Badge */}
                                                        <div className="mt-2">
                                                            <Badge
                                                                className={`text-xs ${statusConfig[team.status]?.className ?? "bg-gray-100 text-gray-800 border-gray-200"}`}
                                                                variant="outline"
                                                            >
                                                                {statusConfig[team.status]?.label ?? "Unknown"}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Delete Button in Top Right */}
                                                    {permissions.canDeleteTeams && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="ml-2 h-8 w-8 p-0 text-destructive cursor-pointer hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title={
                                                                        !team.can_be_deleted 
                                                                            ? (team.total_teams_owned === 1 
                                                                                ? "Cannot delete your only team" 
                                                                                : "Remove all members first")
                                                                            : "Delete Team"
                                                                    }
                                                                    disabled={!team.can_be_deleted}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Delete Team
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete the team "{team.name}"?
                                                                        
                                                                        {team.members_count && team.members_count > 0 && (
                                                                            <span className="mt-2 block font-medium text-destructive">
                                                                                Warning: This team has {team.members_count} member(s). 
                                                                                Please remove all members before deleting the team.
                                                                            </span>
                                                                        )}
                                                                        
                                                                        {team.total_teams_owned === 1 && (
                                                                            <span className="mt-2 block font-medium text-destructive">
                                                                                Warning: This is your only team. You must have at least one team.
                                                                            </span>
                                                                        )}
                                                                        
                                                                        {team.can_be_deleted && (
                                                                            <span className="mt-2 block">
                                                                                This action cannot be undone. All team data will be permanently deleted.
                                                                            </span>
                                                                        )}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className='cursor-pointer'>
                                                                        Cancel
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteTeam(team.id)}
                                                                        disabled={!team.can_be_deleted}
                                                                        className="bg-destructive text-white cursor-pointer hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        Delete Team
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {isTeamOwner ? (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Users className="h-4 w-4" />
                                                            <span>
                                                                {
                                                                    team.members_count
                                                                }{' '}
                                                                members
                                                            </span>
                                                            <span className="ml-auto">
                                                                {
                                                                    team.created_at
                                                                }
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">
                                                            Joined:{' '}
                                                            {team.joined_at}
                                                        </div>
                                                    )}

                                                    {permissions.canEditTeams && (
                                                        <div className="flex items-center justify-between border-t pt-2">
                                                            <Label
                                                                htmlFor={`team-${team.id}`}
                                                                className="cursor-pointer text-sm font-medium"
                                                            >
                                                                Active Status
                                                            </Label>
                                                            <Switch
                                                                id={`team-${team.id}`}
                                                                checked={
                                                                    team.is_active
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleToggleActive(
                                                                        team.id,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
