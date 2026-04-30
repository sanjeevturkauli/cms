import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"
import { usePage } from "@inertiajs/react"
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
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-200 max-w-[140px] sm:max-w-none">
              <Wallet className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-green-700 truncate">{wallet.balance}</span>
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
