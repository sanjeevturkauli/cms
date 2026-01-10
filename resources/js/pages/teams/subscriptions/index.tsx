import { Head, router } from '@inertiajs/react';
import {
    RefreshCw,
    Package,
    CheckCircle,
    History,
    ArrowRight,
    Calendar,
    DollarSign,
    Info,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Subscription {
    id: number;
    package_name: string;
    start_date: string;
    end_date: string;
    duration_years: number;
    amount_paid: string;
    status: string;
    days_remaining: number;
    is_active: boolean;
    features: string[];
}

interface Team {
    id: number;
    name: string;
    team_id: string;
    subscription: Subscription | null;
}

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
}

interface SubscriptionLog {
    id: number;
    action: string;
    action_badge: {
        text: string;
        color: string;
    };
    team_name: string;
    from_package: string | null;
    to_package: string;
    amount_charged: string;
    description: string;
    created_at: string;
    days_used: number | null;
    days_remaining: number | null;
}

interface Props {
    teams: Team[];
    packages: PackageType[];
    wallet: {
        balance: string;
        raw_balance: number;
    };
}

export default function TeamSubscriptionsIndex({ teams, packages, wallet }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [showLogsDialog, setShowLogsDialog] = useState(false);
    const [logs, setLogs] = useState<SubscriptionLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelSubscriptionData, setCancelSubscriptionData] = useState<{
        subscriptionId: number;
        teamName: string;
    } | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
    const [selectedGateway, setSelectedGateway] = useState<string>('razorpay');

    const handlePackageSelection = (packageId: number) => {
        setSelectedPackageId(packageId);
        setShowPaymentDialog(true);
    };

    const handlePaymentProceed = () => {
        const teamToSubscribe = teams.find(t => t.subscription) || teams[0];
        
        if (!teamToSubscribe || !selectedPackageId) {
            return;
        }

        router.post('/team/payment/initiate', {
            team_id: teamToSubscribe.id,
            package_id: selectedPackageId,
            payment_gateway: selectedGateway,
        });
    };

    const handleCancelSubscription = (subscriptionId: number, teamName: string) => {
        setCancelSubscriptionData({ subscriptionId, teamName });
        setShowCancelDialog(true);
    };

    const confirmCancelSubscription = () => {
        if (cancelSubscriptionData) {
            setIsCancelling(true);
            router.patch(`/team/subscriptions/${cancelSubscriptionData.subscriptionId}/cancel`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowCancelDialog(false);
                    setCancelSubscriptionData(null);
                    setIsCancelling(false);
                },
                onError: () => {
                    setShowCancelDialog(false);
                    setCancelSubscriptionData(null);
                    setIsCancelling(false);
                }
            });
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/team/subscriptions', {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const handleViewLogs = () => {
        setIsLoadingLogs(true);
        setShowLogsDialog(true);
        
        // Fetch logs via AJAX
        fetch('/team/subscriptions/logs', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        })
        .then(response => response.json())
        .then(data => {
            setLogs(data.logs.data || []);
            setIsLoadingLogs(false);
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            setIsLoadingLogs(false);
        });
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'new':
                return <Badge className="bg-green-100 text-green-800">New</Badge>;
            case 'upgrade':
                return <Badge className="bg-blue-100 text-blue-800">Upgrade</Badge>;
            case 'downgrade':
                return <Badge className="bg-orange-100 text-orange-800">Downgrade</Badge>;
            case 'cancel':
                return <Badge className="bg-red-100 text-red-800">Cancel</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
        }
    };

    const formatAmount = (amount: string) => {
        const isNegative = amount.startsWith('-');
        return (
            <span className={isNegative ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {amount}
            </span>
        );
    };

    const getStatusBadge = (subscription: Subscription) => {
        if (subscription.is_active && subscription.days_remaining > 30) {
            return <Badge variant="default">Active</Badge>;
        } else if (subscription.is_active && subscription.days_remaining <= 30) {
            return <Badge variant="secondary">Expiring Soon</Badge>;
        } else {
            return <Badge variant="destructive">Expired</Badge>;
        }
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
            <Head title="Team Subscriptions" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
                            {/* <div>
                                <h1 className="text-3xl font-bold">
                                    Team Subscriptions
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage your team subscriptions and packages
                                </p>
                            </div> */}

                            {/* Current Subscription Section */}
                            {teams.find(team => team.subscription) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Current Subscription</CardTitle>
                                        <CardDescription>
                                            Your active subscription details
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {teams.filter(team => team.subscription).map((team) => (
                                            <div key={team.id} className="p-4 bg-muted rounded-lg">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-semibold text-lg">{team.name}</h3>
                                                    {team.subscription && getStatusBadge(team.subscription)}
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-medium">Package:</span>
                                                        <div className="text-lg font-semibold">{team.subscription!.package_name}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Amount Paid:</span>
                                                        <div className="text-lg font-semibold">{team.subscription!.amount_paid}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">End Date:</span>
                                                        <div>{team.subscription!.end_date}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Days Remaining:</span>
                                                        <div className={`font-semibold ${
                                                            team.subscription!.days_remaining <= 30 
                                                                ? 'text-yellow-600' 
                                                                : 'text-green-600'
                                                        }`}>
                                                            {team.subscription!.days_remaining} days
                                                        </div>
                                                    </div>
                                                </div>
                                                {team.subscription!.is_active && (
                                                    <div className="mt-4">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleCancelSubscription(team.subscription!.id, team.name)}
                                                            className="cursor-pointer"
                                                        >
                                                            Cancel Subscription
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Available Packages Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                                        <p className="text-muted-foreground">
                                            Select the perfect package for your team's needs
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleViewLogs}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <History className="h-4 w-4" />
                                            View Logs
                                        </Button>
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
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {packages.map((pkg) => {
                                        const currentTeam = teams.find(team => team.subscription);
                                        const isCurrentPackage = currentTeam?.subscription?.package_name === pkg.name;
                                        
                                        return (
                                            <Card key={pkg.id} className={`relative transition-all hover:shadow-lg ${
                                                isCurrentPackage ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                            }`}>
                                                {/* Current Package Badge */}
                                                {isCurrentPackage && (
                                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                        <Badge className="bg-blue-600 text-white px-3 py-1">
                                                            Current Plan
                                                        </Badge>
                                                    </div>
                                                )}

                                                <CardHeader className="text-center">
                                                    <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                                                    <div className="text-4xl font-bold text-primary">
                                                        {pkg.formatted_price}
                                                        <span className="text-lg font-normal text-muted-foreground">/year</span>
                                                    </div>
                                                    <CardDescription>
                                                        {pkg.formatted_person} • {pkg.duration_range}
                                                    </CardDescription>
                                                </CardHeader>
                                                
                                                <CardContent className="flex flex-col h-full">
                                                    {/* Features List */}
                                                    <div className="space-y-3 mb-6 flex-grow">
                                                        {pkg.features.map((feature, index) => (
                                                            <div key={index} className="flex items-start gap-2">
                                                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-sm">{feature}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    {/* Action Button - Always at bottom */}
                                                    <div className="mt-auto">
                                                        {!isCurrentPackage ? (
                                                            <Button
                                                                onClick={() => handlePackageSelection(pkg.id)}
                                                                className="w-full cursor-pointer"
                                                                size="lg"
                                                            >
                                                                {currentTeam?.subscription 
                                                                    ? `Switch to ${pkg.name}`
                                                                    : `Get ${pkg.name}`
                                                                }
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                disabled 
                                                                className="w-full" 
                                                                size="lg"
                                                            >
                                                                Your Current Plan
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>

            {/* Subscription Logs Dialog */}
            <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
                <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            Subscription History
                        </DialogTitle>
                        <DialogDescription>
                            Complete history of your subscription activities
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto max-h-[70vh]">
                        {isLoadingLogs ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Loading logs...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8">
                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No subscription history found</p>
                            </div>
                        ) : (
                            <TooltipProvider>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Message</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="w-12">Info</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getActionBadge(log.action)}
                                                        <span className="text-sm">{log.description}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {log.from_package ? (
                                                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                                                            {log.from_package}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {log.from_package && (
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                        <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                                                            {log.to_package}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        {log.created_at}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {formatAmount(log.amount_charged)}
                                                </TableCell>
                                                <TableCell>
                                                    {(log.days_used !== null || log.days_remaining !== null) && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left" className="max-w-xs">
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="font-semibold">Calculation Details:</div>
                                                                    {log.days_used !== null && (
                                                                        <div>Days Used: <span className="font-medium">{log.days_used} days</span></div>
                                                                    )}
                                                                    {log.days_remaining !== null && (
                                                                        <div>Days Remaining: <span className="font-medium">{log.days_remaining} days</span></div>
                                                                    )}
                                                                    <div className="pt-1 border-t">
                                                                        <div className="text-xs text-muted-foreground">
                                                                            Amount calculated based on pro-rated usage
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TooltipProvider>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancellation Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-red-600">
                            Cancel Subscription?
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Are you sure you want to cancel the subscription for team "{cancelSubscriptionData?.teamName}"?
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Cancellation Fee Required
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            If you cancel this subscription, a cancellation fee of <span className="font-semibold">₹500</span> will be charged from your wallet and transferred to admin.
                                        </p>
                                        <p className="mt-2">
                                            Current wallet balance: <span className="font-semibold">{wallet.balance}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-4">
                            Once cancelled, this action cannot be undone. You will need to create a new subscription to continue using premium features.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowCancelDialog(false)}
                            disabled={isCancelling}
                            className='cursor-pointer'
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmCancelSubscription}
                            disabled={wallet.raw_balance < 500 || isCancelling}
                            className="cursor-pointer min-w-[140px]"
                        >
                            {isCancelling ? (
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Cancelling...
                                </div>
                            ) : wallet.raw_balance < 500 ? (
                                'Insufficient Balance'
                            ) : (
                                'Cancel Subscription'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment Gateway Selection Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Payment Method</DialogTitle>
                        <DialogDescription>
                            Choose your preferred payment gateway to complete the subscription
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="gateway"
                                    value="razorpay"
                                    checked={selectedGateway === 'razorpay'}
                                    onChange={(e) => setSelectedGateway(e.target.value)}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">Razorpay</div>
                                    <div className="text-sm text-muted-foreground">UPI, Cards, NetBanking, Wallets</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                                <input
                                    type="radio"
                                    name="gateway"
                                    value="stripe"
                                    disabled
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">Stripe</div>
                                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 opacity-50">
                                <input
                                    type="radio"
                                    name="gateway"
                                    value="paypal"
                                    disabled
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">PayPal</div>
                                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                                </div>
                            </label>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                You will be redirected to the payment gateway to complete your transaction securely.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowPaymentDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handlePaymentProceed}
                            className="cursor-pointer"
                        >
                            Proceed to Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}