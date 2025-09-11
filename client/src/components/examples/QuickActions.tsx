import { ThemeProvider } from "@/lib/theme";
import { QuickActions } from "../QuickActions";

export default function QuickActionsExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Quick Actions</h2>
        <div className="max-w-md">
          <QuickActions />
        </div>
      </div>
    </ThemeProvider>
  );
}