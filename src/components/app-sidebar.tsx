import * as React from 'react'
import { ChevronRight, Database, LogOut, Wrench } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAppNavigation } from '@/hooks/use-app-navigation'
import { SAMANVI_LOGO_URL } from '@/lib/branding'
import { useAuthStore } from '@/store/auth-store'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { mainItems, mastersItems, garageItems } = useAppNavigation()
  const location = useLocation()
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

  const isMastersRouteActive = location.pathname.startsWith('/masters')
  const isGarageRouteActive = location.pathname.startsWith('/garage')

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
              {mastersItems.length > 0 ? (
                <Collapsible asChild defaultOpen={isMastersRouteActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Masters" isActive={isMastersRouteActive}>
                        <Database />
                        <span>Masters</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {mastersItems.map((item) => (
                          <SidebarMenuSubItem key={item.id}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === item.to}>
                              <NavLink to={item.to} onClick={handleMobileItemClick}>
                                <span>{item.label}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : null}
              {garageItems.length > 0 ? (
                <Collapsible asChild defaultOpen={isGarageRouteActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Garage" isActive={isGarageRouteActive}>
                        <Wrench />
                        <span>Garage</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {garageItems.map((item) => (
                          <SidebarMenuSubItem key={item.id}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === item.to}>
                              <NavLink to={item.to} onClick={handleMobileItemClick}>
                                <span>{item.label}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : null}
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    {item.external ? (
                      <a
                        href={item.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleMobileItemClick}
                      >
                        {item.icon ? <item.icon /> : null}
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <NavLink to={item.to} end={item.end} onClick={handleMobileItemClick}>
                        {item.icon ? <item.icon /> : null}
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
          <span className="group-data-[collapsible=icon]:hidden">Version 3.0.0</span>
          <span className="hidden group-data-[collapsible=icon]:inline">v3.0.0</span>
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
