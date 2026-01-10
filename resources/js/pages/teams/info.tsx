import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CreditCard,
    Edit,
    MapPin,
    Save,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

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
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';

interface Team {
    id: number;
    name: string;
    team_id: string;
    status: 'pending' | 'approved' | 'rejected';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface TeamInfo {
    id?: number;
    plan?: string;
    duration_months?: number;
    plan_start_date?: string;
    plan_end_date?: string;
    total_member_limit?: number;
    current_members?: number;
    monthly_amount?: number;
    total_amount?: number;
    paid_members?: number;
    latitude?: number;
    longitude?: number;
    location?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    pincode?: string;
    description?: string;
    category?: string;
    settings?: any;
    is_active?: boolean;
    last_activity?: string;
}

interface Props {
    team: Team;
    teamInfo: TeamInfo;
    permissions: {
        canEdit: boolean;
        isOwner: boolean;
    };
}

export default function TeamInfoPage({ team, teamInfo, permissions }: Props) {
    const [editingSection, setEditingSection] = useState<string | null>(null);

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

    // Plan form
    const planForm = useForm({
        section: 'plan',
        plan: teamInfo.plan || '',
        duration_months: teamInfo.duration_months || 0,
        plan_start_date: teamInfo.plan_start_date || '',
        plan_end_date: teamInfo.plan_end_date || '',
        total_member_limit: teamInfo.total_member_limit || 10,
        monthly_amount: teamInfo.monthly_amount || 0,
        total_amount: teamInfo.total_amount || 0,
    });

    // Location form
    const locationForm = useForm({
        section: 'location',
        latitude: teamInfo.latitude || 0,
        longitude: teamInfo.longitude || 0,
        location: teamInfo.location || '',
        address: teamInfo.address || '',
        country: teamInfo.country || '',
        state: teamInfo.state || '',
        city: teamInfo.city || '',
        area: teamInfo.area || '',
        pincode: teamInfo.pincode || '',
    });

    // Details form
    const detailsForm = useForm({
        section: 'details',
        description: teamInfo.description || '',
        category: teamInfo.category || '',
    });

    const handleSave = (section: string) => {
        let form;
        let url;
        switch (section) {
            case 'plan':
                form = planForm;
                url = `/teams/${team.id}/info/plan`;
                break;
            case 'location':
                form = locationForm;
                url = `/teams/${team.id}/info/location`;
                break;
            case 'details':
                form = detailsForm;
                url = `/teams/${team.id}/info/basic`;
                break;
            default:
                return;
        }

        form.patch(url, {
            onSuccess: () => {
                setEditingSection(null);
            },
        });
    };

    const handleCancel = (section: string) => {
        // Reset form data
        switch (section) {
            case 'plan':
                planForm.reset();
                break;
            case 'location':
                locationForm.reset();
                break;
            case 'details':
                detailsForm.reset();
                break;
        }
        setEditingSection(null);
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
            <Head title={`${team.name} - Team Information`} />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.get('/teams')}
                                    className="cursor-pointer"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Teams
                                </Button>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold flex items-center gap-3">
                                        <Building2 className="h-8 w-8" />
                                        {team.name}
                                    </h1>
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-muted-foreground">
                                            Team Code: <span className="font-mono font-semibold">{team.team_id}</span>
                                        </p>
                                        <Badge
                                            className={`text-xs ${statusConfig[team.status]?.className ?? "bg-gray-100 text-gray-800 border-gray-200"}`}
                                            variant="outline"
                                        >
                                            {statusConfig[team.status]?.label ?? "Unknown"}
                                        </Badge>
                                        <Badge variant={team.is_active ? 'default' : 'destructive'}>
                                            {team.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Plan & Billing Card */}
                                <Card className="relative">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-primary" />
                                                <CardTitle>Plan & Billing</CardTitle>
                                            </div>
                                            {permissions.canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingSection('plan')}
                                                    className="cursor-pointer"
                                                    disabled={editingSection === 'plan'}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <CardDescription>
                                            Manage subscription and member limits
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {editingSection === 'plan' ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="plan" className='mb-2'>Plan</Label>
                                                        <Input
                                                            id="plan"
                                                            value={planForm.data.plan}
                                                            onChange={(e) => planForm.setData('plan', e.target.value)}
                                                            placeholder="e.g., Premium"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="duration_months" className='mb-2'>Duration (Months)</Label>
                                                        <Input
                                                            id="duration_months"
                                                            type="number"
                                                            value={planForm.data.duration_months}
                                                            onChange={(e) => planForm.setData('duration_months', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="plan_start_date" className='mb-2'>Start Date</Label>
                                                        <Input
                                                            id="plan_start_date"
                                                            type="date"
                                                            value={planForm.data.plan_start_date}
                                                            onChange={(e) => planForm.setData('plan_start_date', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="plan_end_date" className='mb-2'>End Date</Label>
                                                        <Input
                                                            id="plan_end_date"
                                                            type="date"
                                                            value={planForm.data.plan_end_date}
                                                            onChange={(e) => planForm.setData('plan_end_date', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor="total_member_limit" className='mb-2'>Member Limit</Label>
                                                        <Input
                                                            id="total_member_limit"
                                                            type="number"
                                                            value={planForm.data.total_member_limit}
                                                            onChange={(e) => planForm.setData('total_member_limit', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="monthly_amount" className='mb-2'>Monthly Amount</Label>
                                                        <Input
                                                            id="monthly_amount"
                                                            type="number"
                                                            step="0.01"
                                                            value={planForm.data.monthly_amount}
                                                            onChange={(e) => planForm.setData('monthly_amount', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="total_amount" className='mb-2'>Total Amount</Label>
                                                        <Input
                                                            id="total_amount"
                                                            type="number"
                                                            step="0.01"
                                                            value={planForm.data.total_amount}
                                                            onChange={(e) => planForm.setData('total_amount', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-4">
                                                    <Button
                                                        onClick={() => handleSave('plan')}
                                                        disabled={planForm.processing}
                                                        className="cursor-pointer"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleCancel('plan')}
                                                        className="cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground mb-2">Plan:</span>
                                                    <span className="font-medium">{teamInfo.plan || 'Not set'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground mb-2">Duration:</span>
                                                    <span className="font-medium">{teamInfo.duration_months || 0} months</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground mb-2">Member Limit:</span>
                                                    <span className="font-medium">{teamInfo.current_members || 0} / {teamInfo.total_member_limit || 10}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground mb-2">Monthly Amount:</span>
                                                    <span className="font-medium">₹{teamInfo.monthly_amount || 0}</span>
                                                </div>
                                                {teamInfo.plan_start_date && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground mb-2">Plan Period:</span>
                                                        <span className="font-medium text-xs">
                                                            {teamInfo.plan_start_date} to {teamInfo.plan_end_date}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Location Card */}
                                <Card className="relative">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-primary" />
                                                <CardTitle>Location</CardTitle>
                                            </div>
                                            {permissions.canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingSection('location')}
                                                    className="cursor-pointer"
                                                    disabled={editingSection === 'location'}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <CardDescription>
                                            Team location and address information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {editingSection === 'location' ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="location" className='mb-2'>Location Name</Label>
                                                    <Input
                                                        id="location"
                                                        value={locationForm.data.location}
                                                        onChange={(e) => locationForm.setData('location', e.target.value)}
                                                        placeholder="e.g., Office, Home"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="address" className='mb-2'>Address</Label>
                                                    <Textarea
                                                        id="address"
                                                        value={locationForm.data.address}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => locationForm.setData('address', e.target.value)}
                                                        placeholder="Full address"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="country" className='mb-2'>Country</Label>
                                                        <Input
                                                            id="country"
                                                            value={locationForm.data.country}
                                                            onChange={(e) => locationForm.setData('country', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="state" className='mb-2'>State</Label>
                                                        <Input
                                                            id="state"
                                                            value={locationForm.data.state}
                                                            onChange={(e) => locationForm.setData('state', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor="city" className='mb-2'>City</Label>
                                                        <Input
                                                            id="city"
                                                            value={locationForm.data.city}
                                                            onChange={(e) => locationForm.setData('city', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="area" className='mb-2'>Area</Label>
                                                        <Input
                                                            id="area"
                                                            value={locationForm.data.area}
                                                            onChange={(e) => locationForm.setData('area', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="pincode" className='mb-2'>Pincode</Label>
                                                        <Input
                                                            id="pincode"
                                                            value={locationForm.data.pincode}
                                                            onChange={(e) => locationForm.setData('pincode', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-4">
                                                    <Button
                                                        onClick={() => handleSave('location')}
                                                        disabled={locationForm.processing}
                                                        className="cursor-pointer"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleCancel('location')}
                                                        className="cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Location:</span>
                                                    <span className="font-medium">{teamInfo.location || 'Not set'}</span>
                                                </div>
                                                {teamInfo.address && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Address:</span>
                                                        <p className="text-sm font-medium mt-1">{teamInfo.address}</p>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">City:</span>
                                                    <span className="font-medium">{teamInfo.city || 'Not set'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">State:</span>
                                                    <span className="font-medium">{teamInfo.state || 'Not set'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Country:</span>
                                                    <span className="font-medium">{teamInfo.country || 'Not set'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Team Details Card */}
                                <Card className="relative">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-primary" />
                                                <CardTitle>Team Details</CardTitle>
                                            </div>
                                            {permissions.canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingSection('details')}
                                                    className="cursor-pointer"
                                                    disabled={editingSection === 'details'}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <CardDescription>
                                            Team description and category
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {editingSection === 'details' ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="category" className='mb-2'>Category</Label>
                                                    <Input
                                                        id="category"
                                                        value={detailsForm.data.category}
                                                        onChange={(e) => detailsForm.setData('category', e.target.value)}
                                                        placeholder="e.g., Technology, Finance, Marketing"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="description" className='mb-2'>Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={detailsForm.data.description}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => detailsForm.setData('description', e.target.value)}
                                                        placeholder="Describe your team's purpose and goals"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div className="flex gap-2 pt-4">
                                                    <Button
                                                        onClick={() => handleSave('details')}
                                                        disabled={detailsForm.processing}
                                                        className="cursor-pointer"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                        Save
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleCancel('details')}
                                                        className="cursor-pointer"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Category:</span>
                                                    <span className="font-medium">{teamInfo.category || 'Not set'}</span>
                                                </div>
                                                {teamInfo.description ? (
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Description:</span>
                                                        <p className="text-sm mt-1">{teamInfo.description}</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 text-muted-foreground">
                                                        No description added yet
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Team Stats Card */}
                                <Card className="relative">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            <CardTitle>Team Statistics</CardTitle>
                                        </div>
                                        <CardDescription>
                                            Team activity and member information
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Created:</span>
                                                <span className="font-medium">{team.created_at}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Last Updated:</span>
                                                <span className="font-medium">{team.updated_at}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Current Members:</span>
                                                <span className="font-medium">{teamInfo.current_members || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Paid Members:</span>
                                                <span className="font-medium">{teamInfo.paid_members || 0}</span>
                                            </div>
                                            {teamInfo.last_activity && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Last Activity:</span>
                                                    <span className="font-medium text-xs">{teamInfo.last_activity}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}