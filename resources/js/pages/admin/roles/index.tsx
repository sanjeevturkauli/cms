import { Head, router } from '@inertiajs/react';
import {
    Edit,
    Eye,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    Users,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Role {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
    created_at: string;
}

interface Permission {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
    permissions: Permission[];
}

export default function RolesIndex({ roles, permissions }: Props) {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [dialogType, setDialogType] = useState<'create' | 'edit' | 'view' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form states
    const [form, setForm] = useState({
        name: '',
        permissions: [] as string[],
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');

    // Filter roles based on search
    const filteredRoles = roles.filter((role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        setForm({ name: '', permissions: [] });
        setDialogType('create');
        setIsDialogOpen(true);
    };

    const handleEdit = (role: Role) => {
        setSelectedRole(role);
        setForm({ name: role.name, permissions: role.permissions });
        setDialogType('edit');
        setIsDialogOpen(true);
    };

    const handleView = (role: Role) => {
        setSelectedRole(role);
        setDialogType('view');
        setIsDialogOpen(true);
    };

    const handleDelete = (roleId: number, roleName: string) => {
        router.delete(`/admin/roles/${roleId}`, {
            preserveScroll: true,
        });
    };

    const handleSave = () => {
        if (dialogType === 'create') {
            router.post('/admin/roles', form, {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            });
        } else if (dialogType === 'edit' && selectedRole) {
            router.put(`/admin/roles/${selectedRole.id}`, form, {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            });
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/admin/roles', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const handlePermissionToggle = (permissionName: string, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            permissions: checked
                ? [...prev.permissions, permissionName]
                : prev.permissions.filter(p => p !== permissionName)
        }));
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedRole(null);
        setForm({ name: '', permissions: [] });
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
            <Head title="Role Management" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">
                                        Role Management
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Manage user roles and their permissions
                                    </p>
                                </div>
                                <Button onClick={handleCreate} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Role
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Roles List</CardTitle>
                                            <CardDescription>
                                                Total {filteredRoles.length} of{' '}
                                                {roles.length} role
                                                {roles.length !== 1 ? 's' : ''}
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
                                    {/* Search Filter */}
                                    <div className="mb-6">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search roles..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {filteredRoles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <UserCheck className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {searchTerm
                                                    ? 'No roles found matching your search.'
                                                    : 'No roles found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Role Name</TableHead>
                                                        <TableHead>Permissions</TableHead>
                                                        <TableHead>Users Count</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredRoles.map((role) => (
                                                        <TableRow key={role.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="font-medium">
                                                                        {role.name}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {role.permissions.length > 0 ? (
                                                                        role.permissions.slice(0, 3).map((permission) => (
                                                                            <Badge key={permission} variant="outline">
                                                                                {permission}
                                                                            </Badge>
                                                                        ))
                                                                    ) : (
                                                                        <Badge variant="outline">
                                                                            No Permissions
                                                                        </Badge>
                                                                    )}
                                                                    {role.permissions.length > 3 && (
                                                                        <Badge variant="secondary">
                                                                            +{role.permissions.length - 3} more
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                                    {role.users_count}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {role.created_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleView(role)}
                                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(role)}
                                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                                        title="Edit Role"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 cursor-pointer text-destructive hover:text-destructive"
                                                                                title="Delete Role"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 " />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    Are you sure you want to delete this role?
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This will permanently delete the role "{role.name}" and remove it from all users. This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDelete(role.id, role.name)}
                                                                                    className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                                                                >
                                                                                    Delete Role
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
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Create/Edit/View Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'create' && 'Create New Role'}
                            {dialogType === 'edit' && `Edit Role - ${selectedRole?.name}`}
                            {dialogType === 'view' && `Role Details - ${selectedRole?.name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'create' && 'Create a new role and assign permissions.'}
                            {dialogType === 'edit' && 'Update the role information and permissions.'}
                            {dialogType === 'view' && 'View detailed information about this role.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {dialogType === 'view' && selectedRole && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Role Name</Label>
                                        <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                                            {selectedRole.name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Users Count</Label>
                                        <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            {selectedRole.users_count} users
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Assigned Permissions</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRole.permissions.length > 0 ? (
                                                selectedRole.permissions.map((permission) => (
                                                    <Badge key={permission} variant="default">
                                                        {permission}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">No permissions assigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        {selectedRole.created_at}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(dialogType === 'create' || dialogType === 'edit') && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Role Name</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter role name (e.g., Manager, Editor)"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm font-medium">Permissions</Label>
                                    <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto border rounded-md p-4">
                                        {permissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={form.permissions.includes(permission.name)}
                                                    onCheckedChange={(checked) =>
                                                        handlePermissionToggle(permission.name, checked as boolean)
                                                    }
                                                />
                                                <Label
                                                    htmlFor={`permission-${permission.id}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {permission.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Select the permissions this role should have.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        {dialogType === 'view' && (
                            <Button variant="outline" onClick={closeDialog}>
                                Close
                            </Button>
                        )}

                        {(dialogType === 'create' || dialogType === 'edit') && (
                            <>
                                <Button variant="outline" onClick={closeDialog}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!form.name.trim()}
                                    className="cursor-pointer"
                                >
                                    {dialogType === 'create' ? 'Create Role' : 'Save Changes'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
