import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { KycStatusBanner } from "@/components/kyc-status-banner"
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

interface Member {
  id: number
  name: string
  email: string
  joined_at: string
  status: string
}

interface Transaction {
  id: number
  member_name: string
  amount: string
  status: string
  date: string
  payment_method: string
}

interface Stats {
  total_members: string
  member_growth: number
  total_payments: string
  payment_growth: number
  active_subscriptions: string
  sub_growth: number
  pending_kyc: string
  kyc_growth: number
}

interface ChartDataPoint {
  month: string
  date: string
  revenue: number
}

interface Team {
  id: number
  name: string
  team_id: string
}

interface PageProps {
  stats: Stats
  recentMembers: Member[]
  recentTransactions: Transaction[]
  chartData: ChartDataPoint[]
  team: Team | null
}

export default function Page({ stats, recentMembers, recentTransactions, chartData, team }: PageProps) {
  // Transform stats for SectionCards component
  const cardStats = {
    total_revenue: stats.total_payments,
    revenue_growth: stats.payment_growth,
    total_users: stats.total_members,
    user_growth: stats.member_growth,
    active_teams: stats.active_subscriptions,
    team_growth: stats.sub_growth,
    active_subscriptions: stats.pending_kyc,
    sub_growth: stats.kyc_growth,
  }

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
              <div className="px-4 lg:px-6">
                <KycStatusBanner />
              </div>
              
              {team ? (
                <>
                  <div className="px-4 lg:px-6">
                    <h2 className="text-2xl font-bold">{team.name} Dashboard</h2>
                    <p className="text-muted-foreground text-sm">Team Code: {team.team_id}</p>
                  </div>
                  
                  <SectionCards stats={cardStats} />
                  
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive chartData={chartData} />
                  </div>
                  
                  {/* Recent Members and Transactions in 2 columns */}
                  <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
                    {/* Recent Members */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Members</CardTitle>
                        <CardDescription>Latest members who joined the team</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentMembers.length > 0 ? (
                                recentMembers.map((member) => (
                                  <TableRow key={member.id}>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{member.name}</span>
                                        <span className="text-muted-foreground text-xs">{member.email}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{member.joined_at}</TableCell>
                                    <TableCell>
                                      <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                                        {member.status}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    No members yet
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>Latest payment transactions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {recentTransactions.length > 0 ? (
                                recentTransactions.map((transaction) => (
                                  <TableRow key={transaction.id}>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{transaction.member_name}</span>
                                        <span className="text-muted-foreground text-xs">{transaction.date}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{transaction.amount}</TableCell>
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
                                  <TableCell colSpan={3} className="text-center text-muted-foreground">
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
                </>
              ) : (
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>No Team Selected</CardTitle>
                      <CardDescription>
                        Please create or join a team to view the dashboard
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
