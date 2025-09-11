import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "./lib/theme";
import { AppSidebar } from "./components/AppSidebar";
import { Dashboard, ViewMode } from "./pages/Dashboard";
import NotFound from "./pages/not-found";

function Router() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  return (
    <Switch>
      <Route path="/">
        <Dashboard currentView={currentView} onViewChange={setCurrentView} />
      </Route>
      <Route path="/agents">
        <Dashboard currentView="agents" onViewChange={setCurrentView} />
      </Route>
      <Route path="/workflows">
        <Dashboard currentView="workflows" onViewChange={setCurrentView} />
      </Route>
      <Route path="/knowledge">
        <Dashboard currentView="knowledge" onViewChange={setCurrentView} />
      </Route>
      <Route path="/webhooks">
        <Dashboard currentView="webhooks" onViewChange={setCurrentView} />
      </Route>
      <Route path="/api-keys">
        <Dashboard currentView="api-keys" onViewChange={setCurrentView} />
      </Route>
      <Route path="/call-logs">
        <Dashboard currentView="call-logs" onViewChange={setCurrentView} />
      </Route>
      <Route path="/chat-logs">
        <Dashboard currentView="chat-logs" onViewChange={setCurrentView} />
      </Route>
      <Route path="/webhook-logs">
        <Dashboard currentView="webhook-logs" onViewChange={setCurrentView} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  // Custom sidebar width for enterprise dashboard
  const style = {
    "--sidebar-width": "18rem",       // 288px for better navigation
    "--sidebar-width-icon": "3rem",   // default icon width
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="p-2 border-b bg-card/30 backdrop-blur">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate" />
                </div>
                <main className="flex-1 overflow-hidden">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}