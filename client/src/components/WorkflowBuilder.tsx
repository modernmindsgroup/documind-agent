import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, 
  Play, 
  Square,
  GitBranch,
  Settings,
  Plus,
  Download,
  Upload,
  FileText
} from "lucide-react";
import { WorkflowTemplate } from "@/lib/types";

interface WorkflowBuilderProps {
  templates: WorkflowTemplate[];
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

const nodeTypeColors = {
  start: "bg-green-500",
  condition: "bg-blue-500", 
  tool: "bg-purple-500",
  conversation: "bg-orange-500",
  end: "bg-red-500",
};

export function WorkflowBuilder({ templates, onSelectTemplate }: WorkflowBuilderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workflow Builder</h2>
          <p className="text-muted-foreground">Design conversation flows with visual drag-and-drop editor</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="hover-elevate"
            data-testid="button-upload-json"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="hover-elevate"
            data-testid="button-docs"
          >
            <FileText className="h-4 w-4 mr-2" />
            Docs
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Blank Template */}
        <Card 
          className="hover-elevate cursor-pointer border-dashed border-2"
          onClick={() => onSelectTemplate({
            id: 'blank-workflow',
            name: 'Blank Workflow',
            description: 'Start with an empty canvas',
            type: 'blank',
            category: 'Custom',
            nodes: [
              { id: 'start', type: 'start', position: { x: 100, y: 100 } },
              { id: 'end', type: 'end', position: { x: 300, y: 100 } },
            ],
            edges: [{ id: 'e1', source: 'start', target: 'end' }],
          })}
          data-testid="card-blank-workflow"
        >
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Create Blank</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Start with a clean slate and build your workflow from scratch
            </p>
          </CardContent>
        </Card>

        {/* Template Cards */}
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="hover-elevate cursor-pointer"
            onClick={() => onSelectTemplate(template)}
            data-testid={`card-workflow-template-${template.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Workflow className="h-6 w-6 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{template.nodes.length} nodes</span>
                  <span>•</span>
                  <span>{template.edges.length} connections</span>
                </div>
                
                {/* Visual representation of nodes */}
                <div className="flex items-center gap-1">
                  {template.nodes.slice(0, 4).map((node, index) => {
                    const bgColor = nodeTypeColors[node.type as keyof typeof nodeTypeColors] || "bg-gray-500";
                    return (
                      <div
                        key={node.id}
                        className={`w-3 h-3 rounded-full ${bgColor}`}
                      />
                    );
                  })}
                  {template.nodes.length > 4 && (
                    <span className="text-xs text-muted-foreground">+{template.nodes.length - 4}</span>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="w-full hover-elevate"
                  data-testid={`button-use-workflow-${template.id}`}
                >
                  Use Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Node Types Legend */}
      <Card data-testid="card-node-legend">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Node Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(nodeTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${color}`} />
                <span className="text-sm capitalize">{type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}