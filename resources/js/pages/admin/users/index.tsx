import { Head, router } from '@inertiajs/react';
import {
    Edit,
    Eye,
    Key,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
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
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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

interface User {
    id: number;
    name: string;
    email: string;
    mobile?: string;
    is_active: boolean;
    roles: string[];
    permissions: string[];
    created_at: string;
    roles_count: number;
}

interface Role {
    id: number;
    name: string;
}

interface Permission {
    id: number;
    name: string;
}

interface Props {
    users: User[];
    roles: Role[];
    permissions: Permission[];
}

export default function UsersIndex({ users, roles, permissions }: Props) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedPermission, setSelectedPermission] = useState<string[]>([]);
    const [dialogType, setDialogType] = useState<'role' | 'permission' | 'edit' | 'view' | null>(
        null,
    );
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Edit form states
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        mobile: '',
        is_active: true,
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter users based on search and filters
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.mobile && user.mobile.includes(searchTerm));

        const matchesRole =
            roleFilter === 'all' || user.roles.includes(roleFilter);
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleToggleStatus = (userId: number, currentStatus: boolean) => {
        router.patch(
            `/admin/users/${userId}/toggle-status`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleAssignRoleQuick = (user: User, roleName: string) => {
        router.post(`/admin/users/${user.id}/assign-role`, {
            role: roleName,
        }, {
            preserveScroll: true,
        });
    };

    const handleEdit = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setSelectedUser(user);
            setEditForm({
                name: user.name,
                email: user.email,
                mobile: user.mobile || '',
                is_active: user.is_active,
            });
            setDialogType('edit');
            setIsDialogOpen(true);
        }
    };

    const handleView = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setSelectedUser(user);
            setDialogType('view');
            setIsDialogOpen(true);
        }
    };

    const handleSaveEdit = () => {
        if (!selectedUser) return;

        router.patch(`/admin/users/${selectedUser.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
                setSelectedUser(null);
                setEditForm({ name: '', email: '', mobile: '', is_active: true });
            },
        });
    };

    const handleDelete = (userId: number, userName: string) => {
        router.delete(`/admin/users/${userId}`, {
            preserveScroll: true,
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/admin/users', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const handleAssignRole = () => {
        if (!selectedUser || !selectedRole) return;

        router.post(
            `/admin/users/${selectedUser.id}/assign-role`,
            {
                role: selectedRole,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setSelectedRole('');
                },
            },
        );
    };

    const handleRemoveRole = (user: User, role: string) => {
        // Prevent removing the last role
        if (user.roles.length <= 1) {
            alert('User must have at least one role. Cannot remove the last role.');
            return;
        }

        router.delete(`/admin/users/${user.id}/remove-role`, {
            data: { role },
            preserveScroll: true,
        });
    };

    const handleAssignPermission = () => {
        if (!selectedUser || !selectedPermission.length) return;

        // Assign multiple permissions
        selectedPermission.forEach(permission => {
            router.post(
                `/admin/users/${selectedUser.id}/assign-permission`,
                {
                    permission: permission,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        // Only close dialog after all permissions are assigned
                        if (permission === selectedPermission[selectedPermission.length - 1]) {
                            setIsDialogOpen(false);
                            setSelectedPermission([]);
                        }
                    },
                },
            );
        });
    };

    const handleRemovePermission = (user: User, permission: string) => {
        router.delete(`/admin/users/${user.id}/remove-permission`, {
            data: { permission },
            preserveScroll: true,
        });
    };

    const openDialog = (user: User, type: 'role' | 'permission') => {
        setSelectedUser(user);
        setDialogType(type);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedUser(null);
        setSelectedRole('');
        setSelectedPermission([]);
        setEditForm({ name: '', email: '', mobile: '', is_active: true });
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
            <Head title="User Management" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    User Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage user roles and permissions
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Users List</CardTitle>
                                            <CardDescription>
                                                Total {filteredUsers.length} of{' '}
                                                {users.length} user
                                                {users.length !== 1 ? 's' : ''}
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
                                                placeholder="Search by name, email, or mobile..."
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
                                                value={roleFilter}
                                                onValueChange={setRoleFilter}
                                            >
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All Roles
                                                    </SelectItem>
                                                    {roles.map((role) => (
                                                        <SelectItem
                                                            key={role.id}
                                                            value={role.name}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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

                                    {filteredUsers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {searchTerm ||
                                                    roleFilter !== 'all' ||
                                                    statusFilter !== 'all'
                                                    ? 'No users found matching your filters.'
                                                    : 'No users found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            User
                                                        </TableHead>
                                                        <TableHead>
                                                            Mobile Number
                                                        </TableHead>
                                                        <TableHead>
                                                            Status
                                                        </TableHead>
                                                        <TableHead>
                                                            Roles
                                                        </TableHead>
                                                        <TableHead>
                                                            Direct Permissions
                                                        </TableHead>
                                                        <TableHead>
                                                            Joined
                                                        </TableHead>
                                                        <TableHead className="text-right">
                                                            Actions
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredUsers.map(
                                                        (user) => (
                                                            <TableRow key={user.id}>
                                                                <TableCell>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {
                                                                                user.name
                                                                            }
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {
                                                                                user.email
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {user.mobile ? (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {user.mobile}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            N/A
                                                                        </div>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 px-2"
                                                                                >
                                                                                    <Badge
                                                                                        variant={
                                                                                            user.is_active
                                                                                                ? 'default'
                                                                                                : 'destructive'
                                                                                        }
                                                                                        className="cursor-pointer text-xs"
                                                                                    >
                                                                                        {!user.is_active
                                                                                            ? 'Inactive'
                                                                                            : 'Active'}
                                                                                    </Badge>
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent
                                                                                align="start"
                                                                                className="w-32"
                                                                            >
                                                                                <DropdownMenuCheckboxItem
                                                                                    checked={
                                                                                        !user.is_active
                                                                                    }
                                                                                    onCheckedChange={() =>
                                                                                        handleToggleStatus(
                                                                                            user.id,
                                                                                            user.is_active,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {user.is_active
                                                                                        ? 'Inactive'
                                                                                        : 'Active'}
                                                                                </DropdownMenuCheckboxItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap items-center gap-1">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                {/* <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-6 px-2"
                                                                                > */}
                                                                                <Badge
                                                                                    variant="default"
                                                                                    className="cursor-pointer text-xs"
                                                                                >
                                                                                    {user.roles.length > 0 ? user.roles.join(', ') : 'No Roles'}
                                                                                </Badge>
                                                                                {/* </Button> */}
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent
                                                                                align="start"
                                                                                className="w-40"
                                                                            >
                                                                                {roles.map((role) => {
                                                                                    const isChecked = user.roles.includes(role.name);
                                                                                    const isLastRole = user.roles.length === 1 && isChecked;

                                                                                    return (
                                                                                        <DropdownMenuCheckboxItem
                                                                                            key={role.id}
                                                                                            checked={isChecked}
                                                                                            disabled={isLastRole}
                                                                                            onCheckedChange={(checked) => {
                                                                                                if (checked) {
                                                                                                    handleAssignRoleQuick(user, role.name);
                                                                                                } else {
                                                                                                    handleRemoveRole(user, role.name);
                                                                                                }
                                                                                            }}
                                                                                            className={isLastRole ? 'opacity-50 cursor-not-allowed' : ''}
                                                                                        >
                                                                                            {role.name}
                                                                                            {/* {isLastRole && (
                                                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                                                    (Required)
                                                                                                </span>
                                                                                            )} */}
                                                                                        </DropdownMenuCheckboxItem>
                                                                                    );
                                                                                })}
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {user
                                                                            .permissions
                                                                            .length >
                                                                            0 ? (
                                                                            user.permissions.map(
                                                                                (
                                                                                    permission,
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            permission
                                                                                        }
                                                                                        variant="outline"
                                                                                        className="group cursor-pointer text-xs"
                                                                                        onClick={() =>
                                                                                            handleRemovePermission(
                                                                                                user,
                                                                                                permission,
                                                                                            )
                                                                                        }
                                                                                        title={`Click to remove ${permission} permission`}
                                                                                    >
                                                                                        {
                                                                                            permission
                                                                                        }
                                                                                        <Trash2 className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100" />
                                                                                    </Badge>
                                                                                ),
                                                                            )
                                                                        ) : (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                No
                                                                                Direct
                                                                                Permissions
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">
                                                                    {
                                                                        user.created_at
                                                                    }
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleView(user.id)}
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            title="View Details"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleEdit(user.id)}
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            title="Edit User"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => openDialog(user, 'permission')}
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            title="Assign Permission"
                                                                        >
                                                                            <Key className="h-4 w-4" />
                                                                        </Button>
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
                                                                                    <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Once this user is deleted, all of their resources and data will be permanently deleted. This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDelete(user.id, user.name)}
                                                                                        className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                                                                    >
                                                                                        Delete User
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
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

            {/* Assign Role/Permission Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'role' && `Assign Role to ${selectedUser?.name}`}
                            {dialogType === 'permission' && `Assign Permission to ${selectedUser?.name}`}
                            {dialogType === 'edit' && `Edit User - ${selectedUser?.name}`}
                            {dialogType === 'view' && `User Details - ${selectedUser?.name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'role' && 'Select a role to assign to this user.'}
                            {dialogType === 'permission' && 'Select permissions to assign directly to this user.'}
                            {dialogType === 'edit' && 'Update user information below.'}
                            {dialogType === 'view' && 'View detailed information about this user.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {dialogType === 'view' && selectedUser && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedUser.name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedUser.email}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Mobile</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedUser.mobile || 'Not provided'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            <Badge variant={selectedUser.is_active ? 'default' : 'destructive'}>
                                                {selectedUser.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Assigned Roles</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.roles.length > 0 ? (
                                                selectedUser.roles.map((role) => (
                                                    <Badge key={role} variant="default">
                                                        {role}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">No roles assigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Direct Permissions</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.permissions.length > 0 ? (
                                                selectedUser.permissions.map((permission) => (
                                                    <Badge key={permission} variant="outline">
                                                        {permission}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">No direct permissions</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Joined Date</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        {selectedUser.created_at}
                                    </div>
                                </div>
                            </div>
                        )}

                        {dialogType === 'edit' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Enter user name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={editForm.email}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">Mobile Number</Label>
                                        <Input
                                            id="mobile"
                                            value={editForm.mobile}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                                            placeholder="Enter mobile number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
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

                        {dialogType === 'role' ? (
                            <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles
                                        .filter(
                                            (role) =>
                                                !selectedUser?.roles.includes(
                                                    role.name,
                                                ),
                                        )
                                        .map((role) => (
                                            <SelectItem
                                                key={role.id}
                                                value={role.name}
                                            >
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        ) : dialogType === 'permission' ? (
                            <div className="space-y-4">
                                <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {permissions && permissions.length > 0 ? (
                                            permissions
                                                .filter(
                                                    (permission) =>
                                                        !selectedUser?.permissions.includes(
                                                            permission.name,
                                                        ),
                                                )
                                                .map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`permission-${permission.id}`}
                                                            value={permission.name}
                                                            checked={selectedPermission.includes(permission.name)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPermission(prev => 
                                                                        Array.isArray(prev) 
                                                                            ? [...prev, permission.name]
                                                                            : [permission.name]
                                                                    );
                                                                } else {
                                                                    setSelectedPermission(prev => 
                                                                        Array.isArray(prev) 
                                                                            ? prev.filter(p => p !== permission.name)
                                                                            : []
                                                                    );
                                                                }
                                                            }}
                                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                        />
                                                        <label 
                                                            htmlFor={`permission-${permission.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {permission.name}
                                                        </label>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="col-span-2 text-center text-muted-foreground">
                                                No permissions available to assign
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Select the permissions this user should have.
                                </div>
                                {/* Debug info - remove this after fixing */}
                                <div className="text-xs text-muted-foreground">
                                    Total permissions: {permissions?.length || 0} | 
                                    User permissions: {selectedUser?.permissions?.length || 0} | 
                                    Available: {permissions?.filter(p => !selectedUser?.permissions.includes(p.name))?.length || 0}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        {dialogType === 'view' && (
                            <Button variant="outline" className='cursor-pointer' onClick={closeDialog}>
                                Close
                            </Button>
                        )}

                        {dialogType === 'edit' && (
                            <>
                                <Button variant="outline" className='cursor-pointer' onClick={closeDialog}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={!editForm.name || !editForm.email}
                                    className='cursor-pointer'
                                >
                                    Save Changes
                                </Button>
                            </>
                        )}

                        {(dialogType === 'role' || dialogType === 'permission') && (
                            <>
                                <Button variant="outline" onClick={closeDialog} className='cursor-pointer'>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={
                                        dialogType === 'role'
                                            ? handleAssignRole
                                            : handleAssignPermission
                                    }
                                    disabled={
                                        dialogType === 'role'
                                            ? !selectedRole
                                            : !selectedPermission.length
                                    }
                                    className="cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Assign{' '}
                                    {dialogType === 'role' ? 'Role' : 'Permission'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
