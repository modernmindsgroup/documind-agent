import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme";
import { AppSidebar } from "../AppSidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <ThemeProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 p-8">
            <h2 className="text-xl font-semibold">Sidebar Navigation</h2>
            <p className="text-muted-foreground mt-2">
              Click on the sidebar items to see navigation in action.
            </p>
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}