import { ThemeProvider } from "@/lib/theme";
import { DashboardMetrics } from "../DashboardMetrics";
import { mockDashboardMetrics } from "@/lib/mock-data";

export default function DashboardMetricsExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Dashboard Metrics</h2>
        <DashboardMetrics metrics={mockDashboardMetrics} />
      </div>
    </ThemeProvider>
  );
}