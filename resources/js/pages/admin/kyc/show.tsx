import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CheckCircle, XCircle, Clock, ArrowLeft, User, FileText, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ApprovedBy {
    name: string;
    email: string;
}

interface KycData {
    id: number;
    user: User;
    identity_type: string;
    identity_number: string;
    identity_image?: string;
    pan_number: string;
    pan_card_image?: string;
    country: string;
    state: string;
    city: string;
    area?: string;
    full_address: string;
    pincode: string;
    date_of_birth: string;
    gender: string;
    father_name?: string;
    mother_name?: string;
    occupation?: string;
    annual_income?: number;
    status: string;
    status_badge: {
        class: string;
        text: string;
    };
    completion_percentage: number;
    submitted_at?: string;
    approved_date?: string;
    approved_by?: ApprovedBy;
    reason?: string;
    created_at: string;
}

interface Props {
    kyc: KycData;
}

export default function KycShow({ kyc }: Props) {
    const [showRejectModal, setShowRejectModal] = useState(false);
    
    const { data: approveData, setData: setApproveData, patch: approveKyc, processing: approving } = useForm({
        reason: '',
    });

    const { data: rejectData, setData: setRejectData, patch: rejectKyc, processing: rejecting, reset } = useForm({
        reason: '',
    });

    const handleApprove = () => {
        approveKyc(`/admin/kyc/${kyc.id}/approve`, {
            onSuccess: () => {
                toast.success('KYC application approved successfully!');
            },
            onError: () => {
                toast.error('Failed to approve KYC application.');
            }
        });
    };

    const handleReject = () => {
        if (!rejectData.reason.trim()) {
            toast.error('Please provide a reason for rejection.');
            return;
        }

        rejectKyc(`/admin/kyc/${kyc.id}/reject`, {
            onSuccess: () => {
                toast.success('KYC application rejected successfully!');
                setShowRejectModal(false);
                reset();
            },
            onError: () => {
                toast.error('Failed to reject KYC application.');
            }
        });
    };

    const getStatusIcon = () => {
        switch (kyc.status) {
            case 'approved':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'submitted':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return <Clock className="h-5 w-5 text-gray-600" />;
        }
    };

    const getStatusMessage = () => {
        switch (kyc.status) {
            case 'approved':
                return {
                    title: 'KYC Approved',
                    message: 'This KYC application has been approved.',
                    color: 'text-green-600'
                };
            case 'rejected':
                return {
                    title: 'KYC Rejected',
                    message: 'This KYC application has been rejected.',
                    color: 'text-red-600'
                };
            case 'submitted':
                return {
                    title: 'KYC Under Review',
                    message: 'This KYC application is awaiting review.',
                    color: 'text-blue-600'
                };
            default:
                return {
                    title: 'KYC Pending',
                    message: 'This KYC application is incomplete.',
                    color: 'text-gray-600'
                };
        }
    };

    const statusInfo = getStatusMessage();

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title={`KYC - ${kyc.user.name}`} />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Link href="/admin/kyc">
                                        <Button variant="outline" size="sm">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back to KYC List
                                        </Button>
                                    </Link>
                                    <div>
                                        <h1 className="text-3xl font-bold">KYC Review</h1>
                                        <p className="text-muted-foreground">
                                            Review KYC application for {kyc.user.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {getStatusIcon()}
                                            <div>
                                                <CardTitle className={statusInfo.color}>{statusInfo.title}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {statusInfo.message}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Badge className={kyc.status_badge.class}>
                                                {kyc.status_badge.text}
                                            </Badge>
                                            {kyc.status === 'submitted' && (
                                                <div className="flex space-x-2">
                                                    <Button
                                                        onClick={handleApprove}
                                                        disabled={approving}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {approving ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                Approving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Approve
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => setShowRejectModal(true)}
                                                        disabled={rejecting}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                {kyc.reason && (
                                    <CardContent>
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="font-medium text-yellow-800 mb-2">Admin Note:</h4>
                                            <p className="text-yellow-700">{kyc.reason}</p>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* User Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <User className="h-5 w-5" />
                                        <span>User Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-medium text-gray-600">Name</p>
                                            <p className="text-lg">{kyc.user.name}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">Email</p>
                                            <p className="text-lg">{kyc.user.email}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* KYC Details */}
                            <div className="grid gap-6 lg:grid-cols-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center space-x-2">
                                            <FileText className="h-4 w-4" />
                                            <span>Identity Information</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-4">
                                        <div>
                                            <p className="font-medium text-gray-600">Identity Type</p>
                                            <p className="capitalize">{kyc.identity_type.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">Identity Number</p>
                                            <p className="font-mono">{kyc.identity_number}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">PAN Number</p>
                                            <p className="font-mono">{kyc.pan_number}</p>
                                        </div>
                                        {kyc.identity_image && (
                                            <div>
                                                <p className="font-medium text-gray-600 mb-2">Identity Document</p>
                                                <img 
                                                    src={kyc.identity_image} 
                                                    alt="Identity Document" 
                                                    className="w-full h-40 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(kyc.identity_image, '_blank')}
                                                />
                                            </div>
                                        )}
                                        {kyc.pan_card_image && (
                                            <div>
                                                <p className="font-medium text-gray-600 mb-2">PAN Card</p>
                                                <img 
                                                    src={kyc.pan_card_image} 
                                                    alt="PAN Card" 
                                                    className="w-full h-40 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(kyc.pan_card_image, '_blank')}
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center space-x-2">
                                            <User className="h-4 w-4" />
                                            <span>Personal Information</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                        <div>
                                            <p className="font-medium text-gray-600">Date of Birth</p>
                                            <p>{kyc.date_of_birth}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">Gender</p>
                                            <p className="capitalize">{kyc.gender}</p>
                                        </div>
                                        {kyc.occupation && (
                                            <div>
                                                <p className="font-medium text-gray-600">Occupation</p>
                                                <p>{kyc.occupation}</p>
                                            </div>
                                        )}
                                        {kyc.father_name && (
                                            <div>
                                                <p className="font-medium text-gray-600">Father's Name</p>
                                                <p>{kyc.father_name}</p>
                                            </div>
                                        )}
                                        {kyc.mother_name && (
                                            <div>
                                                <p className="font-medium text-gray-600">Mother's Name</p>
                                                <p>{kyc.mother_name}</p>
                                            </div>
                                        )}
                                        {kyc.annual_income && (
                                            <div>
                                                <p className="font-medium text-gray-600">Annual Income</p>
                                                <p>₹{kyc.annual_income.toLocaleString()}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center space-x-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>Address Information</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                        <div>
                                            <p className="font-medium text-gray-600">Country</p>
                                            <p>{kyc.country}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">State</p>
                                            <p>{kyc.state}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">City</p>
                                            <p>{kyc.city}</p>
                                        </div>
                                        {kyc.area && (
                                            <div>
                                                <p className="font-medium text-gray-600">Area</p>
                                                <p>{kyc.area}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-600">Pincode</p>
                                            <p>{kyc.pincode}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">Full Address</p>
                                            <p className="leading-relaxed">{kyc.full_address}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Application Timeline</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                            <div>
                                                <p className="font-medium">Application Created</p>
                                                <p className="text-sm text-gray-600">{kyc.created_at}</p>
                                            </div>
                                        </div>
                                        {kyc.submitted_at && (
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                <div>
                                                    <p className="font-medium">Application Submitted</p>
                                                    <p className="text-sm text-gray-600">{kyc.submitted_at}</p>
                                                </div>
                                            </div>
                                        )}
                                        {kyc.approved_date && (
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${kyc.status === 'approved' ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                                <div>
                                                    <p className="font-medium">
                                                        Application {kyc.status === 'approved' ? 'Approved' : 'Rejected'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{kyc.approved_date}</p>
                                                    {kyc.approved_by && (
                                                        <p className="text-sm text-gray-500">by {kyc.approved_by.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject KYC Application</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this KYC application. This will be shown to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Rejection Reason *</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter the reason for rejection..."
                                value={rejectData.reason}
                                onChange={(e) => setRejectData('reason', e.target.value)}
                                rows={4}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejecting || !rejectData.reason.trim()}
                        >
                            {rejecting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Rejecting...
                                </>
                            ) : (
                                'Reject Application'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}