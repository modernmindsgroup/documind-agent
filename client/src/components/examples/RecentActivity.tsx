import { ThemeProvider } from "@/lib/theme";
import { RecentActivity } from "../RecentActivity";
import { mockRecentActivity } from "@/lib/mock-data";

export default function RecentActivityExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background min-h-screen">
        <h2 className="text-2xl font-bold mb-6 text-foreground">Recent Activity</h2>
        <div className="max-w-md">
          <RecentActivity activities={mockRecentActivity} />
        </div>
      </div>
    </ThemeProvider>
  );
}