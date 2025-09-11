import { ThemeProvider } from "@/lib/theme";
import { WorkflowBuilder } from "../WorkflowBuilder";
import { mockWorkflowTemplates } from "@/lib/mock-data";

export default function WorkflowBuilderExample() {
  const handleSelectTemplate = (template: any) => {
    console.log('Selected workflow template:', template.name);
  };

  return (
    <ThemeProvider>
      <div className="p-8 bg-background min-h-screen">
        <WorkflowBuilder 
          templates={mockWorkflowTemplates} 
          onSelectTemplate={handleSelectTemplate}
        />
      </div>
    </ThemeProvider>
  );
}