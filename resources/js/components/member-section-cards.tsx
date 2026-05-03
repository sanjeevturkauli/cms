import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

interface Props {
  stats?: Stats;
}

export function MemberSectionCards({ stats }: Props) {
  const cards = [
    {
      title: 'My Teams',
      value: stats?.total_users ?? '0',
      growth: stats?.user_growth ?? 0,
      footer: 'Teams you are part of',
      sub: 'Active memberships',
    },
    {
      title: 'Total Payments',
      value: stats?.total_revenue ?? '₹0',
      growth: stats?.revenue_growth ?? 0,
      footer: 'Payment growth this month',
      sub: 'All time payments',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.active_teams ?? '0',
      growth: stats?.team_growth ?? 0,
      footer: 'Active team subscriptions',
      sub: 'Subscription status',
    },
    {
      title: 'Pending Payments',
      value: stats?.active_subscriptions ?? '0',
      growth: stats?.sub_growth ?? 0,
      footer: 'Payments awaiting completion',
      sub: 'Action required',
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => {
        const isPositive = card.growth >= 0;
        return (
          <Card key={card.title} className="@container/card">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {isPositive ? <IconTrendingUp /> : <IconTrendingDown />}
                  {isPositive ? '+' : ''}{card.growth}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.footer}
                {isPositive
                  ? <IconTrendingUp className="size-4" />
                  : <IconTrendingDown className="size-4" />
                }
              </div>
              <div className="text-muted-foreground">{card.sub}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  )
}
