import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Headphones, 
  Target, 
  Calendar, 
  ClipboardList, 
  Home, 
  Stethoscope,
  Plus,
  Sparkles
} from "lucide-react";
import { AgentTemplate } from "@/lib/types";

interface AgentTemplatesProps {
  templates: AgentTemplate[];
  onSelectTemplate: (template: AgentTemplate) => void;
}

const iconMap = {
  headphones: Headphones,
  target: Target,
  calendar: Calendar,
  "clipboard-list": ClipboardList,
  home: Home,
  stethoscope: Stethoscope,
};

export function AgentTemplates({ templates, onSelectTemplate }: AgentTemplatesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agent Templates</h2>
          <p className="text-muted-foreground">Choose from pre-built templates or start from scratch</p>
        </div>
        <Button
          onClick={() => onSelectTemplate({
            id: 'blank',
            name: 'Blank Agent',
            description: 'Start with a blank canvas',
            type: 'single_prompt',
            category: 'Custom',
            icon: 'plus',
            config: {},
          })}
          data-testid="button-blank-agent"
          className="hover-elevate"
        >
          <Plus className="h-4 w-4 mr-2" />
          Blank Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const Icon = iconMap[template.icon as keyof typeof iconMap] || Sparkles;
          
          return (
            <Card 
              key={template.id} 
              className="hover-elevate cursor-pointer transition-all"
              onClick={() => onSelectTemplate(template)}
              data-testid={`card-template-${template.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-6 w-6 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.type.replace('_', ' ')}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 hover-elevate"
                    data-testid={`button-use-template-${template.id}`}
                  >
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}