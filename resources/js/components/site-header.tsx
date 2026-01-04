import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePage } from "@inertiajs/react"

export function SiteHeader() {
  const { component, props } = usePage<{
    auth?: {
      user?: {
        roles?: string[]
      }
    }
  }>()

  const activePage = component

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
          <Button variant="ghost" size="sm" className="hidden sm:flex cursor-pointer">
            {role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}
          </Button>
        </div>
      </div>
    </header>
  )
}
