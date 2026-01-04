'use client';

import { usePage } from '@inertiajs/react';
import { Home, Shield, Users } from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as permissionIndex } from '@/routes/admin/permissions';
import { index as roleIndex } from '@/routes/admin/roles';
import { index as userIndex } from '@/routes/admin/users';

import { index, members } from '@/routes/teams';
import { User, type SharedData } from '@/types';
import { Team } from '@/types/team';

const data = {
    navMain: [
        {
            title: 'Dashboard',
            url: dashboard()?.url,
            icon: Home,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { props: pageProps } = usePage<SharedData>();

    const routeName = pageProps.routeName || ('' as string);
    const teams = (pageProps.teams || []) as Team[];
    const user = pageProps.auth?.user as User | null;
    const isAdmin = (pageProps.isAdmin || false) as boolean;
    const isMember = (pageProps.isMember || false) as boolean;
    const isTeamOwner = (pageProps.isTeamOwner || false) as boolean;
    if (!user) return null;
    console.log('pageProps', pageProps);
    console.log('routeName', routeName);
    console.log('isTeamOwner', isTeamOwner);

    const dynamicNavMain = [
        ...data.navMain,

        ...(isTeamOwner
            ? [
                  {
                      title: 'Team Management',
                      url: '#',
                      icon: Users,
                      isActive:
                          routeName === 'teams.members' ||
                          routeName === 'teams.index',
                      items: [
                          {
                              title: 'Teams',
                              url: index()?.url,
                              isActive: routeName === 'teams.index',
                          },
                          {
                              title: 'Members',
                              url: members()?.url,
                              isActive: routeName === 'teams.members',
                          },
                      ],
                  },
              ]
            : []),

        ...(isMember
            ? [
                  {
                      title: 'Teams',
                      url: '#',
                      icon: Users,
                      isActive: routeName === 'teams.index',
                      items: [
                          {
                              title: 'My Teams',
                              url: '/teams',
                              isActive: routeName === 'teams.index',
                          },
                      ],
                  },
              ]
            : []),

        ...(isAdmin
            ? [
                  {
                      title: 'Users & Teams',
                      url: '#',
                      icon: Users,
                      isActive: routeName === 'admin.users.index',
                      items: [
                          {
                              title: 'Users',
                              url: userIndex()?.url,
                              isActive: routeName === 'admin.users.index',
                          },
                          {
                              title: 'Teams',
                              url: '/teams',
                              isActive: routeName === 'admin.teams.index',
                          },
                      ],
                  },
                  {
                      title: 'Roles & Permissions',
                      url: '#',
                      icon: Shield,
                      isActive:
                          routeName === 'admin.roles.index' ||
                          routeName === 'admin.permissions.index',
                      items: [
                          {
                              title: 'Roles',
                              url: roleIndex()?.url,
                              isActive: routeName === 'admin.roles.index',
                          },
                          {
                              title: 'Permissions',
                              url: permissionIndex()?.url,
                              isActive: routeName === 'admin.permissions.index',
                          },
                      ],
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={teams} isTeamOwner={isTeamOwner} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={dynamicNavMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
