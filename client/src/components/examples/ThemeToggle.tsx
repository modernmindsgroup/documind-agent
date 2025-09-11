import { ThemeProvider } from "@/lib/theme";
import { ThemeToggle } from "../ThemeToggle";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-4 bg-background">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}