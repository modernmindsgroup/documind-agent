import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Workflow, 
  Play, 
  Square, 
  GitBranch, 
  Settings, 
  Plus, 
  Save, 
  ArrowLeft, 
  Download,
  Upload,
  Trash2,
  Copy,
  MousePointer2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WorkflowNode {
  id: string;
  type: 'start' | 'condition' | 'tool' | 'conversation' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface Workflow {
  id?: string;
  name: string;
  description: string;
  type: 'lead_qualification' | 'scheduler' | 'survey' | 'custom';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isActive: boolean;
}

const nodeTypeConfig = {
  start: { 
    color: "bg-green-500", 
    label: "Start", 
    icon: Play,
    description: "Entry point for the workflow"
  },
  condition: { 
    color: "bg-blue-500", 
    label: "Condition", 
    icon: GitBranch,
    description: "Decision point based on user input"
  },
  tool: { 
    color: "bg-purple-500", 
    label: "Tool", 
    icon: Settings,
    description: "External API call or action"
  },
  conversation: { 
    color: "bg-orange-500", 
    label: "Message", 
    icon: Workflow,
    description: "Send a message to the user"
  },
  end: { 
    color: "bg-red-500", 
    label: "End", 
    icon: Square,
    description: "End point of the workflow"
  },
};

interface WorkflowStudioProps {
  workflowId?: string;
  onBack: () => void;
}

export function WorkflowStudio({ workflowId, onBack }: WorkflowStudioProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [workflow, setWorkflow] = useState<Workflow>({
    name: "New Workflow",
    description: "",
    type: "custom",
    nodes: [
      {
        id: "start-1",
        type: "start",
        position: { x: 100, y: 200 },
        data: { label: "Start" }
      },
      {
        id: "end-1",
        type: "end",
        position: { x: 600, y: 200 },
        data: { label: "End" }
      }
    ],
    edges: [
      {
        id: "edge-1",
        source: "start-1",
        target: "end-1"
      }
    ],
    isActive: false,
  });

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  // Load workflow if editing existing one
  const { data: existingWorkflow, isLoading } = useQuery({
    queryKey: ['/api/workflows', workflowId],
    enabled: !!workflowId,
  });

  useEffect(() => {
    if (existingWorkflow) {
      setWorkflow(existingWorkflow);
    }
  }, [existingWorkflow]);

  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflowData: Workflow) => {
      const url = workflowId ? `/api/workflows/${workflowId}` : '/api/workflows';
      const method = workflowId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(workflowData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow saved!",
        description: "Your workflow has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save the workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveWorkflowMutation.mutate(workflow);
  };

  const handleAddNode = (type: keyof typeof nodeTypeConfig, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: nodeTypeConfig[type].label,
        description: nodeTypeConfig[type].description,
      },
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
  };

  const handleNodeDrag = (nodeId: string, newPosition: { x: number; y: number }) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, position: newPosition } : node
      ),
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (workflow.nodes.find(n => n.id === nodeId)?.type === 'start') {
      toast({
        title: "Cannot delete",
        description: "Start nodes cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
    }));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left - 75, // Center the node
      y: e.clientY - rect.top - 25,
    };

    handleAddNode(draggedNodeType as keyof typeof nodeTypeConfig, position);
    setDraggedNodeType(null);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Workflow className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            data-testid="button-back-to-workflows"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                className="text-xl font-bold"
                autoFocus
              />
            ) : (
              <h1 
                className="text-xl font-bold cursor-pointer hover:bg-muted rounded px-2 py-1"
                onClick={() => setIsEditingName(true)}
                data-testid="text-workflow-name"
              >
                {workflow.name}
              </h1>
            )}
            <Badge variant="outline">{workflow.type}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveWorkflowMutation.isPending}
            data-testid="button-save-workflow"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveWorkflowMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Node Palette */}
        <div className="w-64 border-r border-border bg-muted/20 p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Node Types
          </h3>
          
          <div className="space-y-2">
            {Object.entries(nodeTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-grab hover:bg-muted/50 transition-colors"
                  draggable
                  onDragStart={() => setDraggedNodeType(type)}
                  data-testid={`node-type-${type}`}
                >
                  <div className={cn("w-3 h-3 rounded-full", config.color)} />
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-sm mb-2">Instructions</h4>
            <p className="text-xs text-muted-foreground">
              Drag node types from above onto the canvas to build your workflow.
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full bg-background relative"
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            data-testid="workflow-canvas"
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.5" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Edges */}
            <svg className="absolute inset-0 pointer-events-none">
              {workflow.edges.map((edge) => {
                const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                const targetNode = workflow.nodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;

                const sourceX = sourceNode.position.x + 75;
                const sourceY = sourceNode.position.y + 25;
                const targetX = targetNode.position.x + 75;
                const targetY = targetNode.position.y + 25;

                return (
                  <line
                    key={edge.id}
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--border))"
                  />
                </marker>
              </defs>
            </svg>

            {/* Nodes */}
            {workflow.nodes.map((node) => {
              const config = nodeTypeConfig[node.type];
              const Icon = config.icon;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  className={cn(
                    "absolute w-32 h-12 rounded-lg border-2 bg-background cursor-pointer transition-all hover:shadow-md",
                    isSelected ? "border-primary shadow-lg" : "border-border",
                    config.color.replace('bg-', 'border-l-4 border-l-')
                  )}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                  }}
                  onClick={() => setSelectedNode(node)}
                  data-testid={`workflow-node-${node.id}`}
                >
                  <div className="flex items-center justify-center h-full px-2">
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium truncate">{node.data.label}</span>
                  </div>
                  
                  {isSelected && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Drop Zone Hint */}
            {draggedNodeType && (
              <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center">
                <div className="text-center">
                  <MousePointer2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-primary">Drop to add {nodeTypeConfig[draggedNodeType as keyof typeof nodeTypeConfig]?.label} node</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l border-border bg-muted/20 p-4 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Node Properties
            </h3>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{nodeTypeConfig[selectedNode.type].label} Node</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <Input
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: { ...selectedNode.data, label: e.target.value }
                      };
                      setSelectedNode(updatedNode);
                      setWorkflow(prev => ({
                        ...prev,
                        nodes: prev.nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      }));
                    }}
                    placeholder="Enter node label"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={selectedNode.data.description || ""}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: { ...selectedNode.data, description: e.target.value }
                      };
                      setSelectedNode(updatedNode);
                      setWorkflow(prev => ({
                        ...prev,
                        nodes: prev.nodes.map(n => n.id === selectedNode.id ? updatedNode : n)
                      }));
                    }}
                    placeholder="Enter node description"
                    rows={3}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  <strong>Position:</strong> x: {selectedNode.position.x}, y: {selectedNode.position.y}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}