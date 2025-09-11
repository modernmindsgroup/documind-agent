import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Workflow, Database, Zap } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Create Agent",
      description: "Build a new AI agent from templates",
      icon: Bot,
      action: () => console.log("Create Agent clicked"),
      testId: "button-create-agent",
    },
    {
      title: "New Workflow",
      description: "Design a conversation flow",
      icon: Workflow,
      action: () => console.log("New Workflow clicked"),
      testId: "button-create-workflow",
    },
    {
      title: "Add Knowledge",
      description: "Upload documents or FAQs",
      icon: Database,
      action: () => console.log("Add Knowledge clicked"),
      testId: "button-add-knowledge",
    },
    {
      title: "Quick Test",
      description: "Test your agents instantly",
      icon: Zap,
      action: () => console.log("Quick Test clicked"),
      testId: "button-quick-test",
    },
  ];

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start text-left hover-elevate"
                onClick={action.action}
                data-testid={action.testId}
              >
                <div className="flex items-center gap-3 w-full mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}