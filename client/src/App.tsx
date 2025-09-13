import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppSidebar } from "./components/AppSidebar";
import { Dashboard, ViewMode } from "./pages/Dashboard";
import CallsPage from "./pages/CallsPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/not-found";

function Router() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView={currentView} onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/agents">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="agents" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/workflows">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="workflows" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/knowledge">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="knowledge" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/webhooks">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="webhooks" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/api-keys">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="api-keys" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/calls">
        <ProtectedRoute>
          <MainApp>
            <CallsPage />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/call-logs">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="call-logs" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/chat-logs">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="chat-logs" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      <Route path="/webhook-logs">
        <ProtectedRoute>
          <MainApp>
            <Dashboard currentView="webhook-logs" onViewChange={setCurrentView} />
          </MainApp>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function MainApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-2 border-b bg-card/30 backdrop-blur">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate" />
        </div>
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
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
          <AuthProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <Router />
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}