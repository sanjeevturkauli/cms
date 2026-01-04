"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Users } from "lucide-react"
import { router, usePage } from "@inertiajs/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { index as teamsIndex } from "@/routes/teams"
import { type SharedData } from "@/types"

interface Team {
  id: number
  name: string
  team_id: string
  members_count?: number
}

export function TeamSwitcher({
  teams,
  isTeamOwner,
}: {
  teams: Team[]
  isTeamOwner: boolean
}) {
  const { isMobile } = useSidebar()
  const { props } = usePage<SharedData>()
  const currentTeamId = props.currentTeamId
  
  // Find active team based on currentTeamId or default to first team
  const activeTeam = React.useMemo(() => {
    if (currentTeamId) {
      return teams.find(t => t.id === currentTeamId) || teams[0]
    }
    return teams[0]
  }, [currentTeamId, teams])

  const handleSwitchTeam = (team: Team) => {
    if (team.id === activeTeam?.id) return
    
    router.post(`/teams/switch/${team.id}`, {}, {
      preserveScroll: true,
      preserveState: true,
    })
  }

  const handleAddTeam = () => {
    router.visit(teamsIndex.url())
  }

  if (!activeTeam && teams.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={handleAddTeam}>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Users className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No Teams</span>
              <span className="truncate text-xs">Click to add</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Users className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam?.name}</span>
                <span className="truncate text-xs">
                  {isTeamOwner ? `${activeTeam?.members_count || 0} members` : 'Member'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitchTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Users className="size-3.5 shrink-0" />
                </div>
                {team.name}
                {team.id === activeTeam?.id && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
                )}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={handleAddTeam}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                {isTeamOwner ? 'Add team' : 'Join team'}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
