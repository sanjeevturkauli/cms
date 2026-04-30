import { Head, router, usePage } from '@inertiajs/react';
import {
    RefreshCw,
    CheckCircle,
    History,
    ArrowRight,
    Calendar,
    Info,
    CreditCard,
    Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

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
    team_size_limit?: number;
    formatted_team_size_limit?: string;
}

interface Team {
    id: number;
    name: string;
    team_id: string;
    members_count: number;
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

interface PaymentGateway {
    enabled: boolean;
    name: string;
    description: string;
    public_key?: string;
    key_id?: string;
}

interface Props {
    teams: Team[];
    packages: PackageType[];
    wallet: {
        balance: string;
        raw_balance: number;
    };
    paymentGateways: {
        stripe: PaymentGateway;
        paypal: PaymentGateway;
        razorpay: PaymentGateway;
    };
    cancellationFee: number;
}

declare global {
    interface Window {
        Stripe: any;
        Razorpay: any;
    }
}

interface StripeElements {
    create: (type: string, options?: any) => StripeCardElement;
}

interface StripeCardElement {
    mount: (domElement: string | HTMLElement) => void;
    unmount: () => void;
    destroy: () => void;
    on: (event: string, handler: (event: any) => void) => void;
}

export default function TeamSubscriptionsIndex({ teams, packages, wallet, paymentGateways, cancellationFee }: Props) {
    const { props } = usePage();
    const auth = props.auth as any; // Get authenticated user data

    const [isRefreshing, setIsRefreshing] = useState(false);
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
    const [showStripeCheckout, setShowStripeCheckout] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [stripe, setStripe] = useState<any>(null);
    const [stripeElements, setStripeElements] = useState<StripeElements | null>(null);
    const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [stripePaymentMethod, setStripePaymentMethod] = useState<'card' | 'upi'>('upi'); // Defaul
    const [upiId, setUpiId] = useState('');
    const [showRazorpayCheckout, setShowRazorpayCheckout] = useState(false);
    const [razorpay, setRazorpay] = useState<any>(null);
    const [razorpayError, setRazorpayError] = useState<string | null>(null);
    const cardElementRef = useRef<HTMLDivElement>(null);

    // Set default gateway to first enabled one
    const getDefaultGateway = () => {
        if (paymentGateways.razorpay.enabled) return 'razorpay';
        if (paymentGateways.stripe.enabled) return 'stripe';
        if (paymentGateways.paypal.enabled) return 'paypal';
        return 'razorpay'; // fallback
    };

    const [selectedGateway, setSelectedGateway] = useState<string>(getDefaultGateway());

    // UPI ID validation
    const formatUpiId = (value: string) => {
        return value.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
    };

    const handleUpiIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUpiId(formatUpiId(e.target.value));
    };

    const validateUpiId = () => {
        if (!upiId.includes('@')) {
            toast.error('Please enter a valid UPI ID (e.g., yourname@paytm)');
            return false;
        }
        return true;
    };

    const handlePackageSelection = (packageId: number) => {
        setSelectedPackageId(packageId);
        setShowPaymentDialog(true);
    };

    const handlePaymentProceed = () => {
        const teamToSubscribe = teams.find(t => t.subscription) || teams[0];

        if (!teamToSubscribe || !selectedPackageId) {
            return;
        }

        // If Stripe is selected, show Stripe checkout dialog and load Stripe
        if (selectedGateway === 'stripe') {
            setShowPaymentDialog(false);
            setShowStripeCheckout(true);
            // Load Stripe when user clicks "Proceed to Payment"
            loadStripe();
            return;
        }

        // If Razorpay is selected, show Razorpay checkout dialog and load Razorpay
        if (selectedGateway === 'razorpay') {
            setShowPaymentDialog(false);
            setShowRazorpayCheckout(true);
            // Load Razorpay when user clicks "Proceed to Payment"
            loadRazorpay();
            return;
        }

        // For other gateways, redirect to their pages
        router.post('/team/payment/initiate', {
            team_id: teamToSubscribe.id,
            package_id: selectedPackageId,
            payment_gateway: selectedGateway,
        });
    };

    const loadStripe = () => {
        // Get public key from backend settings (passed via paymentGateways prop)
        const publicKey = paymentGateways.stripe.public_key || '';

        console.log('Loading Stripe with public key:', publicKey ? 'Key present' : 'Key missing');

        if (!publicKey) {
            toast.error('Stripe public key not configured');
            return;
        }

        if (window.Stripe) {
            console.log('Stripe already loaded, initializing...');
            const stripeInstance = window.Stripe(publicKey);
            setStripe(stripeInstance);
            const elements = stripeInstance.elements();
            setStripeElements(elements);
            console.log('Stripe initialized successfully');
            return;
        }

        console.log('Loading Stripe.js script...');
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
            console.log('Stripe.js loaded');
            if (window.Stripe) {
                const stripeInstance = window.Stripe(publicKey);
                setStripe(stripeInstance);
                const elements = stripeInstance.elements();
                setStripeElements(elements);
                console.log('Stripe initialized successfully');
            } else {
                console.error('Stripe object not found after script load');
                toast.error('Failed to load Stripe');
            }
        };
        script.onerror = () => {
            console.error('Failed to load Stripe.js script');
            toast.error('Failed to load Stripe');
        };
        document.body.appendChild(script);
    };

    const loadRazorpay = () => {
        // Get key from backend settings (passed via paymentGateways prop)
        const keyId = paymentGateways.razorpay.key_id || '';

        console.log('Loading Razorpay with key:', keyId ? 'Key present' : 'Key missing');

        if (!keyId) {
            toast.error('Razorpay key not configured');
            return;
        }

        if (window.Razorpay) {
            console.log('Razorpay already loaded');
            setRazorpay(true); // Just set to true since we use window.Razorpay directly
            return;
        }

        console.log('Loading Razorpay script...');
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            console.log('Razorpay script loaded');
            if (window.Razorpay) {
                setRazorpay(true); // Just set to true since we use window.Razorpay directly
                console.log('Razorpay initialized successfully');
            } else {
                console.error('Razorpay object not found after script load');
                toast.error('Failed to load Razorpay');
            }
        };
        script.onerror = () => {
            console.error('Failed to load Razorpay script');
            toast.error('Failed to load Razorpay');
        };
        document.body.appendChild(script);
    };

    // Mount Stripe Card Element when Stripe is loaded and dialog is open
    useEffect(() => {
        // Wait for: dialog open + stripe loaded + elements created + card method + ref ready + not already mounted
        if (showStripeCheckout && stripe && stripeElements && stripePaymentMethod === 'card' && cardElementRef.current && !cardElement) {
            console.log('Mounting Stripe Card Element...');

            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                if (!cardElementRef.current) {
                    console.error('Card element ref not available');
                    return;
                }

                try {
                    const card = stripeElements.create('card', {
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                    color: '#aab7c4',
                                },
                                padding: '10px 12px',
                            },
                            invalid: {
                                color: '#9e2146',
                            },
                        },
                        hidePostalCode: true,
                    });

                    card.mount(cardElementRef.current);
                    setCardElement(card);

                    // Listen for errors
                    card.on('change', (event: any) => {
                        if (event.error) {
                            setStripeError(event.error.message);
                        } else {
                            setStripeError(null);
                        }
                    });

                    console.log('Stripe Card Element mounted successfully');
                } catch (error) {
                    console.error('Error mounting card element:', error);
                    toast.error('Failed to load card input. Please try again.');
                }
            }, 100);

            return () => clearTimeout(timer);
        }

        // Cleanup when switching to UPI
        if (cardElement && stripePaymentMethod === 'upi') {
            console.log('Unmounting card element - switched to UPI');
            try {
                cardElement.destroy();
            } catch (e) {
                console.error('Error destroying card element:', e);
            }
            setCardElement(null);
        }
    }, [showStripeCheckout, stripe, stripeElements, stripePaymentMethod, cardElement]);

    // Cleanup card element when dialog closes
    useEffect(() => {
        if (!showStripeCheckout && cardElement) {
            console.log('Unmounting card element - dialog closed');
            try {
                cardElement.destroy();
            } catch (e) {
                console.error('Error destroying card element:', e);
            }
            setCardElement(null);
        }
    }, [showStripeCheckout, cardElement]);

    const handleStripePayment = async () => {
        if (!stripe) {
            toast.error('Stripe is not initialized');
            return;
        }

        // Validate based on payment method
        if (stripePaymentMethod === 'card') {
            if (!cardElement) {
                toast.error('Card element not loaded. Please try again.');
                return;
            }
        } else if (stripePaymentMethod === 'upi') {
            if (!validateUpiId()) {
                return;
            }
        }

        const teamToSubscribe = teams.find(t => t.subscription) || teams[0];
        if (!teamToSubscribe || !selectedPackageId) {
            toast.error('Please select a package');
            return;
        }

        setIsProcessingPayment(true);
        const toastId = toast.loading('Creating payment...');

        try {
            // Step 1: Create Payment Intent on backend using fetch
            const response = await fetch('/team/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    team_id: teamToSubscribe.id,
                    package_id: selectedPackageId,
                    payment_gateway: 'stripe',
                }),
            });

            const data = await response.json();
            console.log('Stripe Payment Data:', data);

            if (!data.success) {
                toast.dismiss(toastId);
                toast.error(data.error || 'Failed to create payment');
                setIsProcessingPayment(false);
                return;
            }

            toast.dismiss(toastId);
            const processingToast = toast.loading('Processing payment...');

            try {
                let paymentResult;

                if (stripePaymentMethod === 'card') {
                    // Step 2: Confirm payment using Stripe Card Element
                    paymentResult = await stripe.confirmCardPayment(
                        data.client_secret,
                        {
                            payment_method: {
                                card: cardElement,
                                billing_details: {
                                    name: auth?.user?.name || teamToSubscribe.name,
                                    email: auth?.user?.email || '',
                                    // Add address for Indian regulations
                                    address: {
                                        line1: 'Street address',
                                        city: 'Surat',
                                        state: 'Gujarat',
                                        postal_code: '395006',
                                        country: 'IN',
                                    },
                                },
                            },
                        }
                    );
                } else {
                    // UPI payment (if supported by Stripe in your region)
                    toast.dismiss(processingToast);
                    toast.error('UPI payment is not yet supported. Please use card payment.');
                    setIsProcessingPayment(false);
                    return;
                }

                toast.dismiss(processingToast);

                if (paymentResult.error) {
                    toast.error(paymentResult.error.message || 'Payment failed');
                    setIsProcessingPayment(false);
                    return;
                }

                if (paymentResult.paymentIntent && paymentResult.paymentIntent.status === 'succeeded') {
                    // Step 3: Confirm payment on backend
                    router.post('/team/payment/callback/stripe', {
                        payment_intent: paymentResult.paymentIntent.id,
                        transaction_id: data.transaction_id,
                    }, {
                        onSuccess: () => {
                            // Cleanup card element
                            if (cardElement) {
                                try {
                                    cardElement.destroy();
                                } catch (e) {
                                    console.error('Error destroying card element:', e);
                                }
                                setCardElement(null);
                            }

                            setShowStripeCheckout(false);
                            setIsProcessingPayment(false);
                            setUpiId('');
                            setStripePaymentMethod('upi'); // Reset to UPI default
                            setSelectedPackageId(null);
                            setStripeError(null);
                            toast.success('Payment successful!');
                        },
                        onError: (errors) => {
                            console.error('Payment confirmation error:', errors);
                            toast.error('Payment succeeded but confirmation failed. Please contact support.');
                            setIsProcessingPayment(false);
                        }
                    });
                } else {
                    toast.error('Payment was not successful');
                    setIsProcessingPayment(false);
                }
            } catch (error: any) {
                toast.dismiss(processingToast);
                console.error('Stripe error:', error);
                toast.error(error.message || 'Payment failed');
                setIsProcessingPayment(false);
            }

        } catch (error: any) {
            toast.dismiss(toastId);
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment failed. Please try again.');
            setIsProcessingPayment(false);
        }
    };

    const handleRazorpayPayment = async () => {
        if (!razorpay || !window.Razorpay) {
            toast.error('Razorpay is not initialized');
            return;
        }

        const teamToSubscribe = teams.find(t => t.subscription) || teams[0];
        if (!teamToSubscribe || !selectedPackageId) {
            toast.error('Please select a package');
            return;
        }

        setIsProcessingPayment(true);
        const toastId = toast.loading('Creating payment...');

        try {
            // Step 1: Create Payment Order on backend using fetch
            const response = await fetch('/team/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    team_id: teamToSubscribe.id,
                    package_id: selectedPackageId,
                    payment_gateway: 'razorpay',
                }),
            });

            const data = await response.json();
            console.log('Razorpay Payment Data:', data);

            if (!data.success) {
                toast.dismiss(toastId);
                toast.error(data.error || 'Failed to create payment');
                setIsProcessingPayment(false);
                return;
            }

            toast.dismiss(toastId);
            console.log('Creating Razorpay options with:', {
                key: paymentGateways.razorpay.key_id,
                amount: data.amount,
                currency: data.currency,
                order_id: data.order_id
            });

            // Step 2: Open Razorpay Checkout
            const options = {
                key: paymentGateways.razorpay.key_id,
                amount: data.amount,
                currency: data.currency,
                name: teamToSubscribe.name,
                description: `Subscription for ${data.package_name}`,
                order_id: data.order_id,
                handler: function (razorpayResponse: any) {
                    // Step 3: Confirm payment on backend
                    router.post('/team/payment/callback/razorpay', {
                        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                        razorpay_order_id: razorpayResponse.razorpay_order_id,
                        razorpay_signature: razorpayResponse.razorpay_signature,
                        transaction_id: data.transaction_id,
                    }, {
                        onSuccess: () => {
                            setShowRazorpayCheckout(false);
                            setIsProcessingPayment(false);
                            setSelectedPackageId(null);
                            setRazorpayError(null);
                            toast.success('Payment successful!');
                        },
                        onError: (errors) => {
                            console.error('Payment confirmation error:', errors);
                            toast.error('Payment succeeded but confirmation failed. Please contact support.');
                            setIsProcessingPayment(false);
                        }
                    });
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessingPayment(false);
                        toast.error('Payment cancelled');
                    }
                },
                prefill: {
                    name: auth?.user?.name || teamToSubscribe.name,
                    email: auth?.user?.email || '',
                },
                theme: {
                    color: '#3B82F6'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error: any) {
            toast.dismiss(toastId);
            console.error('Payment error:', error);
            toast.error(error.message || 'Payment failed. Please try again.');
            setIsProcessingPayment(false);
        }
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
                                            <div key={team.id} className="p-3 sm:p-4 bg-muted rounded-lg">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                                    <h3 className="font-semibold text-lg">{team.name}</h3>
                                                    {team.subscription && getStatusBadge(team.subscription)}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                                    <div>
                                                        <span className="font-medium">Package:</span>
                                                        <div className="text-base sm:text-lg font-semibold">{team.subscription!.package_name}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Members:</span>
                                                        <div className="text-base sm:text-lg font-semibold">{team.members_count}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Amount Paid:</span>
                                                        <div className="text-base sm:text-lg font-semibold">{team.subscription!.amount_paid}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">End Date:</span>
                                                        <div>{team.subscription!.end_date}</div>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Days Remaining:</span>
                                                        <div className={`font-semibold ${team.subscription!.days_remaining <= 30
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
                            <div className="space-y-6 ">
                                <div className="grid gap-3 sm:flex items-center justify-between">
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
                                            onClick={() => router.visit('/team/subscriptions/history')}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <History className="h-4 w-4" />
                                            View History
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
                                            <Card key={pkg.id} className={`relative transition-all hover:shadow-lg ${isCurrentPackage ? 'ring-2 ring-blue-500 bg-blue-50' : ''
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
                <DialogContent className="w-[calc(100vw-2rem)] max-w-6xl max-h-[85vh] p-0 gap-0 flex flex-col">
                    <div className="px-6 pt-6 pb-4 border-b shrink-0">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Subscription History
                            </DialogTitle>
                            <DialogDescription>
                                Complete history of your subscription activities
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="overflow-auto flex-1">
                        {isLoadingLogs ? (
                            <div className="flex items-center justify-center py-8 px-6">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Loading logs...</span>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8 px-6">
                                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No subscription history found</p>
                            </div>
                        ) : (
                            <div className="px-6 py-4">
                            <TooltipProvider>
                                <div className="overflow-x-auto -mx-6 px-6">
                                <Table className="min-w-[600px]">
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
                                </div>
                            </TooltipProvider>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancellation Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
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
                                            If you cancel this subscription, a cancellation fee of <span className="font-semibold">₹{cancellationFee}</span> will be charged from your wallet and transferred to admin.
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

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={isCancelling}
                            className='cursor-pointer w-full sm:w-auto'
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmCancelSubscription}
                            disabled={wallet.raw_balance < cancellationFee || isCancelling}
                            className="cursor-pointer w-full sm:w-auto min-w-[140px]"
                        >
                            {isCancelling ? (
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Cancelling...
                                </div>
                            ) : wallet.raw_balance < cancellationFee ? (
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
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Payment Method</DialogTitle>
                        <DialogDescription>
                            Choose your preferred payment gateway to complete the subscription
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-3">
                            {/* Razorpay */}
                            <label className={`flex items-center gap-3 p-4 border rounded-lg ${paymentGateways.razorpay.enabled
                                ? 'cursor-pointer hover:bg-gray-50'
                                : 'opacity-50 cursor-not-allowed'
                                }`}>
                                <input
                                    type="radio"
                                    name="gateway"
                                    value="razorpay"
                                    checked={selectedGateway === 'razorpay'}
                                    onChange={(e) => setSelectedGateway(e.target.value)}
                                    disabled={!paymentGateways.razorpay.enabled}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">{paymentGateways.razorpay.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {paymentGateways.razorpay.enabled
                                            ? paymentGateways.razorpay.description
                                            : 'Coming Soon'}
                                    </div>
                                </div>
                            </label>

                            {/* Stripe */}
                            <label className={`flex items-center gap-3 p-4 border rounded-lg ${paymentGateways.stripe.enabled
                                ? 'cursor-pointer hover:bg-gray-50'
                                : 'opacity-50 cursor-not-allowed'
                                }`}>
                                <input
                                    type="radio"
                                    name="gateway"
                                    value="stripe"
                                    checked={selectedGateway === 'stripe'}
                                    onChange={(e) => setSelectedGateway(e.target.value)}
                                    disabled={!paymentGateways.stripe.enabled}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">{paymentGateways.stripe.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {paymentGateways.stripe.enabled
                                            ? paymentGateways.stripe.description
                                            : 'Coming Soon'}
                                    </div>
                                </div>
                            </label>

                            {/* PayPal */}
                            <label className={`flex items-center gap-3 p-4 border rounded-lg ${paymentGateways.paypal.enabled
                                ? 'cursor-pointer hover:bg-gray-50'
                                : 'opacity-50 cursor-not-allowed'
                                }`}>
                                <input
                                    type="radio"
                                    name="gateway"
                                    value="paypal"
                                    checked={selectedGateway === 'paypal'}
                                    onChange={(e) => setSelectedGateway(e.target.value)}
                                    disabled={!paymentGateways.paypal.enabled}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-semibold">{paymentGateways.paypal.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {paymentGateways.paypal.enabled
                                            ? paymentGateways.paypal.description
                                            : 'Coming Soon'}
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                {selectedGateway === 'stripe'
                                    ? 'Stripe checkout will open in a dialog for secure payment processing.'
                                    : 'You will be redirected to the payment gateway to complete your transaction securely.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowPaymentDialog(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePaymentProceed}
                            className="cursor-pointer w-full sm:w-auto"
                        >
                            Proceed to Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Stripe Checkout Dialog */}
            <Dialog open={showStripeCheckout} onOpenChange={(open) => {
                if (!open) {
                    // Cleanup when dialog closes
                    console.log('Dialog closing, cleaning up...');
                    if (cardElement) {
                        try {
                            cardElement.destroy();
                        } catch (e) {
                            console.error('Error destroying card element:', e);
                        }
                        setCardElement(null);
                    }
                    // Reset Stripe instances so they reload fresh next time
                    setStripe(null);
                    setStripeElements(null);
                    setUpiId('');
                    setStripeError(null);
                    setStripePaymentMethod('upi'); // Reset to UPI default
                }
                setShowStripeCheckout(open);
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Stripe Payment
                        </DialogTitle>
                        <DialogDescription>
                            Complete your payment securely with Stripe
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                        {/* Payment Method Selection */}
                        <div className="space-y-3">
                            <div className="text-sm font-medium">Select Payment Method</div>
                            <div className="space-y-2">
                                {/* UPI Option - Now First */}
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${stripePaymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : ''
                                    }`}>
                                    <input
                                        type="radio"
                                        name="stripe-method"
                                        value="upi"
                                        checked={stripePaymentMethod === 'upi'}
                                        onChange={() => {
                                            setStripePaymentMethod('upi');
                                        }}
                                        disabled={isProcessingPayment}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">UPI</div>
                                        <div className="text-xs text-muted-foreground">
                                            Pay using Google Pay, PhonePe, Paytm, etc.
                                        </div>
                                    </div>
                                    <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                    </svg>
                                </label>

                                {/* Card Option - Now Second */}
                                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${stripePaymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : ''
                                    }`}>
                                    <input
                                        type="radio"
                                        name="stripe-method"
                                        value="card"
                                        checked={stripePaymentMethod === 'card'}
                                        onChange={() => {
                                            setStripePaymentMethod('card');
                                        }}
                                        disabled={isProcessingPayment}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">Credit/Debit Card</div>
                                        <div className="text-xs text-muted-foreground">
                                            Pay with Visa, Mastercard, or other cards
                                        </div>
                                    </div>
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                </label>
                            </div>
                        </div>

                        {/* UPI Details Form - Now Shows First */}
                        {stripePaymentMethod === 'upi' && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-medium mb-3">
                                    UPI Details
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">UPI ID</label>
                                        <input
                                            type="text"
                                            placeholder="yourname@paytm"
                                            value={upiId}
                                            onChange={handleUpiIdChange}
                                            className="w-full px-3 py-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isProcessingPayment}
                                        />
                                    </div>
                                    <div className="text-xs text-center text-muted-foreground">
                                        Or scan QR code from your UPI app
                                    </div>
                                    <div className="flex items-center justify-center p-4 bg-white border rounded">
                                        <div className="text-center">
                                            <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center mx-auto mb-2">
                                                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                QR Code will appear here
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                                    <span>🔒</span>
                                    <span>Secure UPI payment powered by Stripe</span>
                                </div>
                            </div>
                        )}

                        {/* Card Details Form - Loads only when selected */}
                        {/* Card Details Form - Loads only when selected */}
                        {stripePaymentMethod === 'card' && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <div className="text-sm font-medium mb-3">
                                    Card Details
                                </div>
                                <div className="space-y-3">
                                    {/* Stripe Card Element Container */}
                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">
                                            Card Information
                                        </label>
                                        {!stripe || !stripeElements ? (
                                            <div className="w-full px-3 py-3 border rounded bg-white flex items-center justify-center" style={{ minHeight: '40px' }}>
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                                                <span className="text-sm text-muted-foreground">Loading payment form...</span>
                                            </div>
                                        ) : (
                                            <div
                                                ref={cardElementRef}
                                                className="w-full px-3 py-3 border rounded bg-white"
                                                style={{ minHeight: '40px' }}
                                            />
                                        )}
                                        {stripeError && (
                                            <p className="text-xs text-red-600 mt-1">{stripeError}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                                    <span>🔒</span>
                                    <span>Your payment information is secure and encrypted</span>
                                </div>
                            </div>
                        )}

                        {/* Live Mode Notice */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-800">
                                <strong>🔒 Secure Payment:</strong> Your payment will be processed securely through Stripe.
                                Use test card <strong>4242 4242 4242 4242</strong> for testing.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Cleanup card element before going back
                                if (cardElement) {
                                    try {
                                        cardElement.destroy();
                                    } catch (e) {
                                        console.error('Error destroying card element:', e);
                                    }
                                    setCardElement(null);
                                }
                                setShowStripeCheckout(false);
                                setShowPaymentDialog(true);
                                setStripePaymentMethod('upi'); // Reset to UPI default
                                setUpiId('');
                            }}
                            disabled={isProcessingPayment}
                            className="w-full sm:w-auto"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleStripePayment}
                            disabled={isProcessingPayment || !stripe}
                            className="cursor-pointer w-full sm:w-auto min-w-[120px]"
                        >
                            {isProcessingPayment ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                'Pay Now'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Razorpay Checkout Dialog */}
            <Dialog open={showRazorpayCheckout} onOpenChange={(open) => {
                if (!open) {
                    // Cleanup when dialog closes
                    setRazorpayError(null);
                    setSelectedPackageId(null);
                }
                setShowRazorpayCheckout(open);
            }}>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Razorpay Payment</DialogTitle>
                        <DialogDescription>
                            Complete your subscription payment securely with Razorpay
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        {/* Package Summary */}
                        {/* {selectedPackageId && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-blue-900 mb-2">
                                    Package Details
                                </div>
                                {(() => {
                                    const selectedPackage = packages.find(p => p.id === selectedPackageId);
                                    return selectedPackage ? (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-800">Package:</span>
                                                <span className="font-medium text-blue-900">{selectedPackage.name}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-800">Duration:</span>
                                                <span className="font-medium text-blue-900">{selectedPackage.duration_range}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-blue-800">Team Size Limit:</span>
                                                <span className="font-medium text-blue-900">{selectedPackage.formatted_person}</span>
                                            </div>
                                            <div className="flex justify-between text-sm border-t border-blue-300 pt-2 mt-2">
                                                <span className="text-blue-800 font-medium">Total Amount:</span>
                                                <span className="font-bold text-blue-900">{selectedPackage.formatted_price}</span>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )} */}

                        {/* Payment Info */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <div className="text-sm font-medium mb-3">
                                Payment Method
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-sm">Razorpay</div>
                                    <div className="text-xs text-muted-foreground">UPI, Cards, NetBanking, Wallets</div>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                                <span>🔒</span>
                                <span>Secure payment powered by Razorpay</span>
                            </div>
                        </div>

                        {razorpayError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">{razorpayError}</p>
                            </div>
                        )}

                        {/* Live Mode Notice */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-800">
                                <strong>🔒 Secure Payment:</strong> Your payment will be processed securely through Razorpay.
                                Multiple payment options available including UPI, cards, and wallets.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRazorpayCheckout(false);
                                setShowPaymentDialog(true);
                            }}
                            disabled={isProcessingPayment}
                            className="w-full sm:w-auto"
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleRazorpayPayment}
                            disabled={isProcessingPayment || !razorpay || !window.Razorpay}
                            className="cursor-pointer w-full sm:w-auto min-w-[120px]"
                        >
                            {isProcessingPayment ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                'Pay with Razorpay'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
}