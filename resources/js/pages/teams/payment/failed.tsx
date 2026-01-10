import { Head, Link } from '@inertiajs/react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

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
    };
}

export default function PaymentFailed({ transaction }: Props) {
    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="Payment Failed" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col items-center justify-center p-6">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
                            <CardDescription>
                                Your payment could not be processed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-700">Transaction ID:</span>
                                    <span className="font-mono font-medium text-red-900">{transaction.transaction_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-700">Amount:</span>
                                    <span className="font-medium text-red-900">{transaction.amount}</span>
                                </div>
                            </div>

                            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                                <p className="text-sm text-yellow-800 mb-2 font-medium">
                                    Possible reasons for payment failure:
                                </p>
                                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                                    <li>Payment was cancelled by you</li>
                                    <li>Insufficient funds in your account</li>
                                    <li>Payment gateway timeout</li>
                                    <li>Network connectivity issues</li>
                                </ul>
                            </div>

                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                                <p className="text-sm text-blue-800">
                                    No amount has been deducted. You can try again.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link href="/team/subscriptions">
                                    <Button className="w-full cursor-pointer" size="lg">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Try Again
                                    </Button>
                                </Link>
                                <Link href="/team">
                                    <Button variant="outline" className="w-full cursor-pointer" size="lg">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Dashboard
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
