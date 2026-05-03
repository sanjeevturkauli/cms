import { Link, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';

interface KycStatusData {
    status: string;
    text: string;
    class: string;
    clickable: boolean;
    url?: string;
    reason?: string;
}

export function KycStatusBanner() {
    const { props } = usePage<SharedData & { kycStatus?: KycStatusData }>();
    const kycStatus = props.kycStatus;

    if (!kycStatus || props.isAdmin) return null;

    const getStatusConfig = () => {
        switch (kycStatus.status) {
            case 'pending':
                return {
                    icon: AlertCircle,
                    iconColor: 'text-yellow-500',
                    borderColor: 'border-l-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    title: 'KYC Verification Required',
                    message: 'Please complete your KYC verification to access all features and ensure account security.',
                    actionText: 'Complete KYC',
                    actionVariant: 'default' as const,
                };
            case 'submitted':
                return {
                    icon: Clock,
                    iconColor: 'text-blue-500',
                    borderColor: 'border-l-blue-500',
                    bgColor: 'bg-blue-500/10',
                    title: 'KYC Under Review',
                    message: 'Your KYC application has been submitted and is currently under review. We will notify you once complete.',
                    actionText: 'View Status',
                    actionVariant: 'outline' as const,
                };
            case 'approved':
                return {
                    icon: CheckCircle,
                    iconColor: 'text-green-500',
                    borderColor: 'border-l-green-500',
                    bgColor: 'bg-green-500/10',
                    title: 'KYC Verified Successfully',
                    message: 'Your KYC verification has been approved. You now have full access to all features.',
                    actionText: 'View Details',
                    actionVariant: 'outline' as const,
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    iconColor: 'text-destructive',
                    borderColor: 'border-l-destructive',
                    bgColor: 'bg-destructive/10',
                    title: 'KYC Verification Rejected',
                    message: kycStatus.reason
                        ? `Rejected: ${kycStatus.reason}. Please review and resubmit with correct information.`
                        : 'Your KYC application was rejected. Please review the feedback and resubmit.',
                    actionText: 'Resubmit KYC',
                    actionVariant: 'destructive' as const,
                };
            default:
                return null;
        }
    };

    const statusConfig = getStatusConfig();
    if (!statusConfig) return null;

    const { icon: Icon, iconColor, borderColor, bgColor, title, message, actionText, actionVariant } = statusConfig;

    return (
        <div className={cn(
            'flex items-start gap-4 rounded-lg border border-border border-l-4 p-4',
            borderColor,
            bgColor
        )}>
            <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', iconColor)} />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <Badge className={kycStatus.class}>
                    {kycStatus.text}
                </Badge>
                {kycStatus.clickable && kycStatus.url && (
                    <Link href={kycStatus.url}>
                        <Button variant={actionVariant} size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            {actionText}
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}