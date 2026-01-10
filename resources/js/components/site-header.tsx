import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />

        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <h1 className="text-base font-medium capitalize">
          {activePage}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          {wallet && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">{wallet.balance}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" className="hidden sm:flex cursor-pointer">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
          </Button>
        </div>
      </div>
    </header>
  )
}
