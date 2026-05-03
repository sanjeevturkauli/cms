import { Head, router, usePage } from '@inertiajs/react';
import { RefreshCw, IndianRupee, CreditCard, Eye, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

declare global { 
    interface Window { 
        Razorpay: any; 
        Stripe: any; 
    } 
}

type StripeCardElement = any;

interface Payment {
    id: number;
    team_name: string;
    amount: string;
    raw_amount: number;
    month_label: string;
    due_date: string;
    paid_date: string | null;
    status: string;
    is_overdue: boolean;
    payment_method?: string;
    transaction_ref?: string;
    notes?: string;
}

interface Props {
    payments: { data: Payment[]; meta: any };
    currentTeam: { id: number; name: string; team_id: string } | null;
    paymentGateways: {
        razorpay: { enabled: boolean; name: string; key_id: string };
        stripe: { enabled: boolean; name: string; public_key: string };
    };
}

const statusColors: Record<string, string> = {
    paid:    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export default function MemberPaymentsIndex({ payments, currentTeam, paymentGateways }: Props) {
    const { props } = usePage<any>();
    const auth = props.auth as any;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Payment gateway dialog
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showGatewayDialog, setShowGatewayDialog] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<'razorpay' | 'stripe'>(
        paymentGateways.razorpay.enabled ? 'razorpay' : 'stripe'
    );
    const [isProcessing, setIsProcessing] = useState(false);

    // Stripe state
    const [stripe, setStripe] = useState<any>(null);
    const [stripeElements, setStripeElements] = useState<any>(null);
    const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
    const [showStripeDialog, setShowStripeDialog] = useState(false);
    const [stripeClientSecret, setStripeClientSecret] = useState<string>('');
    const [stripeTransactionId, setStripeTransactionId] = useState<number | null>(null);
    const [stripePaymentMethod, setStripePaymentMethod] = useState<'card' | 'upi'>('upi'); // Default UPI
    const [upiId, setUpiId] = useState('');
    const cardElementRef = useRef<HTMLDivElement>(null);

    // View details dialog
    const [viewPayment, setViewPayment] = useState<Payment | null>(null);
    const [showViewDialog, setShowViewDialog] = useState(false);

    // Filter payments
    const filteredPayments = payments.data.filter((p) => {
        const matchesSearch = p.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.month_label.toLowerCase().includes(searchTerm.toLowerCase());
        const effectiveStatus = p.is_overdue && p.status === 'pending' ? 'overdue' : p.status;
        const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.get('/member/payments', {}, {
            preserveScroll: true, preserveState: true,
            onFinish: () => setIsRefreshing(false),
        });
    };

    const openPaymentDialog = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowGatewayDialog(true);
    };

    const openViewDialog = (payment: Payment) => {
        setViewPayment(payment);
        setShowViewDialog(true);
    };

    // Load Stripe
    const loadStripe = async () => {
        if (stripe) return;

        if (!window.Stripe) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://js.stripe.com/v3/';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Stripe'));
                document.head.appendChild(script);
            });
        }

        const stripeInstance = window.Stripe(paymentGateways.stripe.public_key);
        setStripe(stripeInstance);
        const elements = stripeInstance.elements();
        setStripeElements(elements);
    };

    // Mount Stripe Card Element
    useEffect(() => {
        if (showStripeDialog && stripe && stripeElements && stripePaymentMethod === 'card' && cardElementRef.current && !cardElement) {
            const card = stripeElements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': { color: '#aab7c4' },
                    },
                    invalid: { color: '#9e2146' },
                },
                hidePostalCode: true, // Hide ZIP code field
            });
            card.mount(cardElementRef.current);
            setCardElement(card);
        }

        // Cleanup when switching to UPI
        if (cardElement && stripePaymentMethod === 'upi') {
            try {
                cardElement.unmount();
            } catch (e) {
                console.error('Error unmounting card element:', e);
            }
            setCardElement(null);
        }
    }, [showStripeDialog, stripe, stripeElements, stripePaymentMethod, cardElement]);

    // Cleanup card element when dialog closes
    useEffect(() => {
        if (!showStripeDialog && cardElement) {
            try {
                cardElement.unmount();
            } catch (e) {
                console.error('Error unmounting card element:', e);
            }
            setCardElement(null);
        }
    }, [showStripeDialog, cardElement]);

    const handleProceedPayment = async () => {
        if (!selectedPayment) return;
        setIsProcessing(true);
        const toastId = toast.loading('Initiating payment...');

        try {
            const response = await fetch(`/member/payments/${selectedPayment.id}/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ payment_gateway: selectedGateway }),
            });

            const data = await response.json();
            toast.dismiss(toastId);

            if (!data.success) {
                toast.error(data.error || 'Failed to initiate payment');
                setIsProcessing(false);
                return;
            }

            setShowGatewayDialog(false);

            if (selectedGateway === 'razorpay') {
                await handleRazorpay(data);
            } else if (selectedGateway === 'stripe') {
                await handleStripe(data);
            }
        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error(err.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    const handleRazorpay = async (data: any) => {
        if (!window.Razorpay) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Razorpay'));
                document.body.appendChild(script);
            });
        }

        const options = {
            key: paymentGateways.razorpay.key_id,
            amount: data.amount,
            currency: data.currency,
            name: selectedPayment?.team_name,
            description: data.description,
            order_id: data.order_id,
            handler: (response: any) => {
                router.post('/member/payments/callback/razorpay', {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    transaction_id: data.transaction_id,
                }, {
                    onSuccess: () => toast.success('Payment successful!'),
                    onError: () => toast.error('Payment confirmation failed.'),
                });
            },
            modal: { ondismiss: () => { setIsProcessing(false); toast.error('Payment cancelled'); } },
            prefill: { name: auth?.user?.name, email: auth?.user?.email },
            theme: { color: 'hsl(var(--primary))' },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsProcessing(false);
    };

    const handleStripe = async (data: any) => {
        await loadStripe();
        setStripeClientSecret(data.client_secret);
        setStripeTransactionId(data.transaction_id);
        setShowStripeDialog(true);
        setIsProcessing(false);
    };

    const validateUpiId = () => {
        if (!upiId.trim()) {
            toast.error('Please enter your UPI ID');
            return false;
        }
        const upiRegex = /^[\w.-]+@[\w.-]+$/;
        if (!upiRegex.test(upiId)) {
            toast.error('Please enter a valid UPI ID (e.g., yourname@paytm)');
            return false;
        }
        return true;
    };

    const handleStripePayment = async () => {
        if (!stripe || !stripeClientSecret) {
            toast.error('Stripe is not initialized');
            return;
        }

        if (stripePaymentMethod === 'card' && !cardElement) {
            toast.error('Card element not loaded. Please try again.');
            return;
        }

        if (stripePaymentMethod === 'upi' && !validateUpiId()) {
            return;
        }

        setIsProcessing(true);
        const toastId = toast.loading('Processing payment...');

        try {
            let paymentResult;

            if (stripePaymentMethod === 'card') {
                paymentResult = await stripe.confirmCardPayment(stripeClientSecret, {
                    payment_method: { card: cardElement },
                });
            } else {
                // UPI payment
                paymentResult = await stripe.confirmUpiPayment(stripeClientSecret, {
                    payment_method: {
                        upi: { vpa: upiId },
                    },
                });
            }

            toast.dismiss(toastId);

            if (paymentResult.error) {
                toast.error(paymentResult.error.message || 'Payment failed');
                setIsProcessing(false);
                return;
            }

            if (paymentResult.paymentIntent.status === 'succeeded') {
                // Send confirmation to backend
                const response = await fetch('/member/payments/callback/stripe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        payment_intent: paymentResult.paymentIntent.id,
                        transaction_id: stripeTransactionId,
                    }),
                });

                const result = await response.json();

                if (result.success) {
                    toast.success('Payment successful!');
                    setShowStripeDialog(false);
                    setIsProcessing(false);
                    setUpiId('');
                    setStripePaymentMethod('upi'); // Reset to UPI default
                    handleRefresh();
                } else {
                    toast.error('Payment confirmation failed.');
                    setIsProcessing(false);
                }
            }
        } catch (err: any) {
            toast.dismiss(toastId);
            toast.error(err.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    return (
        <SidebarProvider style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}>
            <Head title="My Payments" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    {currentTeam ? `${currentTeam.name} - Payments` : 'My Payments'}
                                </h1>
                                <p className="text-muted-foreground">
                                    {currentTeam 
                                        ? `Payment history for ${currentTeam.name} (Team Code: ${currentTeam.team_id})`
                                        : 'Monthly installment payment history'
                                    }
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Payment History</CardTitle>
                                            <CardDescription>
                                                Total {filteredPayments.length} of {payments.meta?.total || 0} records
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="cursor-pointer">
                                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Filters - same style as Users Management */}
                                    <div className="justify-between items-center mb-6 flex flex-col gap-4 sm:flex-row">
                                        <div className="relative">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search by team or month..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-full sm:w-[180px]">
                                                <SelectValue placeholder="All Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="overdue">Overdue</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Table */}
                                    {filteredPayments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <IndianRupee className="mb-4 h-12 w-12 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">
                                                {searchTerm || statusFilter !== 'all'
                                                    ? 'No payments found matching your filters.'
                                                    : 'No payment records found.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Team</TableHead>
                                                        <TableHead>Month</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead>Due Date</TableHead>
                                                        <TableHead>Paid Date</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredPayments.map((payment) => {
                                                        const effectiveStatus = payment.is_overdue && payment.status === 'pending' ? 'overdue' : payment.status;
                                                        return (
                                                            <TableRow key={payment.id} className={payment.is_overdue ? 'bg-destructive/5' : ''}>
                                                                <TableCell>
                                                                    <div className="font-medium">{payment.team_name}</div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">{payment.month_label}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1 font-semibold">
                                                                        <IndianRupee className="h-3.5 w-3.5" />
                                                                        {payment.amount.replace('₹', '')}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">{payment.due_date}</TableCell>
                                                                <TableCell className="text-muted-foreground">{payment.paid_date || '—'}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={`text-xs capitalize ${statusColors[effectiveStatus] ?? 'bg-gray-100 text-gray-800'}`}>
                                                                        {effectiveStatus}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {/* View Details */}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 cursor-pointer"
                                                                            title="View Details"
                                                                            onClick={() => openViewDialog(payment)}
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </Button>
                                                                        {/* Pay Now */}
                                                                        {payment.status !== 'paid' && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant={payment.is_overdue ? 'destructive' : 'default'}
                                                                                onClick={() => openPaymentDialog(payment)}
                                                                                className="cursor-pointer h-8"
                                                                            >
                                                                                <CreditCard className="h-4 w-4 mr-1" />
                                                                                Pay Now
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
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

            {/* View Payment Details Modal */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                        <DialogDescription>
                            {viewPayment?.month_label} — {viewPayment?.team_name}
                        </DialogDescription>
                    </DialogHeader>
                    {viewPayment && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Team</Label>
                                    <p className="font-medium text-sm">{viewPayment.team_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Month</Label>
                                    <p className="font-medium text-sm">{viewPayment.month_label}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Amount</Label>
                                    <p className="font-semibold text-primary flex items-center gap-1">
                                        <IndianRupee className="h-3.5 w-3.5" />
                                        {viewPayment.amount.replace('₹', '')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <Badge className={`text-xs capitalize ${statusColors[viewPayment.is_overdue && viewPayment.status === 'pending' ? 'overdue' : viewPayment.status]}`}>
                                        {viewPayment.is_overdue && viewPayment.status === 'pending' ? 'Overdue' : viewPayment.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                                    <p className="text-sm">{viewPayment.due_date}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Paid Date</Label>
                                    <p className="text-sm">{viewPayment.paid_date || '—'}</p>
                                </div>
                                {viewPayment.payment_method && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Payment Method</Label>
                                        <p className="text-sm capitalize">{viewPayment.payment_method}</p>
                                    </div>
                                )}
                                {viewPayment.transaction_ref && (
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs text-muted-foreground">Transaction Reference</Label>
                                        <p className="text-sm font-mono break-all">{viewPayment.transaction_ref}</p>
                                    </div>
                                )}
                                {viewPayment.notes && (
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs text-muted-foreground">Notes</Label>
                                        <p className="text-sm">{viewPayment.notes}</p>
                                    </div>
                                )}
                            </div>
                            {viewPayment.status !== 'paid' && (
                                <Button
                                    className="w-full cursor-pointer"
                                    variant={viewPayment.is_overdue ? 'destructive' : 'default'}
                                    onClick={() => { setShowViewDialog(false); openPaymentDialog(viewPayment); }}
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay Now — {viewPayment.amount}
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Gateway Dialog */}
            <Dialog open={showGatewayDialog} onOpenChange={setShowGatewayDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pay Monthly Installment</DialogTitle>
                        <DialogDescription>
                            {selectedPayment && `${selectedPayment.month_label} — ${selectedPayment.team_name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Amount to Pay</span>
                            <span className="text-2xl font-bold text-primary flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" />
                                {selectedPayment?.amount.replace('₹', '')}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Select Payment Method</p>
                            {paymentGateways.razorpay.enabled && (
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${selectedGateway === 'razorpay' ? 'border-primary bg-primary/5' : ''}`}>
                                    <input type="radio" name="gateway" value="razorpay"
                                        checked={selectedGateway === 'razorpay'}
                                        onChange={() => setSelectedGateway('razorpay')} className="w-4 h-4" />
                                    <div>
                                        <div className="font-medium text-sm">Razorpay</div>
                                        <div className="text-xs text-muted-foreground">UPI, Cards, NetBanking, Wallets</div>
                                    </div>
                                </label>
                            )}
                            {paymentGateways.stripe.enabled && (
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${selectedGateway === 'stripe' ? 'border-primary bg-primary/5' : ''}`}>
                                    <input type="radio" name="gateway" value="stripe"
                                        checked={selectedGateway === 'stripe'}
                                        onChange={() => setSelectedGateway('stripe')} className="w-4 h-4" />
                                    <div>
                                        <div className="font-medium text-sm">Stripe</div>
                                        <div className="text-xs text-muted-foreground">Credit/Debit Cards</div>
                                    </div>
                                </label>
                            )}
                            {!paymentGateways.razorpay.enabled && !paymentGateways.stripe.enabled && (
                                <p className="text-sm text-destructive">No payment gateway enabled. Contact admin.</p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowGatewayDialog(false)}>Cancel</Button>
                        <Button onClick={handleProceedPayment}
                            disabled={isProcessing || (!paymentGateways.razorpay.enabled && !paymentGateways.stripe.enabled)}>
                            {isProcessing
                                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Processing...</>
                                : <><CreditCard className="h-4 w-4 mr-2" />Proceed to Pay</>
                            }
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Stripe Payment Dialog */}
            <Dialog open={showStripeDialog} onOpenChange={(open) => {
                if (!open) {
                    setUpiId('');
                    setStripePaymentMethod('upi'); // Reset to UPI default
                }
                setShowStripeDialog(open);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Stripe Payment
                        </DialogTitle>
                        <DialogDescription>
                            Complete your payment securely with Stripe
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Amount to Pay</span>
                            <span className="text-2xl font-bold text-primary flex items-center gap-1">
                                <IndianRupee className="h-5 w-5" />
                                {selectedPayment?.amount.replace('₹', '')}
                            </span>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Select Payment Method</p>
                            <div className="space-y-2">
                                {/* UPI Option - First */}
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${stripePaymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : ''}`}>
                                    <input
                                        type="radio"
                                        name="stripe-method"
                                        value="upi"
                                        checked={stripePaymentMethod === 'upi'}
                                        onChange={() => setStripePaymentMethod('upi')}
                                        disabled={isProcessing}
                                        className="w-4 h-4"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">UPI</div>
                                        <div className="text-xs text-muted-foreground">Pay using Google Pay, PhonePe, Paytm, etc.</div>
                                    </div>
                                </label>

                                {/* Card Option - Second */}
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${stripePaymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : ''}`}>
                                    <input
                                        type="radio"
                                        name="stripe-method"
                                        value="card"
                                        checked={stripePaymentMethod === 'card'}
                                        onChange={() => setStripePaymentMethod('card')}
                                        disabled={isProcessing}
                                        className="w-4 h-4"
                                    />
                                    <div>
                                        <div className="font-medium text-sm">Credit/Debit Card</div>
                                        <div className="text-xs text-muted-foreground">Pay with Visa, Mastercard, or other cards</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* UPI Details Form - Shows First */}
                        {stripePaymentMethod === 'upi' && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-medium mb-3">Enter UPI Details</div>
                                <div className="space-y-2">
                                    <Label htmlFor="upi-id">UPI ID</Label>
                                    <Input
                                        id="upi-id"
                                        type="text"
                                        placeholder="yourname@paytm"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        disabled={isProcessing}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter your UPI ID (e.g., yourname@paytm, yourname@ybl)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Card Details Form - Loads only when selected */}
                        {stripePaymentMethod === 'card' && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-medium mb-3">Enter Card Details</div>
                                <div ref={cardElementRef} className="p-3 bg-white border rounded-md" />
                            </div>
                        )}

                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                                🔒 Your payment is secured by Stripe. We never store your card or UPI details.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowStripeDialog(false);
                                setIsProcessing(false);
                                setUpiId('');
                                setStripePaymentMethod('upi'); // Reset to UPI default
                            }}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStripePayment}
                            disabled={isProcessing || !stripe}
                            className="cursor-pointer"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay Now
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}
