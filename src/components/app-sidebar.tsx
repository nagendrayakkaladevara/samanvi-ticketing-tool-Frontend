import * as React from 'react'
import { Bus, Clipboard, LayoutDashboard, LogOut, Settings, Ticket, Users } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useCurrentUser, type CurrentUser } from '@/hooks/use-current-user'
import { useAuthStore } from '@/store/auth-store'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType
  end?: boolean
  roles?: CurrentUser['role'][]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/board', label: 'Board', icon: Clipboard, roles: ['ADMIN'] },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/buses', label: 'Buses', icon: Bus, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useCurrentUser()
  const logout = useAuthStore((state) => state.logout)
  const filteredNavItems = navItems.filter((item) => {
    if (!('roles' in item) || !item.roles) {
      return true
    }

    return currentUser ? item.roles.includes(currentUser.role) : false
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  ST
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Samanvi</span>
                  <span className="truncate text-xs">Ticketing Tool</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} end={item.end}>
                      <item.icon />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2 text-xs text-muted-foreground group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-center">
          <span className="group-data-[collapsible=icon]:hidden">Version 1.0</span>
          <span className="hidden group-data-[collapsible=icon]:inline">v1.0</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton variant="outline" tooltip="Logout" onClick={logout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
