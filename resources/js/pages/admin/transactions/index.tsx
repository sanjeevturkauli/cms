import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, Search, Filter, DollarSign, CheckCircle, Clock, XCircle, Info, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Transaction {
    id: number;
    transaction_id: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    team: {
        id: number;
        name: string;
    } | null;
    package: {
        name: string;
    } | null;
    amount: string;
    payment_gateway: string;
    status: string;
    status_badge: {
        text: string;
        color: string;
    };
    created_at: string;
}

interface Stats {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    revenue: string;
}

interface Props {
    transactions: {
        data: Transaction[];
        links: any[];
        current_page: number;
        last_page: number;
    };
    stats: Stats;
    filters: {
        search?: string;
        status?: string;
        gateway?: string;
    };
}

export default function TransactionsIndex({ transactions, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [gateway, setGateway] = useState(filters.gateway || '');

    const handleSearch = () => {
        router.get('/admin/transactions', {
            search,
            status,
            gateway,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setGateway('');
        router.get('/admin/transactions');
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

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="Transactions" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-6 px-4 py-4 md:gap-8 md:py-6 lg:px-6">
                            {/* Stats Cards */}
                            <div className="grid gap-4 md:grid-cols-5">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                        <DollarSign className="h-4 w-4 text-blue-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">{stats.revenue}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Filters */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transactions</CardTitle>
                                    <CardDescription>Manage and view all payment transactions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                            <div className="flex-1">
                                                <label className="text-sm font-medium mb-2 block">Search</label>
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search by transaction ID, user, team..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                        className="pl-8"
                                                    />
                                                </div>
                                            </div>
                                            <div className="">
                                                <label className="text-sm font-medium mb-2 block">Status</label>
                                                <Select value={status || 'all'} onValueChange={(val) => setStatus(val === 'all' ? '' : val)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="failed">Failed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="">
                                                <label className="text-sm font-medium mb-2 block">Gateway</label>
                                                <Select value={gateway || 'all'} onValueChange={(val) => setGateway(val === 'all' ? '' : val)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Gateways" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Gateways</SelectItem>
                                                        <SelectItem value="stripe">Stripe</SelectItem>
                                                        <SelectItem value="razorpay">Razorpay</SelectItem>
                                                        <SelectItem value="paypal">PayPal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={handleSearch} className="cursor-pointer">
                                                <Filter className="h-4 w-4 mr-2" />
                                                Filter
                                            </Button>
                                            <Button onClick={handleReset} variant="outline" className="cursor-pointer">
                                                Reset
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Transactions Table */}
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>#ID</TableHead>
                                                <TableHead>Transaction ID</TableHead>
                                                {/* <TableHead>User</TableHead> */}
                                                <TableHead>Team</TableHead>
                                                <TableHead>Package</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Gateway</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.data.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                        No transactions found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                transactions.data.map((transaction) => (
                                                    <TableRow key={transaction.id}>
                                                        <TableCell className="font-mono text-sm">
                                                            {`#${transaction.id}`}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span>{truncateTransactionId(transaction.transaction_id)}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="font-mono">{transaction.transaction_id}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Copy 
                                                                                className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" 
                                                                                onClick={() => copyToClipboard(transaction.transaction_id)}
                                                                            />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Copy Transaction ID</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        {/* <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div>
                                                                    <div className="font-medium">{transaction.user.name}</div>
                                                                    <div className="text-sm text-muted-foreground">{truncateTransactionId(transaction.user.email , 15)}</div>
                                                                </div>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Eye className="h-3 w-3 text-muted-foreground cursor-help" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <div className="space-y-1">
                                                                            <p><span className="font-medium">ID:</span> {transaction.user.id}</p>
                                                                            <p><span className="font-medium">Name:</span> {transaction.user.name}</p>
                                                                            <p><span className="font-medium">Email:</span> {transaction.user.email}</p>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TableCell> */}
                                                        <TableCell>
                                                            {transaction.team ? transaction.team.name : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {transaction.package ? transaction.package.name : '-'}
                                                        </TableCell>
                                                        <TableCell className="font-semibold">
                                                            {transaction.amount}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{transaction.payment_gateway}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={getStatusBadgeColor(transaction.status_badge.color)}>
                                                                {transaction.status_badge.text}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {transaction.created_at}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Link href={`/admin/transactions/${transaction.id}`}>
                                                                <Button variant="ghost" size="sm" className="cursor-pointer">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Pagination */}
                            {transactions.last_page > 1 && (
                                <div className="flex items-center justify-end gap-2">
                                    {transactions.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.visit(link.url)}
                                            className="cursor-pointer"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
