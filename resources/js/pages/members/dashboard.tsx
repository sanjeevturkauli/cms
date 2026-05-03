import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { MemberSectionCards } from "@/components/member-section-cards"
import { SiteHeader } from "@/components/site-header"
import { KycStatusBanner } from "@/components/kyc-status-banner"
import { MemberPaymentBanner } from "@/components/member-payment-banner"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@inertiajs/react"

interface Team {
  id: number
  name: string
  team_id: string
}

interface Transaction {
  id: number
  team_name: string
  amount: string
  status: string
  date: string
  payment_method: string
}

interface Stats {
  total_members: string;
  member_growth: number;
  total_payments: string;
  payment_growth: number;
  active_subscriptions: string;
  sub_growth: number;
  pending_kyc: string;
  kyc_growth: number;
}

interface ChartDataPoint {
  month: string;
  date: string;
  revenue: number;
}

interface PageProps {
  stats: Stats;
  chartData: ChartDataPoint[];
  recentTransactions: Transaction[];
  currentTeam: Team | null;
}

export default function Page({ stats, chartData, recentTransactions, currentTeam }: PageProps) {
  // Transform stats for SectionCards component - Member perspective
  const cardStats = {
    total_revenue: stats.total_payments, // My total payments
    revenue_growth: stats.payment_growth,
    total_users: stats.total_members, // Total members in my teams
    user_growth: stats.member_growth,
    active_teams: stats.active_subscriptions, // Active subscriptions
    team_growth: stats.sub_growth,
    active_subscriptions: stats.pending_kyc, // Pending KYC count
    sub_growth: stats.kyc_growth,
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6 space-y-3">
                <KycStatusBanner />
                <MemberPaymentBanner />
              </div>
              
              {/* Current Team Display */}
              {currentTeam && (
                <div className="px-4 lg:px-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{currentTeam.name} Dashboard</h2>
                    <span className="text-muted-foreground text-sm">
                      (Team Code: {currentTeam.team_id})
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">
                    Switch teams from the sidebar to view different team data
                  </p>
                </div>
              )}
              
              <MemberSectionCards stats={cardStats} />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive chartData={chartData} />
              </div>
              
              {/* Recent Transactions Table */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Your latest payment transactions</CardDescription>
                    </div>
                    <Link href="/member/payments">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Team</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment Method</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentTransactions && recentTransactions.length > 0 ? (
                            recentTransactions.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell className="font-medium">
                                  {transaction.team_name}
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {transaction.amount}
                                </TableCell>
                                <TableCell className="text-sm capitalize">
                                  {transaction.payment_method}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {transaction.date}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      transaction.status === 'Paid' || transaction.status === 'Completed' ? 'default' : 
                                      transaction.status === 'Pending' ? 'secondary' : 
                                      transaction.status === 'Overdue' ? 'destructive' :
                                      'outline'
                                    }
                                  >
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No transactions yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
