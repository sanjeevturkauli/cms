import { Link, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Clock, IndianRupee, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaymentStatus {
    type: 'cleared' | 'upcoming' | 'due' | 'overdue';
    member_id: number;
    team_id: number;
    team_name: string;
    amount: number;
    month_label: string;
    due_date?: string;
    paid_date?: string;
    next_due?: string;
    days_left?: number;
    payment_id: number | null;
    status: string;
    is_overdue: boolean;
}

export function MemberPaymentBanner() {
    const { props } = usePage<any>();
    const paymentStatuses: PaymentStatus[] = props.memberPaymentStatus || [];

    if (!paymentStatuses.length) return null;

    return (
        <div className="space-y-2">
            {paymentStatuses.map((payment, idx) => {
                let config: {
                    icon: any;
                    iconColor: string;
                    borderColor: string;
                    bgColor: string;
                    title: string;
                    message: string;
                    showPayNow: boolean;
                    actionText?: string;
                    actionVariant?: 'default' | 'destructive' | 'outline';
                };

                switch (payment.type) {
                    case 'cleared':
                        config = {
                            icon: CheckCircle,
                            iconColor: 'text-green-500',
                            borderColor: 'border-l-green-500',
                            bgColor: 'bg-green-500/10',
                            title: `✅ ${payment.month_label} Payment Cleared — ${payment.team_name}`,
                            message: `Your ${payment.month_label} payment of ₹${payment.amount.toLocaleString('en-IN')} for "${payment.team_name}" has been successfully paid${payment.paid_date ? ` on ${payment.paid_date}` : ''}. Next payment due on ${payment.next_due}.`,
                            showPayNow: false,
                        };
                        break;

                    case 'upcoming':
                        config = {
                            icon: CalendarClock,
                            iconColor: 'text-blue-500',
                            borderColor: 'border-l-blue-500',
                            bgColor: 'bg-blue-500/10',
                            title: `📅 Payment Due Soon — ${payment.team_name}`,
                            message: `Your ${payment.month_label} payment of ₹${payment.amount.toLocaleString('en-IN')} for "${payment.team_name}" is due on ${payment.due_date}${payment.days_left !== undefined ? ` (${payment.days_left === 0 ? 'today' : `in ${payment.days_left} day${payment.days_left > 1 ? 's' : ''}`})` : ''}.`,
                            showPayNow: true,
                            actionText: 'Pay Now',
                            actionVariant: 'default',
                        };
                        break;

                    case 'overdue':
                        config = {
                            icon: AlertCircle,
                            iconColor: 'text-destructive',
                            borderColor: 'border-l-destructive',
                            bgColor: 'bg-destructive/10',
                            title: `⚠️ Payment Overdue — ${payment.team_name}`,
                            message: `Your ${payment.month_label} payment of ₹${payment.amount.toLocaleString('en-IN')} for "${payment.team_name}" was due on ${payment.due_date} and is now overdue. Please pay immediately to avoid any issues.`,
                            showPayNow: true,
                            actionText: 'Pay Now',
                            actionVariant: 'destructive',
                        };
                        break;

                    default: // 'due'
                        config = {
                            icon: Clock,
                            iconColor: 'text-yellow-500',
                            borderColor: 'border-l-yellow-500',
                            bgColor: 'bg-yellow-500/10',
                            title: `💰 Payment Due — ${payment.team_name}`,
                            message: `Your ${payment.month_label} payment of ₹${payment.amount.toLocaleString('en-IN')} for "${payment.team_name}" is due on ${payment.due_date}. Please make the payment on time.`,
                            showPayNow: true,
                            actionText: 'Pay Now',
                            actionVariant: 'default',
                        };
                        break;
                }

                const { icon: Icon, iconColor, borderColor, bgColor, title, message, showPayNow, actionText, actionVariant } = config;

                return (
                    <div
                        key={`${payment.member_id}-${payment.month_label}-${idx}`}
                        className={cn(
                            'flex items-start gap-4 rounded-lg border border-l-4 p-4',
                            borderColor,
                            bgColor
                        )}
                    >
                        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconColor)} />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-sm">{title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
                        </div>
                        {showPayNow && (
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="text-sm font-bold flex items-center gap-0.5">
                                    <IndianRupee className="h-3.5 w-3.5" />
                                    {payment.amount.toLocaleString('en-IN')}
                                </div>
                                <Link href="/member/payments">
                                    <Button size="sm" variant={actionVariant ?? 'default'}>
                                        {actionText}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
