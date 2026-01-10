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
    razorpay_key: string;
    callback_url: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function RazorpayPayment({ transaction, package: pkg, team, razorpay_key, callback_url }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            setIsLoading(false);
            initializePayment();
        };
        script.onerror = () => {
            setError('Failed to load Razorpay. Please try again.');
            setIsLoading(false);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const initializePayment = () => {
        if (!window.Razorpay) {
            setError('Razorpay is not available. Please refresh the page.');
            return;
        }

        const options = {
            key: razorpay_key,
            amount: transaction.amount,
            currency: transaction.currency,
            name: 'Team Subscription',
            description: `${pkg.name} Package for ${team.name}`,
            order_id: transaction.transaction_id,
            handler: function (response: any) {
                // Payment successful, submit to callback
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = callback_url;

                const fields = {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id || '',
                    razorpay_signature: response.razorpay_signature || '',
                    transaction_id: transaction.transaction_id,
                    _token: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                };

                Object.entries(fields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            },
            modal: {
                ondismiss: function () {
                    // Payment cancelled or dismissed
                    router.get(`/team/payment/failed/${transaction.transaction_id}`);
                }
            },
            theme: {
                color: '#3b82f6'
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
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
                                Please wait while we initialize your payment
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            {isLoading && (
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm text-muted-foreground">
                                        Loading Razorpay checkout...
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
                                    <p className="text-sm text-muted-foreground">
                                        If the payment window doesn't open automatically, please refresh the page.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
