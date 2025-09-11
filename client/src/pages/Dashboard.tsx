import { useState } from "react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import { AgentTemplates } from "@/components/AgentTemplates";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { CallLogs } from "@/components/CallLogs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { 
  mockDashboardMetrics, 
  mockRecentActivity, 
  mockAgentTemplates,
  mockWorkflowTemplates,
  mockCallLogs
} from "@/lib/mock-data";
// TODO: remove mock functionality - replace with actual user avatar
const avatarImage = "/api/placeholder/32/32";

export type ViewMode = 'dashboard' | 'agents' | 'workflows' | 'call-logs' | 'chat-logs' | 'webhook-logs' | 'knowledge' | 'webhooks' | 'api-keys';

interface DashboardProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function Dashboard({ currentView, onViewChange }: DashboardProps) {
  const renderContent = () => {
    switch (currentView) {
      case 'agents':
        return (
          <AgentTemplates 
            templates={mockAgentTemplates}
            onSelectTemplate={(template) => {
              console.log('Creating agent from template:', template.name);
            }}
          />
        );
      case 'workflows':
        return (
          <WorkflowBuilder 
            templates={mockWorkflowTemplates}
            onSelectTemplate={(template) => {
              console.log('Creating workflow from template:', template.name);
            }}
          />
        );
      case 'call-logs':
        return <CallLogs logs={mockCallLogs} />;
      case 'chat-logs':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Chat Logs</h2>
            <p className="text-muted-foreground">Chat monitoring interface would be implemented here</p>
          </div>
        );
      case 'webhook-logs':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Webhook Logs</h2>
            <p className="text-muted-foreground">Webhook monitoring interface would be implemented here</p>
          </div>
        );
      case 'knowledge':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Knowledge Base</h2>
            <p className="text-muted-foreground">Knowledge management interface would be implemented here</p>
          </div>
        );
      case 'webhooks':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
            <p className="text-muted-foreground">Webhook configuration interface would be implemented here</p>
          </div>
        );
      case 'api-keys':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">API Keys</h2>
            <p className="text-muted-foreground">API key management interface would be implemented here</p>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to AI Agent Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your voice and chat AI agents, workflows, and monitoring all in one place.
              </p>
            </div>
            
            <DashboardMetrics metrics={mockDashboardMetrics} />
            
            <div className="grid gap-8 lg:grid-cols-2">
              <QuickActions />
              <RecentActivity activities={mockRecentActivity} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between p-6 border-b bg-card/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Tenant: Acme Corp
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="hover-elevate"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full hover-elevate"
                data-testid="button-user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarImage} alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Sarah Chen</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    sarah@acmecorp.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
    </div>
  );
}