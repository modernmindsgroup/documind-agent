import { ThemeProvider } from "@/lib/theme";
import { AgentTemplates } from "../AgentTemplates";
import { mockAgentTemplates } from "@/lib/mock-data";

export default function AgentTemplatesExample() {
  const handleSelectTemplate = (template: any) => {
    console.log('Selected template:', template.name);
  };

  return (
    <ThemeProvider>
      <div className="p-8 bg-background min-h-screen">
        <AgentTemplates 
          templates={mockAgentTemplates} 
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    </ThemeProvider>
  );
}