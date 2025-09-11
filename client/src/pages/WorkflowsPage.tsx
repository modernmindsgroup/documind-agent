import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, 
  Play, 
  Pause,
  Settings, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  FileText,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { WorkflowStudio } from "./WorkflowStudio";
import { WorkflowBuilder } from "@/components/WorkflowBuilder";
import { mockWorkflowTemplates } from "@/lib/mock-data";
import { WorkflowTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: 'lead_qualification' | 'scheduler' | 'survey' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  edges: any[];
}

type ViewMode = 'list' | 'templates' | 'studio';

export default function WorkflowsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  // Fetch workflows from API
  const { data: workflows = [], isLoading, error } = useQuery({
    queryKey: ['/api/workflows'],
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }
    },
    onSuccess: () => {
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, isActive }: { workflowId: string; isActive: boolean }) => {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle workflow');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
  });

  const handleCreateNew = () => {
    setSelectedWorkflowId(null);
    setViewMode('studio');
  };

  const handleEditWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setViewMode('studio');
  };

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    // Create a new workflow from template
    setSelectedWorkflowId(null);
    setViewMode('studio');
    // Pass template data to studio - would need to implement this
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedWorkflowId(null);
  };

  const getWorkflowTypeColor = (type: string) => {
    switch (type) {
      case 'lead_qualification': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'scheduler': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'survey': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'custom': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (viewMode === 'studio') {
    return (
      <WorkflowStudio 
        workflowId={selectedWorkflowId || undefined}
        onBack={handleBackToList}
      />
    );
  }

  if (viewMode === 'templates') {
    return (
      <div className="h-full">
        <div className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Workflow Templates</h1>
              <p className="text-muted-foreground">
                Choose from pre-built templates to get started quickly
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setViewMode('list')}
              data-testid="button-back-to-list"
            >
              Back to Workflows
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <WorkflowBuilder 
            templates={mockWorkflowTemplates}
            onSelectTemplate={handleSelectTemplate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflows</h1>
            <p className="text-muted-foreground">
              Design and manage conversation flows for your AI agents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setViewMode('templates')}
              data-testid="button-browse-templates"
            >
              <FileText className="h-4 w-4 mr-2" />
              Browse Templates
            </Button>
            <Button 
              onClick={handleCreateNew}
              data-testid="button-create-workflow"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <Workflow className="h-16 w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading workflows...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-center">
              <Workflow className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load workflows</h3>
              <p className="text-muted-foreground mb-4">
                Something went wrong while loading your workflows.
              </p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/workflows'] })}>
                Try Again
              </Button>
            </div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-12">
            <Workflow className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow to get started.
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
              <Button 
                variant="outline"
                onClick={() => setViewMode('templates')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow: Workflow) => (
              <Card 
                key={workflow.id} 
                className="hover-elevate cursor-pointer group"
                data-testid={`workflow-card-${workflow.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        workflow.isActive ? "bg-green-500" : "bg-gray-400"
                      )} />
                      <Badge 
                        variant="secondary" 
                        className={getWorkflowTypeColor(workflow.type)}
                      >
                        {workflow.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`workflow-menu-${workflow.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEditWorkflow(workflow.id)}
                          data-testid={`workflow-edit-${workflow.id}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {/* Copy workflow */}}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => toggleWorkflowMutation.mutate({
                            workflowId: workflow.id,
                            isActive: !workflow.isActive
                          })}
                          data-testid={`workflow-toggle-${workflow.id}`}
                        >
                          {workflow.isActive ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                          className="text-destructive"
                          data-testid={`workflow-delete-${workflow.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <CardTitle 
                    className="text-lg leading-snug cursor-pointer"
                    onClick={() => handleEditWorkflow(workflow.id)}
                  >
                    {workflow.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {workflow.description || "No description provided"}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{workflow.nodes?.length || 0} nodes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}