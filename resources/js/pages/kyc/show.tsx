import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { CheckCircle, Clock, XCircle, Edit } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface KycData {
    id: number;
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
    reason?: string;
}

interface Props {
    kyc: KycData;
}

export default function KycShow({ kyc }: Props) {
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
                    title: 'KYC Approved!',
                    message: 'Your KYC verification has been approved. You now have full access to all features.',
                    color: 'text-green-600'
                };
            case 'rejected':
                return {
                    title: 'KYC Rejected',
                    message: 'Your KYC verification was rejected. Please review the reason below and resubmit with correct information.',
                    color: 'text-red-600'
                };
            case 'submitted':
                return {
                    title: 'KYC Under Review',
                    message: 'Your KYC application has been submitted and is currently under review. We will notify you once the review is complete.',
                    color: 'text-blue-600'
                };
            default:
                return {
                    title: 'KYC Pending',
                    message: 'Please complete your KYC verification to access all features.',
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
            <Head title="KYC Status" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">KYC Status</h1>
                                <p className="text-muted-foreground">
                                    View your KYC verification status and details.
                                </p>
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
                                            {(kyc.status === 'pending' || kyc.status === 'rejected' || kyc.status === 'submitted') && (
                                                <Link href="/team/kyc/create">
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit KYC
                                                    </Button>
                                                </Link>
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

                            {/* KYC Details */}
                            <div className="grid gap-6 lg:grid-cols-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Identity Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-3">
                                        <div>
                                            <p className="font-medium text-gray-600">Identity Type</p>
                                            <p className="capitalize">{kyc.identity_type.replace('_', ' ')}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-600">Identity Number</p>
                                            <p>{kyc.identity_number}</p>
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
                                                    className="w-full h-32 object-cover rounded border"
                                                />
                                            </div>
                                        )}
                                        {kyc.pan_card_image && (
                                            <div>
                                                <p className="font-medium text-gray-600 mb-2">PAN Card</p>
                                                <img 
                                                    src={kyc.pan_card_image} 
                                                    alt="PAN Card" 
                                                    className="w-full h-32 object-cover rounded border"
                                                />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Personal Information</CardTitle>
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
                                        <CardTitle className="text-base">Address Information</CardTitle>
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
                                            <p>{kyc.full_address}</p>
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
        </SidebarProvider>
    );
}