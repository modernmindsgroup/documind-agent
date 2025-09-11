import { ThemeProvider } from "@/lib/theme";
import { CallLogs } from "../CallLogs";
import { mockCallLogs } from "@/lib/mock-data";

export default function CallLogsExample() {
  return (
    <ThemeProvider>
      <div className="p-8 bg-background min-h-screen">
        <CallLogs logs={mockCallLogs} />
      </div>
    </ThemeProvider>
  );
}