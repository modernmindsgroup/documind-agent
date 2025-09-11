import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme";
import { AppSidebar } from "../AppSidebar";
import { Dashboard, ViewMode } from "../../pages/Dashboard";

export default function DashboardExample() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full bg-background">
          <AppSidebar />
          <Dashboard currentView={currentView} onViewChange={setCurrentView} />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}