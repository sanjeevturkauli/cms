import { Head, Link } from "@inertiajs/react"
import { SiteHeader } from "@/components/site-header"
import { AppSidebar } from "@/components/app-sidebar"
import { SectionCards } from "@/components/section-cards"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Stats {
    total_revenue: string;
    revenue_growth: number;
    total_users: string;
    user_growth: number;
    active_teams: string;
    team_growth: number;
    active_subscriptions: string;
    sub_growth: number;
}

interface LatestMember {
    id: number;
    name: string;
    email: string;
    team: string;
    joined_at: string;
    is_active: boolean;
}

interface LatestTeam {
    id: number;
    name: string;
    team_id: string;
    owner: string;
    members_count: number;
    status: string;
    created_at: string;
}

interface LatestTransaction {
    id: number;
    transaction_id: string;
    user: string;
    team: string;
    package: string;
    amount: string;
    status: string;
    status_badge: { text: string; color: string };
    payment_gateway: string;
    created_at: string;
}

interface Props {
    stats: Stats;
    chartData: any[];
    latestMembers: LatestMember[];
    latestTeams: LatestTeam[];
    latestTransactions: LatestTransaction[];
}

const statusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    pending:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    completed:'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    failed:   'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    processing:'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
};

export default function Page({ stats, chartData, latestMembers, latestTeams, latestTransactions }: Props) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}>
      <Head title="Admin Dashboard" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              {/* Stats Cards */}
              <SectionCards stats={stats} />

              {/* Chart */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive chartData={chartData} />
              </div>

              {/* Latest Members & Teams - 2 columns */}
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2">

                {/* Latest Members */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Latest Members</CardTitle>
                        <CardDescription>Most recently joined members</CardDescription>
                      </div>
                      <Link href="/admin/users">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestMembers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No members yet</TableCell>
                          </TableRow>
                        ) : latestMembers.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{m.name}</div>
                              <div className="text-xs text-muted-foreground">{m.email}</div>
                            </TableCell>
                            <TableCell className="text-sm">{m.team}</TableCell>
                            <TableCell>
                              <Badge variant={m.is_active ? 'default' : 'destructive'} className="text-xs">
                                {m.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{m.joined_at}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Latest Teams */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Latest Teams</CardTitle>
                        <CardDescription>Most recently created teams</CardDescription>
                      </div>
                      <Link href="/admin/teams">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestTeams.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No teams yet</TableCell>
                          </TableRow>
                        ) : latestTeams.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              <div className="font-medium text-sm">{t.name}</div>
                              <div className="text-xs text-muted-foreground font-mono">{t.team_id}</div>
                            </TableCell>
                            <TableCell className="text-sm">{t.owner}</TableCell>
                            <TableCell className="text-sm">{t.members_count}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${statusColors[t.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                {t.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Transactions - full width */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Latest Transactions</CardTitle>
                        <CardDescription>Most recent subscription payments</CardDescription>
                      </div>
                      <Link href="/admin/transactions">
                        <Button variant="outline" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Gateway</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-6">No transactions yet</TableCell>
                          </TableRow>
                        ) : latestTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-xs">{tx.transaction_id}</TableCell>
                            <TableCell className="text-sm">{tx.user}</TableCell>
                            <TableCell className="text-sm">{tx.team}</TableCell>
                            <TableCell className="text-sm">{tx.package}</TableCell>
                            <TableCell className="font-semibold text-sm">{tx.amount}</TableCell>
                            <TableCell className="text-sm capitalize">{tx.payment_gateway}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${tx.status_badge?.color ?? statusColors[tx.status] ?? 'bg-gray-100 text-gray-800'}`}>
                                {tx.status_badge?.text ?? tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{tx.created_at}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
