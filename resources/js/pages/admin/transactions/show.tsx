import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, User, Users, Package, CreditCard, Calendar, CheckCircle, XCircle, Clock, Info, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Transaction {
    id: number;
    transaction_id: string;
    gateway_transaction_id: string | null;
    gateway_payment_id: string | null;
    user: {
        id: number;
        name: string;
        email: string;
        mobile: string | null;
        wallet_balance: string;
    };
    team: {
        id: number;
        name: string;
        team_id: string;
        owner: {
            name: string;
            email: string;
        };
    } | null;
    package: {
        name: string;
        price: string;
        duration: string;
        person: string;
        features: string[];
    } | null;
    subscription: {
        id: number;
        start_date: string;
        end_date: string;
        status: string;
        days_remaining: number;
    } | null;
    amount: string;
    currency: string;
    payment_gateway: string;
    status: string;
    status_badge: {
        text: string;
        color: string;
    };
    description: string;
    customer_email: string | null;
    customer_phone: string | null;
    created_at: string;
    completed_at: string | null;
    failed_at: string | null;
    failure_reason: string | null;
}

interface Props {
    transaction: Transaction;
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'pending':
            return <Clock className="h-5 w-5 text-yellow-600" />;
        case 'failed':
            return <XCircle className="h-5 w-5 text-red-600" />;
        default:
            return <Clock className="h-5 w-5 text-gray-600" />;
    }
};

const getStatusBadgeColor = (color: string) => {
    switch (color) {
        case 'green':
            return 'bg-green-100 text-green-800';
        case 'yellow':
            return 'bg-yellow-100 text-yellow-800';
        case 'red':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const truncateTransactionId = (id: string, maxLength: number = 12) => {
    if (id.length <= maxLength) return id;
    return id.substring(0, maxLength) + '...';
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.success('Transaction ID copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy text: ', err);
        toast.error('Failed to copy to clipboard');
    }
};

export default function TransactionShow({ transaction }: Props) {
    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title={`Transaction ${transaction.transaction_id}`} />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Link href="/admin/transactions">
                                        <Button variant="outline" size="sm" className="cursor-pointer">
                                            <ArrowLeft className="h-4 w-4 mr-2" />
                                            Back
                                        </Button>
                                    </Link>
                                    <div>
                                        <h1 className="text-3xl font-bold">Transaction Details</h1>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span>Transaction ID: {truncateTransactionId(transaction.transaction_id)}</span>
                                            <div className="flex items-center gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="font-mono">{transaction.transaction_id}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Copy 
                                                            className="h-4 w-4 cursor-pointer hover:text-foreground transition-colors" 
                                                            onClick={() => copyToClipboard(transaction.transaction_id)}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Copy Transaction ID</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(transaction.status)}
                                    <Badge className={getStatusBadgeColor(transaction.status_badge.color)}>
                                        {transaction.status_badge.text}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Payment Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Payment Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Amount</div>
                                            <div className="text-2xl font-bold">{transaction.amount}</div>
                                        </div>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Currency</div>
                                                <div className="font-medium">{transaction.currency}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Gateway</div>
                                                <div className="font-medium">{transaction.payment_gateway}</div>
                                            </div>
                                        </div>
                                        {transaction.gateway_transaction_id && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Gateway Transaction ID</div>
                                                    <div className="font-mono text-sm">{transaction.gateway_transaction_id}</div>
                                                </div>
                                            </>
                                        )}
                                        {transaction.gateway_payment_id && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Gateway Payment ID</div>
                                                    <div className="font-mono text-sm">{transaction.gateway_payment_id}</div>
                                                </div>
                                            </>
                                        )}
                                        <Separator />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Description</div>
                                            <div className="text-sm">{transaction.description}</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Customer Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Customer Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Name</div>
                                            <div className="font-medium">{transaction.user.name}</div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Email</div>
                                            <div className="font-medium">{transaction.user.email}</div>
                                        </div>
                                        {transaction.user.mobile && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Mobile</div>
                                                    <div className="font-medium">{transaction.user.mobile}</div>
                                                </div>
                                            </>
                                        )}
                                        <Separator />
                                        <div>
                                            <div className="text-sm text-muted-foreground">Wallet Balance</div>
                                            <div className="font-semibold text-blue-600">{transaction.user.wallet_balance}</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Team Information */}
                                {transaction.team && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                Team Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Team Name</div>
                                                <div className="font-medium">{transaction.team.name}</div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <div className="text-sm text-muted-foreground">Team ID</div>
                                                <div className="font-mono text-sm">{transaction.team.team_id}</div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <div className="text-sm text-muted-foreground">Team Owner</div>
                                                <div className="font-medium">{transaction.team.owner.name}</div>
                                                <div className="text-sm text-muted-foreground">{transaction.team.owner.email}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Package Information */}
                                {transaction.package && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Package className="h-5 w-5" />
                                                Package Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Package Name</div>
                                                <div className="font-medium">{transaction.package.name}</div>
                                            </div>
                                            <Separator />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Price</div>
                                                    <div className="font-semibold">{transaction.package.price}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Duration</div>
                                                    <div className="font-medium">{transaction.package.duration}</div>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <div className="text-sm text-muted-foreground">Team Size</div>
                                                <div className="font-medium">{transaction.package.person}</div>
                                            </div>
                                            <Separator />
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-2">Features</div>
                                                <ul className="space-y-1">
                                                    {transaction.package.features.map((feature, index) => (
                                                        <li key={index} className="text-sm flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Subscription Information */}
                                {transaction.subscription && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Calendar className="h-5 w-5" />
                                                Subscription Information
                                            </CardTitle>
                                            <CardDescription>Active subscription details for this transaction</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Start Date</div>
                                                    <div className="font-medium">{transaction.subscription.start_date}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">End Date</div>
                                                    <div className="font-medium">{transaction.subscription.end_date}</div>
                                                </div>
                                            </div>
                                            <Separator />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Status</div>
                                                    <Badge variant="outline">{transaction.subscription.status}</Badge>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-muted-foreground">Days Remaining</div>
                                                    <div className="font-semibold text-blue-600">{transaction.subscription.days_remaining}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Transaction Timeline */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Transaction Timeline</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                    <Calendar className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">Transaction Created</div>
                                                    <div className="text-sm text-muted-foreground">{transaction.created_at}</div>
                                                </div>
                                            </div>
                                            {transaction.completed_at && (
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">Payment Completed</div>
                                                        <div className="text-sm text-muted-foreground">{transaction.completed_at}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {transaction.failed_at && (
                                                <div className="flex items-start gap-4">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">Payment Failed</div>
                                                        <div className="text-sm text-muted-foreground">{transaction.failed_at}</div>
                                                        {transaction.failure_reason && (
                                                            <div className="text-sm text-red-600 mt-1">{transaction.failure_reason}</div>
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}