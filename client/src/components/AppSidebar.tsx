import {
  Bot,
  BarChart3,
  Database,
  Settings,
  Workflow,
  Webhook,
  KeyRound,
  Phone,
  MessageSquare,
  Activity,
  LayoutDashboard,
  ChevronDown,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarItem {
  title: string;
  url: string;
  icon: any;
  isActive?: boolean;
  items?: SidebarItem[];
}

const menuItems: SidebarItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Build",
    url: "#",
    icon: Zap,
    items: [
      {
        title: "Agents",
        url: "/agents",
        icon: Bot,
      },
      {
        title: "Workflows",
        url: "/workflows",
        icon: Workflow,
      },
      {
        title: "Knowledge Base",
        url: "/knowledge",
        icon: Database,
      },
    ],
  },
  {
    title: "Integrations",
    url: "#",
    icon: Settings,
    items: [
      {
        title: "Webhooks",
        url: "/webhooks",
        icon: Webhook,
      },
      {
        title: "API Keys",
        url: "/api-keys",
        icon: KeyRound,
      },
    ],
  },
  {
    title: "Monitor",
    url: "#",
    icon: BarChart3,
    items: [
      {
        title: "Call Logs",
        url: "/call-logs",
        icon: Phone,
      },
      {
        title: "Chat Logs",
        url: "/chat-logs",
        icon: MessageSquare,
      },
      {
        title: "Webhook Logs",
        url: "/webhook-logs",
        icon: Activity,
      },
    ],
  },
];

export function AppSidebar() {
  const [activeUrl, setActiveUrl] = useState("/");

  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-sidebar-foreground">VoiceFlow</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible defaultOpen={true} className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          data-testid={`button-sidebar-${item.title.toLowerCase()}`}
                          className="hover-elevate"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                isActive={activeUrl === subItem.url}
                                data-testid={`button-sidebar-${subItem.title.toLowerCase().replace(' ', '-')}`}
                              >
                                <a 
                                  href={subItem.url}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setActiveUrl(subItem.url);
                                    console.log(`Navigate to ${subItem.title}`);
                                  }}
                                  className="hover-elevate"
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton 
                      asChild
                      isActive={activeUrl === item.url}
                      data-testid={`button-sidebar-${item.title.toLowerCase()}`}
                    >
                      <a 
                        href={item.url}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveUrl(item.url);
                          console.log(`Navigate to ${item.title}`);
                        }}
                        className="hover-elevate"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarRail />
    </Sidebar>
  );
}