import { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, AlertTriangle, FileText, Users, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface DirectorSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const sidebarItems = [
  { 
    id: "overview", 
    title: "Overview", 
    icon: BarChart3,
    description: "Executive Summary"
  },
  { 
    id: "performance", 
    title: "Performance", 
    icon: TrendingUp,
    description: "Department Analytics"
  },
  { 
    id: "profit-loss", 
    title: "Profit & Loss", 
    icon: DollarSign,
    description: "Financial Statement"
  },
  { 
    id: "expenses", 
    title: "Expenses", 
    icon: AlertTriangle,
    description: "Approval Required"
  },
  { 
    id: "reports", 
    title: "Reports", 
    icon: FileText,
    description: "Export Data"
  },
  { 
    id: "users", 
    title: "User Management", 
    icon: Users,
    description: "Team Administration"
  },
  { 
    id: "settings", 
    title: "Business Settings", 
    icon: Settings,
    description: "Company Info"
  },
];

export function DirectorSidebar({ activeTab, onTabChange }: DirectorSidebarProps) {
  const { open } = useSidebar();

  return (
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <div className="p-4 border-b">
        <SidebarTrigger className="mb-2" />
        {open && (
          <div>
            <h2 className="text-lg font-semibold text-foreground">Director Dashboard</h2>
            <p className="text-sm text-muted-foreground">Executive Controls</p>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={activeTab === item.id ? "bg-accent text-accent-foreground" : ""}
                  >
                    <button
                      onClick={() => onTabChange(item.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {open && (
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.description}</div>
                        </div>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}