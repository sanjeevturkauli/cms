'use client';

import { usePage } from '@inertiajs/react';
import { Home, Shield, Users, Package, Settings, Receipt } from 'lucide-react';
import * as React from 'react';

import { NavUser } from '@/components/nav-user';
import { NavMain } from '@/components/nav-main';
import { TeamSwitcher } from '@/components/team-switcher';
import { AdminSiteInfo } from '@/components/admin-site-info';
import { index as roleIndex } from '@/routes/admin/roles';
import { index as userIndex } from '@/routes/admin/users';
import { index as teamsAdminIndex } from '@/routes/admin/teams';
import { index as packagesIndex } from '@/routes/admin/packages';
import { index as settingsIndex } from '@/routes/admin/settings';
import { index as permissionIndex } from '@/routes/admin/permissions';
import { index as transactionsIndex } from '@/routes/admin/transactions';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@/components/ui/sidebar';

import { Team } from '@/types/team';
import { dashboard } from '@/routes/index';
import { User, type SharedData } from '@/types';
import { index as teamsIndex } from '@/routes/team';
import { members as teamsMembersIndex } from '@/routes/team';



const data = {
    navMain: [
        {
            title: 'Dashboards',
            url: dashboard()?.url,
            icon: Home,
        }
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
    const siteSettings = pageProps.siteSettings || { site_name: 'CMS Application', site_description: 'Content Management System' };
    
    if (!user) return null;

    // console.log('pageProps', pageProps);
    console.log('routeName', routeName);
    // console.log('isTeamOwner', isTeamOwner);

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
                        routeName === 'team.members' ||
                        routeName === 'teams.index' ||
                        routeName === 'team.subscriptions.index' ||
                        routeName === 'team.index',
                    items: [
                        {
                            title: 'Teams',
                            url: teamsIndex()?.url,
                            isActive: routeName === 'teams.index' || routeName === 'team.index',
                        },
                        {
                            title: 'Members',
                            url: teamsMembersIndex()?.url,
                            isActive: routeName === 'teams.members' || routeName === 'team.members',
                        },
                    ],
                },
            ]
            : []),

        ...(isMember
            ? [
                {
                    title: 'Teams',
                    url: '/teams',
                    icon: Users,
                    isActive: routeName === 'teams.index',
                },
            ]
            : []),

        ...(isAdmin
            ? [
                {
                    title: 'Users & Teams',
                    url: '#',
                    icon: Users,
                    isActive: routeName === 'admin.users.index' || routeName === 'admin.teams.index',
                    items: [
                        {
                            title: 'Users',
                            url: userIndex()?.url,
                            isActive: routeName === 'admin.users.index',
                        },
                        {
                            title: 'Teams',
                            url: teamsAdminIndex()?.url,
                            isActive: routeName === 'admin.teams.index',
                        },
                    ],
                },
                {
                    title: 'Package Management',
                    url: '#',
                    icon: Package,
                    isActive: routeName === 'admin.packages.index',
                    items: [
                        {
                            title: 'Packages',
                            url: packagesIndex()?.url,
                            isActive: routeName === 'admin.packages.index',
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
                {
                    title: 'Transactions',
                    url: transactionsIndex()?.url,
                    icon: Receipt,
                    isActive: routeName === 'admin.transactions.index' || routeName === 'admin.transactions.show',
                },
                {
                    title: 'Settings',
                    url: settingsIndex()?.url,
                    icon: Settings,
                    isActive: routeName === 'admin.settings.index',
                },
            ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                {isAdmin ? (
                    <AdminSiteInfo 
                        siteName={siteSettings.site_name} 
                        siteDescription={siteSettings.site_description} 
                    />
                ) : (
                    <TeamSwitcher teams={teams} isTeamOwner={isTeamOwner} />
                )}
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
