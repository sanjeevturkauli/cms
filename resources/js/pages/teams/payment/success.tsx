import { Head, Link } from '@inertiajs/react';
import { CheckCircle, ArrowRight } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
    transaction: {
        id: number;
        transaction_id: string;
        amount: string;
        status: string;
        package_name: string;
    };
}

export default function PaymentSuccess({ transaction }: Props) {
    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="Payment Successful" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col items-center justify-center p-6">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
                            <CardDescription>
                                Your subscription has been activated successfully
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-700">Transaction ID:</span>
                                    <span className="font-mono font-medium text-green-900">{transaction.transaction_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-700">Package:</span>
                                    <span className="font-medium text-green-900">{transaction.package_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-700">Amount Paid:</span>
                                    <span className="font-medium text-green-900">{transaction.amount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-700">Status:</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {transaction.status}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                                <p className="text-sm text-blue-800">
                                    Thank you for your subscription! You can now access all premium features.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link href="/team/subscriptions">
                                    <Button className="w-full cursor-pointer" size="lg">
                                        View Subscription Details
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/team">
                                    <Button variant="outline" className="w-full cursor-pointer" size="lg">
                                        Go to Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
