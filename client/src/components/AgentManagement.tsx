import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  Phone, 
  MessageSquare, 
  Settings, 
  Trash2, 
  Edit, 
  Play, 
  Pause,
  Plus,
  ArrowLeft
} from "lucide-react";
import { AgentTemplates } from "@/components/AgentTemplates";
import { AgentForm } from "@/components/AgentForm";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { mockAgentTemplates } from "@/lib/mock-data";
import type { Agent } from "@shared/schema";
import type { AgentTemplate } from "@/lib/types";

type ViewMode = 'list' | 'templates' | 'form' | 'details';

export function AgentManagement() {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // Fetch agents
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: (agentId: string) => apiRequest(`/api/agents/${agentId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent deleted",
        description: "The agent has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle agent active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ agentId, isActive }: { agentId: string; isActive: boolean }) => 
      apiRequest(`/api/agents/${agentId}`, 'PUT', { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent updated",
        description: "Agent status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent status.",
        variant: "destructive",
      });
    },
  });

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setSelectedAgent(null);
    setCurrentView('form');
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setSelectedTemplate(null);
    setCurrentView('form');
  };

  const handleAgentCreated = () => {
    setCurrentView('list');
    setSelectedTemplate(null);
    setSelectedAgent(null);
    queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
  };

  const handleDeleteAgent = (agentId: string, agentName: string) => {
    if (window.confirm(`Are you sure you want to delete "${agentName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(agentId);
    }
  };

  const handleToggleActive = (agent: Agent) => {
    toggleActiveMutation.mutate({ 
      agentId: agent.id, 
      isActive: !agent.isActive 
    });
  };

  const renderHeader = () => {
    const getTitle = () => {
      switch (currentView) {
        case 'templates':
          return 'Choose Template';
        case 'form':
          return selectedAgent ? 'Edit Agent' : 'Create Agent';
        case 'details':
          return 'Agent Details';
        default:
          return 'AI Agents';
      }
    };

    const getDescription = () => {
      switch (currentView) {
        case 'templates':
          return 'Select a template to get started quickly';
        case 'form':
          return selectedAgent ? 'Update your agent configuration' : 'Configure your new AI agent';
        case 'details':
          return 'View and manage your agent';
        default:
          return 'Manage your voice and chat AI agents';
      }
    };

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {currentView !== 'list' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('list')}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{getTitle()}</h2>
            <p className="text-muted-foreground">{getDescription()}</p>
          </div>
        </div>
        
        {currentView === 'list' && (
          <Button
            onClick={() => setCurrentView('templates')}
            data-testid="button-create-agent"
            className="hover-elevate"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        )}
      </div>
    );
  };

  const renderAgentList = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (agents.length === 0) {
      return (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI agent to get started with voice and chat automation.
            </p>
            <Button 
              onClick={() => setCurrentView('templates')}
              data-testid="button-create-first-agent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className="hover-elevate cursor-pointer"
            data-testid={`card-agent-${agent.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {agent.type === 'conversation_flow' ? (
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Bot className="h-5 w-5 text-purple-600" />
                  )}
                  <Badge 
                    variant={agent.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(agent);
                    }}
                    data-testid={`button-toggle-${agent.id}`}
                    className="h-8 w-8 p-0"
                  >
                    {agent.isActive ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAgent(agent);
                    }}
                    data-testid={`button-edit-${agent.id}`}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAgent(agent.id, agent.name);
                    }}
                    data-testid={`button-delete-${agent.id}`}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg" data-testid={`title-${agent.id}`}>
                {agent.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {agent.prompt || 'No description available'}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center">
                  {agent.phoneNumber && (
                    <span className="flex items-center mr-3">
                      <Phone className="h-3 w-3 mr-1" />
                      Phone
                    </span>
                  )}
                  <span className="flex items-center">
                    <Settings className="h-3 w-3 mr-1" />
                    {agent.type.replace('_', ' ')}
                  </span>
                </span>
                <span>
                  Voice: {agent.voice || 'alloy'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'templates':
        return (
          <AgentTemplates 
            templates={mockAgentTemplates}
            onSelectTemplate={handleTemplateSelect}
          />
        );
      case 'form':
        return (
          <AgentForm 
            agent={selectedAgent}
            template={selectedTemplate}
            onSaved={handleAgentCreated}
            onCancel={() => setCurrentView('list')}
          />
        );
      case 'list':
      default:
        return renderAgentList();
    }
  };

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderContent()}
    </div>
  );
}