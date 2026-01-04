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

interface Permission {
    id: number;
    name: string;
    roles: string[];
    users_count: number;
    created_at: string;
}

interface Props {
    permissions: Permission[];
}

export default function PermissionsIndex({ permissions }: Props) {
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [dialogType, setDialogType] = useState<'create' | 'edit' | 'view' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form states
    const [form, setForm] = useState({
        name: '',
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');

    // Filter permissions based on search
    const filteredPermissions = permissions.filter((permission) =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        setForm({ name: '' });
        setDialogType('create');
        setIsDialogOpen(true);
    };

    const handleEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setForm({ name: permission.name });
        setDialogType('edit');
        setIsDialogOpen(true);
    };

    const handleView = (permission: Permission) => {
        setSelectedPermission(permission);
        setDialogType('view');
        setIsDialogOpen(true);
    };

    const handleDelete = (permissionId: number, permissionName: string) => {
        router.delete(`/admin/permissions/${permissionId}`, {
            preserveScroll: true,
        });
    };

    const handleSave = () => {
        if (dialogType === 'create') {
            router.post('/admin/permissions', form, {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            });
        } else if (dialogType === 'edit' && selectedPermission) {
            router.put(`/admin/permissions/${selectedPermission.id}`, form, {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            });
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/admin/permissions', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedPermission(null);
        setForm({ name: '' });
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
            <Head title="Permission Management" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold">
                                        Permission Management
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Manage system permissions and access control
                                    </p>
                                </div>
                                <Button onClick={handleCreate} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Permission
                                </Button>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Permissions List</CardTitle>
                                            <CardDescription>
                                                Total {filteredPermissions.length} of{' '}
                                                {permissions.length} permission
                                                {permissions.length !== 1 ? 's' : ''}
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
                                                placeholder="Search permissions..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    {filteredPermissions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {searchTerm
                                                    ? 'No permissions found matching your search.'
                                                    : 'No permissions found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Permission Name</TableHead>
                                                        <TableHead>Assigned Roles</TableHead>
                                                        <TableHead>Users Count</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredPermissions.map((permission) => (
                                                        <TableRow key={permission.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="font-medium">
                                                                        {permission.name}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {permission.roles.length > 0 ? (
                                                                        permission.roles.map((role) => (
                                                                            <Badge key={role} variant="default">
                                                                                {role}
                                                                            </Badge>
                                                                        ))
                                                                    ) : (
                                                                        <Badge variant="outline">
                                                                            No Roles
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                                    {permission.users_count}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {permission.created_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleView(permission)}
                                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(permission)}
                                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                                        title="Edit Permission"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 cursor-pointer text-destructive hover:text-destructive"
                                                                                title="Delete Permission"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    Are you sure you want to delete this permission?
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This will permanently delete the permission "{permission.name}" and remove it from all users and roles. This action cannot be undone.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => handleDelete(permission.id, permission.name)}
                                                                                    className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                                                                >
                                                                                    Delete Permission
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'create' && 'Create New Permission'}
                            {dialogType === 'edit' && `Edit Permission - ${selectedPermission?.name}`}
                            {dialogType === 'view' && `Permission Details - ${selectedPermission?.name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'create' && 'Create a new permission for the system.'}
                            {dialogType === 'edit' && 'Update the permission information.'}
                            {dialogType === 'view' && 'View detailed information about this permission.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {dialogType === 'view' && selectedPermission && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Permission Name</Label>
                                        <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            {selectedPermission.name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Users Count</Label>
                                        <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            {selectedPermission.users_count} users
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Assigned to Roles</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPermission.roles.length > 0 ? (
                                                selectedPermission.roles.map((role) => (
                                                    <Badge key={role} variant="default">
                                                        {role}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">Not assigned to any roles</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        {selectedPermission.created_at}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(dialogType === 'create' || dialogType === 'edit') && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Permission Name</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Enter permission name (e.g., manage-users, view-reports)"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Use lowercase letters, numbers, and hyphens only.
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
                                >
                                    {dialogType === 'create' ? 'Create Permission' : 'Save Changes'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}