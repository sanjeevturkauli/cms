import { Head, router } from '@inertiajs/react';
import {
    Edit,
    Eye,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Package,
    Clock,
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

interface PackageType {
    id: number;
    name: string;
    price: number;
    formatted_price: string;
    person: number;
    formatted_person: string;
    features: string[];
    duration: number;
    duration_range: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    packages: PackageType[];
    permissions: {
        canCreatePackages: boolean;
        canEditPackages: boolean;
        canDeletePackages: boolean;
        canToggleStatus: boolean;
    };
}

export default function AdminPackagesIndex({ packages, permissions }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
    const [dialogType, setDialogType] = useState<'create' | 'edit' | 'view' | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form states
    const [packageForm, setPackageForm] = useState({
        name: '',
        price: '',
        person: '',
        features: [''],
        duration: 1,
        is_active: true,
    });

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter packages based on search and filters
    const filteredPackages = packages.filter((pkg) => {
        const matchesSearch =
            pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pkg.features.some(feature =>
                feature.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && pkg.is_active) ||
            (statusFilter === 'inactive' && !pkg.is_active);

        return matchesSearch && matchesStatus;
    });

    const handleCreate = () => {
        setPackageForm({
            name: '',
            price: '',
            person: '',
            features: [''],
            duration: 1,
            is_active: true,
        });
        setDialogType('create');
        setIsDialogOpen(true);
    };

    const handleEdit = (packageId: number) => {
        const pkg = packages.find(p => p.id === packageId);
        if (pkg) {
            setSelectedPackage(pkg);
            setPackageForm({
                name: pkg.name,
                price: pkg.price.toString(),
                person: pkg.person.toString(),
                features: pkg.features.length > 0 ? pkg.features : [''],
                duration: pkg.duration || 1,
                is_active: pkg.is_active,
            });
            setDialogType('edit');
            setIsDialogOpen(true);
        }
    };

    const handleView = (packageId: number) => {
        const pkg = packages.find(p => p.id === packageId);
        if (pkg) {
            setSelectedPackage(pkg);
            setDialogType('view');
            setIsDialogOpen(true);
        }
    };

    const handleSave = () => {
        const data = {
            ...packageForm,
            price: parseFloat(packageForm.price),
            person: parseInt(packageForm.person),
            features: packageForm.features.filter(f => f.trim() !== ''),
        };

        if (dialogType === 'create') {
            router.post('/admin/packages', data, {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            });
        } else if (dialogType === 'edit' && selectedPackage) {
            router.patch(`/admin/packages/${selectedPackage.id}`, data, {
                preserveScroll: true,
                onSuccess: () => closeDialog(),
            });
        }
    };

    const handleToggleActive = (packageId: number) => {
        router.patch(`/admin/packages/${packageId}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (packageId: number) => {
        router.delete(`/admin/packages/${packageId}`, {
            preserveScroll: true,
        });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/admin/packages', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setSelectedPackage(null);
        setPackageForm({
            name: '',
            price: '',
            person: '',
            features: [''],
            duration: 1,
            is_active: true,
        });
        setDialogType(null);
    };

    const addFeature = () => {
        setPackageForm(prev => ({
            ...prev,
            features: [...prev.features, '']
        }));
    };

    const removeFeature = (index: number) => {
        setPackageForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const updateFeature = (index: number, value: string) => {
        setPackageForm(prev => ({
            ...prev,
            features: prev.features.map((f, i) => i === index ? value : f)
        }));
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
            <Head title="Package Management" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Package Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage subscription packages and pricing
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Packages List</CardTitle>
                                            <CardDescription>
                                                Total {filteredPackages.length} of{' '}
                                                {packages.length} package
                                                {packages.length !== 1 ? 's' : ''}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
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
                                            {permissions.canCreatePackages && (
                                                <Button
                                                    onClick={handleCreate}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Create Package
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters */}
                                    <div className="justify-between items-center mb-6 flex flex-col gap-4 sm:flex-row">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search by package name or features..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(e.target.value)
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

                                    {filteredPackages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'No packages found matching your filters.'
                                                    : 'No packages found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Package</TableHead>
                                                        <TableHead>Price</TableHead>
                                                        <TableHead>Persons</TableHead>
                                                        <TableHead>Duration</TableHead>
                                                        <TableHead>Features</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredPackages.map((pkg) => (
                                                        <TableRow key={pkg.id}>
                                                            <TableCell>
                                                                <div className="font-medium">
                                                                    {pkg.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">
                                                                        {pkg.formatted_price}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">
                                                                        {pkg.formatted_person}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                                    <span>{pkg.duration_range}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                                    {pkg.features.length > 0 ? (
                                                                        pkg.features.slice(0, 3).map((feature, index) => (
                                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                                {feature.length > 20 ? feature.substring(0, 20) + '...' : feature}
                                                                            </Badge>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-muted-foreground text-sm">No features</span>
                                                                    )}
                                                                    {pkg.features.length > 3 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{pkg.features.length - 3} more
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Badge
                                                                            variant={pkg.is_active ? 'default' : 'destructive'}
                                                                            className="cursor-pointer text-xs"
                                                                        >
                                                                            {pkg.is_active ? 'Active' : 'Inactive'}
                                                                        </Badge>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="start" className="w-32">
                                                                        <DropdownMenuCheckboxItem
                                                                            checked={!pkg.is_active}
                                                                            onCheckedChange={() => handleToggleActive(pkg.id)}
                                                                        >
                                                                            {pkg.is_active ? 'Deactivate' : 'Activate'}
                                                                        </DropdownMenuCheckboxItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {pkg.created_at}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleView(pkg.id)}
                                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                                        title="View Details"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    {permissions.canEditPackages && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleEdit(pkg.id)}
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            title="Edit Package"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                    {permissions.canDeletePackages && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-8 w-8 p-0 cursor-pointer text-destructive hover:text-destructive"
                                                                                    title="Delete Package"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Delete Package</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Are you sure you want to delete package "{pkg.name}"? This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel className='cursor-pointer'>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDelete(pkg.id)}
                                                                                        className="bg-destructive text-white cursor-pointer hover:bg-destructive/90"
                                                                                    >
                                                                                        Delete Package
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogType === 'create' && 'Create New Package'}
                            {dialogType === 'edit' && `Edit Package - ${selectedPackage?.name}`}
                            {dialogType === 'view' && `Package Details - ${selectedPackage?.name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogType === 'create' && 'Create a new subscription package with features and pricing.'}
                            {dialogType === 'edit' && 'Update package information below.'}
                            {dialogType === 'view' && 'View detailed information about this package.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
                        {dialogType === 'view' && selectedPackage && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Package Name</Label>
                                        <div className="p-3 bg-muted rounded-md font-medium">
                                            {selectedPackage.name}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                                        <div className="p-3 bg-muted rounded-md font-medium">
                                            {selectedPackage.formatted_price}/year
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Persons Allowed</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedPackage.formatted_person}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            {selectedPackage.duration_range}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            <Badge variant={selectedPackage.is_active ? 'default' : 'destructive'}>
                                                {selectedPackage.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Features</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        {selectedPackage.features.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedPackage.features.map((feature, index) => (
                                                    <Badge key={index} variant="secondary">
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">No features defined</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(dialogType === 'create' || dialogType === 'edit') && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Package Name</Label>
                                        <Input
                                            id="name"
                                            value={packageForm.name}
                                            onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Basic, Silver, Gold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price (₹/year)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={packageForm.price}
                                            onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                                            placeholder="e.g., 1000, 2000, 5000"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duration (years)</Label>
                                        <Select
                                            value={packageForm.duration.toString()}
                                            onValueChange={(value) => setPackageForm(prev => ({ ...prev, duration: parseInt(value) }))}
                                        >
                                            <SelectTrigger  className='w-full'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5].map(year => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year} year{year > 1 ? 's' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="person">Persons Allowed</Label>
                                        <Input
                                            id="person"
                                            type="number"
                                            value={packageForm.person}
                                            onChange={(e) => setPackageForm(prev => ({ ...prev, person: e.target.value }))}
                                            placeholder="e.g., 5, 15, -1 for unlimited"
                                        />
                                        <p className="text-xs text-muted-foreground">Use -1 for unlimited persons</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Package Features</Label>
                                    <div className="space-y-2">
                                        {packageForm.features.map((feature, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Input
                                                    value={feature}
                                                    onChange={(e) => updateFeature(index, e.target.value)}
                                                    placeholder="Enter feature description"
                                                />
                                                {packageForm.features.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeFeature(index)}
                                                        className="cursor-pointer"
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addFeature}
                                            className="cursor-pointer"
                                        >
                                            Add Feature
                                        </Button>
                                    </div>
                                </div>

                                {dialogType === 'edit' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={packageForm.is_active ? 'active' : 'inactive'}
                                            onValueChange={(value) => setPackageForm(prev => ({ ...prev, is_active: value === 'active' }))}
                                        >
                                            <SelectTrigger  className='w-full'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {(dialogType === 'create' || dialogType === 'edit') && (
                        <DialogFooter>
                            <Button variant="outline" onClick={closeDialog} className='cursor-pointer'>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} className='cursor-pointer'>
                                {dialogType === 'create' ? 'Create Package' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}