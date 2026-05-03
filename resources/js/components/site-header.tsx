import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"
import { usePage, Link } from "@inertiajs/react"
import { Wallet } from "lucide-react"
import { SharedData } from "@/types"

export function SiteHeader() {
  const { component, props } = usePage<SharedData & {
    auth?: {
      user?: {
        roles?: string[]
      }
    }
  }>()

  const activePage = component
  const wallet = props.wallet
  const kycStatus = props.kycStatus

  console.log('kycStatus',kycStatus)

  const role = props.auth?.user?.roles && props.auth.user.roles.length > 0 ? props.auth.user.roles[0].name : "";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b overflow-hidden">
      <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 shrink-0" />

        <Separator
          orientation="vertical"
          className="mx-2 shrink-0 data-[orientation=vertical]:h-4"
        />

        <h1 className="text-base font-medium capitalize truncate min-w-0 flex-1">
          {activePage}
        </h1>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {wallet && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 max-w-[140px] sm:max-w-none">
              <Wallet className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-400 truncate">{wallet.balance}</span>
            </div>
          )}
          {kycStatus && (
            <div className="hidden sm:block">
              {(() => {
                const s = kycStatus.status;
                const colorClass =
                  s === 'approved' ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-500/10' :
                  s === 'submitted' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10' :
                  s === 'rejected'  ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/10' :
                                     'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10';

                const badge = (
                  <Badge variant="outline" className={`text-xs font-medium cursor-pointer hover:opacity-80 ${colorClass}`}>
                    {kycStatus.text}
                  </Badge>
                );

                return kycStatus.clickable && kycStatus.url
                  ? <Link href={kycStatus.url}>{badge}</Link>
                  : badge;
              })()}
            </div>
          )}
          <NotificationBell />
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="hidden sm:flex cursor-pointer">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
          </Button>
        </div>
      </div>
    </header>
  )
}
