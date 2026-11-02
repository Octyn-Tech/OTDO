import React from 'react';
import {
  LayoutDashboard,
  Server,
  LogOut,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP';

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/80 bg-black text-foreground selection:bg-primary selection:text-primary-foreground"
      {...props}
    >
      {/* Brand Header & Toggle Trigger */}
      <SidebarHeader className="border-b border-border/60 h-16 flex items-center justify-center px-3 group-data-[collapsible=icon]:px-0">
        <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
          <Tooltip>
            <TooltipTrigger render={
              <button
                type="button"
                onClick={toggleSidebar}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center font-bold shrink-0 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Server className="h-4.5 w-4.5" />
              </button>
            } />
            <TooltipContent side="right">
              <span>{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            </TooltipContent>
          </Tooltip>
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-foreground truncate">OTDO System</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase font-mono border-border text-muted-foreground">
                All in One
              </Badge>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Main Navigation - Only Overview kept for now */}
      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-1.5 space-y-2">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-mono tracking-wider text-muted-foreground/60 uppercase px-2 mb-1.5 group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem className="flex justify-center">
                <SidebarMenuButton
                  isActive
                  tooltip="Overview"
                  className="font-medium text-xs rounded-lg transition-colors group-data-[collapsible=icon]:justify-center"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Operator Profile Footer */}
      <SidebarFooter className="border-t border-border/60 p-2 group-data-[collapsible=icon]:p-2">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger render={
              <button
                onClick={logout}
                className="size-9 rounded-lg border border-border/70 flex items-center justify-center hover:bg-muted transition-colors mx-auto"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-[10px] font-mono bg-muted text-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            } />
            <TooltipContent side="right" align="center">
              <span>{user?.name} ({user?.role}) • Click to Logout</span>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-border/40 bg-muted/20">
            <Avatar className="h-7 w-7 border border-border shrink-0">
              <AvatarFallback className="text-[10px] font-mono bg-muted text-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-foreground truncate">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.role}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
