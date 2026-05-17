import * as React from 'react'
import {
  Bus,
  Clipboard,
  LayoutDashboard,
  LogOut,
  Mic,
  Settings,
  Ticket,
  Users,
} from 'lucide-react'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { useCurrentUser, type CurrentUser } from '@/hooks/use-current-user'
import { SAMANVI_LOGO_URL } from '@/lib/branding'
import { useAuthStore } from '@/store/auth-store'

type NavItem = {
  to: string
  label: string
  icon: React.ComponentType
  end?: boolean
  external?: boolean
  roles?: CurrentUser['role'][]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/board', label: 'Board', icon: Clipboard, roles: ['ADMIN'] },
  { to: '/tickets', label: 'Tickets', icon: Ticket },
  { to: '/buses', label: 'Buses', icon: Bus, roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  {
    to: 'https://samanvidashboard.netlify.app/voice-app-access',
    label: 'Voice app access',
    icon: Mic,
    external: true,
    roles: ['ADMIN'],
  },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useCurrentUser()
  const { isMobile, setOpenMobile } = useSidebar()
  const logout = useAuthStore((state) => state.logout)
  const isMobileRef = React.useRef(isMobile)
  React.useEffect(() => {
    isMobileRef.current = isMobile
  }, [isMobile])

  const handleMobileItemClick = React.useCallback(() => {
    if (isMobileRef.current) {
      setOpenMobile(false)
    }
  }, [setOpenMobile])
  const filteredNavItems = navItems.filter((item) => {
    if (!('roles' in item) || !item.roles) {
      return true
    }

    return currentUser ? item.roles.includes(currentUser.role) : false
  })

  return (
    <Sidebar collapsible="icon" className="no-print" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/" onClick={handleMobileItemClick} className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  ST
                </div>
                <img
                  src={SAMANVI_LOGO_URL}
                  alt="Samanvi"
                  className="h-8 w-auto object-contain"
                />
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
                    {item.external ? (
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleMobileItemClick}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <NavLink to={item.to} end={item.end} onClick={handleMobileItemClick}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 pb-2 text-xs text-muted-foreground group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-center">
          <span className="group-data-[collapsible=icon]:hidden">Version 2.0.0</span>
          <span className="hidden group-data-[collapsible=icon]:inline">v2.0.0</span>
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
