import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { RefreshCw, CreditCard } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    transaction: {
        id: number;
        transaction_id: string;
        amount: number;
        currency: string;
    };
    package: {
        name: string;
        price: string;
    };
    team: {
        name: string;
    };
    stripe_public_key: string;
    callback_url: string;
}

declare global {
    interface Window {
        Stripe: any;
    }
}

export default function StripePayment({ transaction, package: pkg, team, stripe_public_key, callback_url }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stripe, setStripe] = useState<any>(null);

    useEffect(() => {
        // Load Stripe script
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
            if (window.Stripe) {
                const stripeInstance = window.Stripe(stripe_public_key);
                setStripe(stripeInstance);
                setIsLoading(false);
            } else {
                setError('Failed to initialize Stripe. Please try again.');
                setIsLoading(false);
            }
        };
        script.onerror = () => {
            setError('Failed to load Stripe. Please try again.');
            setIsLoading(false);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [stripe_public_key]);

    const handlePayment = async () => {
        if (!stripe) {
            setError('Stripe is not initialized. Please refresh the page.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // For demo purposes, we'll simulate a successful payment
            // In production, you would create a PaymentIntent on the server
            // and use stripe.confirmCardPayment() with the client secret
            
            // Simulating payment success after 2 seconds
            setTimeout(() => {
                // Use Inertia router to submit the form with CSRF protection
                router.post(callback_url, {
                    payment_intent: `pi_demo_${Date.now()}`,
                    transaction_id: transaction.transaction_id,
                });
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Payment failed. Please try again.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (stripe && !isLoading) {
            handlePayment();
        }
    }, [stripe]);

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="Processing Payment" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col items-center justify-center p-6">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                <CreditCard className="h-8 w-8 text-blue-600" />
                            </div>
                            <CardTitle>Processing Payment</CardTitle>
                            <CardDescription>
                                Please wait while we process your payment with Stripe
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            {isLoading && (
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm text-muted-foreground">
                                        Processing your payment...
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                                    {error}
                                </div>
                            )}

                            {!isLoading && !error && (
                                <div className="space-y-3">
                                    <div className="rounded-lg bg-blue-50 p-4">
                                        <div className="text-sm text-blue-800">
                                            <div className="font-semibold mb-2">Payment Details:</div>
                                            <div className="space-y-1">
                                                <div>Package: <span className="font-medium">{pkg.name}</span></div>
                                                <div>Team: <span className="font-medium">{team.name}</span></div>
                                                <div>Amount: <span className="font-medium">{pkg.price}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
