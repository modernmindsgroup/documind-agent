import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Bot, 
  Activity, 
  Settings, 
  Code2, 
  Phone, 
  MessageSquare, 
  MessageCircle,
  Plus, 
  Play, 
  Pause, 
  Copy, 
  Check,
  ChevronRight,
  BarChart3,
  User,
  FileText,
  Upload,
  Search,
  X,
  Download,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CreateAgentModal } from "@/components/CreateAgentModal";
import { Switch } from "@/components/ui/switch";
import type { Agent } from "@shared/schema";

// Validation schemas for configuration forms
const llmConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  prompt: z.string().min(1),
  maxTokens: z.number().min(1),
  temperature: z.number().min(0).max(2),
});

const transcriberConfigSchema = z.object({
  provider: z.string(),
  language: z.string(),
  model: z.string(),
});

const voiceConfigSchema = z.object({
  provider: z.string(),
  voice: z.string(),
  model: z.string(),
});

const preferencesSchema = z.object({
  isContactRequired: z.boolean(),
  displayName: z.string().min(1, "Display name is required"),
  logo: z.string().url().optional().or(z.literal("")),
  widgetTheme: z.enum(["light", "dark", "auto"]),
  // Voice platform selection removed - voice functionality no longer available
});

type LLMConfig = z.infer<typeof llmConfigSchema>;
type TranscriberConfig = z.infer<typeof transcriberConfigSchema>;
type VoiceConfig = z.infer<typeof voiceConfigSchema>;
type PreferencesConfig = z.infer<typeof preferencesSchema>;

export default function AgentsPage() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("stats");
  const [configSection, setConfigSection] = useState("llm");
  const [copiedWidget, setCopiedWidget] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch agents
  const { data: agents = [], isLoading, isError, error } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Fetch agent-specific data
  const { data: agentStats, isLoading: statsLoading } = useQuery<{
    totalCalls: number;
    totalChats: number;
    successRate: number;
    averageDuration: number;
    weeklyGrowth: number;
  }>({
    queryKey: ['/api/agents', selectedAgent?.id, 'stats'],
    enabled: !!selectedAgent?.id,
  });

  const { data: agentActivity = [], isLoading: activityLoading } = useQuery<Array<{
    id: string;
    type: string;
    status: string;
    duration?: number;
    phoneNumber?: string;
    createdAt: string;
  }>>({
    queryKey: ['/api/agents', selectedAgent?.id, 'activity'],
    enabled: !!selectedAgent?.id,
  });

  // Fetch agent preferences
  const { data: agentPreferences, isLoading: preferencesLoading } = useQuery<{
    isContactRequired: boolean;
    displayName: string;
    logo: string | null;
    widgetTheme: 'light' | 'dark' | 'auto';
  }>({
    queryKey: ['/api/agents', selectedAgent?.id, 'preferences'],
    enabled: !!selectedAgent?.id,
  });

  // Fetch conversation count for badge
  const { data: conversationCount } = useQuery<{
    conversations: Array<any>;
    total: number;
  }>({
    queryKey: ['/api/conversations', { agentId: selectedAgent?.id }],
    enabled: !!selectedAgent?.id,
  });

  // Fetch agent documents
  const { data: agentDocuments, isLoading: documentsLoading } = useQuery<{
    documents: Array<{
      id: string;
      name: string;
      description: string | null;
      mimeType: string;
      size: number;
      addedBy: string;
      addedAt: string;
      storageKey: string;
    }>;
    total: number;
  }>({
    queryKey: ['/api/agents', selectedAgent?.id, 'documents'],
    enabled: !!selectedAgent?.id,
  });

  // Voice platform functionality has been removed

  // Mutations for agent actions
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ agentId, isActive }: { agentId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/agents/${agentId}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Agent status updated",
        description: `Agent ${selectedAgent?.isActive ? 'paused' : 'activated'} successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error updating agent status",
        description: "Failed to update agent status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async ({ agentId, config }: { agentId: string; config: any }) => {
      return await apiRequest('PATCH', `/api/agents/${agentId}/configuration`, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: "Configuration saved",
        description: "Agent configuration has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving configuration",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async ({ agentId, preferences }: { agentId: string; preferences: PreferencesConfig }) => {
      return await apiRequest('PUT', `/api/agents/${agentId}/preferences`, preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents', selectedAgent?.id, 'preferences'] });
      toast({
        title: "Preferences saved",
        description: "Agent preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error saving preferences",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Document mutations
  const addDocumentToAgentMutation = useMutation({
    mutationFn: async ({ agentId, documentId }: { agentId: string; documentId: string }) => {
      return await apiRequest('POST', `/api/agents/${agentId}/documents`, { documentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents', selectedAgent?.id, 'documents'] });
      toast({
        title: "Document added",
        description: "Document has been successfully added to the agent.",
      });
    },
    onError: () => {
      toast({
        title: "Error adding document",
        description: "Failed to add document to agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeDocumentFromAgentMutation = useMutation({
    mutationFn: async ({ agentId, documentId }: { agentId: string; documentId: string }) => {
      return await apiRequest('DELETE', `/api/agents/${agentId}/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents', selectedAgent?.id, 'documents'] });
      toast({
        title: "Document removed",
        description: "Document has been successfully removed from the agent.",
      });
    },
    onError: () => {
      toast({
        title: "Error removing document",
        description: "Failed to remove document from agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Select first agent by default
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  // Voice platform selection removed - voice functionality no longer available

  // Form instances
  const llmForm = useForm<LLMConfig>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues: {
      provider: "openai",
      model: "gpt-4",
      prompt: selectedAgent?.description || "",
      maxTokens: 2048,
      temperature: 0.7,
    },
  });

  const transcriberForm = useForm<TranscriberConfig>({
    resolver: zodResolver(transcriberConfigSchema),
    defaultValues: {
      provider: "deepgram",
      language: "en",
      model: "nova-2",
    },
  });

  const voiceForm = useForm<VoiceConfig>({
    resolver: zodResolver(voiceConfigSchema),
    defaultValues: {
      provider: "elevenlabs",
      voice: "alloy", // Voice will be fetched from configuration
      model: "eleven_multilingual_v2",
    },
  });

  const preferencesForm = useForm<PreferencesConfig>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      isContactRequired: agentPreferences?.isContactRequired ?? false,
      displayName: agentPreferences?.displayName || selectedAgent?.name || "",
      logo: agentPreferences?.logo || "",
      widgetTheme: agentPreferences?.widgetTheme || "light",
    },
  });

  // Update forms when selected agent or preferences change
  useEffect(() => {
    if (selectedAgent) {
      llmForm.reset({
        provider: "openai",
        model: "gpt-4",
        prompt: selectedAgent.description || "",
        maxTokens: 2048,
        temperature: 0.7,
      });
      voiceForm.reset({
        provider: "elevenlabs",
        voice: "alloy", // Voice will be fetched from configuration
        model: "eleven_multilingual_v2",
      });
      preferencesForm.reset({
        isContactRequired: agentPreferences?.isContactRequired ?? false,
        displayName: agentPreferences?.displayName || selectedAgent.name || "",
        logo: agentPreferences?.logo || "",
        widgetTheme: agentPreferences?.widgetTheme || "light",
      });
    }
  }, [selectedAgent, agentPreferences, llmForm, voiceForm, preferencesForm]);


  const handleToggleStatus = () => {
    if (!selectedAgent) return;
    toggleStatusMutation.mutate({
      agentId: selectedAgent.id,
      isActive: !(selectedAgent.isActive ?? false),
    });
  };

  const handleSaveLLMConfig = (data: LLMConfig) => {
    if (!selectedAgent) return;
    saveConfigMutation.mutate({
      agentId: selectedAgent.id,
      config: { llm: data },
    });
  };

  const handleSaveTranscriberConfig = (data: TranscriberConfig) => {
    if (!selectedAgent) return;
    saveConfigMutation.mutate({
      agentId: selectedAgent.id,
      config: { transcriber: data },
    });
  };

  const handleSaveVoiceConfig = (data: VoiceConfig) => {
    if (!selectedAgent) return;
    saveConfigMutation.mutate({
      agentId: selectedAgent.id,
      config: { voice: data },
    });
  };

  const handleSavePreferences = (data: PreferencesConfig) => {
    if (!selectedAgent) return;
    savePreferencesMutation.mutate({
      agentId: selectedAgent.id,
      preferences: data,
    });
  };

  const handleCopyWidget = async (widgetType: string) => {
    if (!selectedAgent) return;
    
    const getWidgetCode = (type: string) => {
      const origin = window.location.origin;
      switch (type) {
        case 'chat-voice':
          return `<script src="${origin}/chat-widget.js" data-agent-id="${selectedAgent.id}"></script>`;
        case 'chat-only':
          return `<script src="${origin}/chat-only-widget.js" data-agent-id="${selectedAgent.id}"></script>`;
        default:
          return '';
      }
    };

    const widgetCode = getWidgetCode(widgetType);
    const widgetNames = {
      'chat-voice': 'Chat + Voice Widget',
      'chat-only': 'Chat Only Widget'
    };

    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopiedWidget(widgetType);
      toast({
        title: `${widgetNames[widgetType as keyof typeof widgetNames]} code copied!`,
        description: "The embed code has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedWidget(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-green-600" : "text-yellow-600";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? "Active" : "Inactive";
  };

  // Only show full loading for initial agent list load
  if (isLoading) {
    return (
      <div className="h-full flex">
        <div className="w-80 border-r border-border p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load agents</h3>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'Something went wrong while loading your agents.'}
          </p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents'] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first AI agent to get started.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-agent">
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Agent List */}
      <div className="w-80 border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Agents</h2>
            <Button size="sm" variant="outline" onClick={() => setIsCreateModalOpen(true)} data-testid="button-create-agent-sidebar">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedAgent?.id === agent.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedAgent(agent)}
              data-testid={`agent-item-${agent.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm truncate pr-2" title={agent.name}>
                    {agent.name}
                  </h3>
                  <Badge 
                    variant={!!agent.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full mr-1", 
                      !!agent.isActive ? "bg-green-500" : "bg-yellow-500"
                    )} />
                    {getStatusText(!!agent.isActive)}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Bot className="h-3 w-3 mr-1" />
                  <span className="capitalize">{agent.type.replace('_', ' ')}</span>
                  {/* Phone integration would go here when implemented */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {selectedAgent && (
          <>
            {/* Header */}
            <div className="border-b border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{selectedAgent.name}</h1>
                    <Badge 
                      variant={!!selectedAgent.isActive ? "default" : "secondary"}
                      className={getStatusColor(!!selectedAgent.isActive)}
                    >
                      <div className={cn("w-2 h-2 rounded-full mr-2", 
                        !!selectedAgent.isActive ? "bg-green-500" : "bg-yellow-500"
                      )} />
                      {getStatusText(!!selectedAgent.isActive)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {selectedAgent.description || "No description available"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid="button-agent-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button 
                    variant={!!selectedAgent.isActive ? "secondary" : "default"} 
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={toggleStatusMutation.isPending}
                    data-testid="button-agent-toggle-status"
                  >
                    {!!selectedAgent.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        {toggleStatusMutation.isPending ? 'Pausing...' : 'Pause'}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        {toggleStatusMutation.isPending ? 'Activating...' : 'Activate'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <div className="border-b border-border px-6">
                <TabsList className="h-12">
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger value="configuration" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuration
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                    {agentDocuments?.total ? (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {agentDocuments.total}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="conversation-history" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Conversations
                    {conversationCount?.total ? (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {conversationCount.total}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="calls" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Calls
                  </TabsTrigger>
                  <TabsTrigger value="widget" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Widget
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="stats" className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Chats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-20 mb-2" />
                        ) : (
                          <div className="text-2xl font-bold" data-testid="stat-total-chats">
                            {agentStats?.totalChats || 0}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Active conversations
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Total Calls</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-20 mb-2" />
                        ) : (
                          <div className="text-2xl font-bold" data-testid="stat-total-calls">
                            {agentStats?.totalCalls || 0}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {statsLoading ? (
                            <Skeleton className="h-3 w-16" />
                          ) : (
                            `${(agentStats?.weeklyGrowth ?? 0) > 0 ? '+' : ''}${((agentStats?.weeklyGrowth ?? 0) * 100).toFixed(1)}% from last week`
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-20 mb-2" />
                        ) : (
                          <div className="text-2xl font-bold" data-testid="stat-success-rate">
                            {((agentStats?.successRate ?? 0) * 100).toFixed(1)}%
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {statsLoading ? (
                            <Skeleton className="h-3 w-16" />
                          ) : (
                            "Successful interactions"
                          )}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Avg Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-20 mb-2" />
                        ) : (
                          <div className="text-2xl font-bold" data-testid="stat-avg-duration">
                            {Math.floor((agentStats?.averageDuration || 0) / 60)}m {((agentStats?.averageDuration || 0) % 60)}s
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {statsLoading ? (
                            <Skeleton className="h-3 w-16" />
                          ) : (
                            "Average call length"
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Chats */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Recent Chats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {activityLoading ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="w-2 h-2 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                  </div>
                                </div>
                                <Skeleton className="h-3 w-16" />
                              </div>
                            ))}
                          </div>
                        ) : agentActivity.filter(a => a.type === 'chat').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No recent chats</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {agentActivity.filter(a => a.type === 'chat').slice(0, 5).map((activity, index) => (
                              <div key={activity.id} className="flex items-center justify-between py-2" data-testid={`chat-activity-item-${index}`}>
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-2 h-2 rounded-full", {
                                    "bg-green-500": activity.status === "completed",
                                    "bg-blue-500": activity.status === "active", 
                                    "bg-red-500": activity.status === "failed"
                                  })} />
                                  <div>
                                    <p className="text-sm font-medium capitalize">
                                      {activity.status}
                                      {activity.duration && ` (${Math.floor(activity.duration / 60)}:${String(activity.duration % 60).padStart(2, '0')})`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Text conversation</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Recent Calls */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Recent Calls
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {activityLoading ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="w-2 h-2 rounded-full" />
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                  </div>
                                </div>
                                <Skeleton className="h-3 w-16" />
                              </div>
                            ))}
                          </div>
                        ) : agentActivity.filter(a => a.type === 'call').length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Phone className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No recent calls</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {agentActivity.filter(a => a.type === 'call').slice(0, 5).map((activity, index) => (
                              <div key={activity.id} className="flex items-center justify-between py-2" data-testid={`call-activity-item-${index}`}>
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-2 h-2 rounded-full", {
                                    "bg-green-500": activity.status === "completed",
                                    "bg-blue-500": activity.status === "active", 
                                    "bg-red-500": activity.status === "failed"
                                  })} />
                                  <div>
                                    <p className="text-sm font-medium capitalize">
                                      {activity.status}
                                      {activity.duration && ` (${Math.floor(activity.duration / 60)}:${String(activity.duration % 60).padStart(2, '0')})`}
                                    </p>
                                    {/* Phone number would be shown here if available */}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="configuration" className="p-6">
                  <div className="flex gap-6">
                    {/* Configuration Navigation */}
                    <div className="w-64 space-y-1">
                      <Button
                        variant={configSection === "llm" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setConfigSection("llm")}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        LLM Configuration
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                      <Button
                        variant={configSection === "transcriber" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setConfigSection("transcriber")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Transcriber Configuration
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                      <Button
                        variant={configSection === "voice" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setConfigSection("voice")}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Voice Configuration
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      </Button>
                    </div>

                    {/* Configuration Content */}
                    <div className="flex-1">
                      {configSection === "llm" && (
                        <Card>
                          <CardHeader>
                            <CardTitle>LLM Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Configure the behavior of the AI assistant.
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <Form {...llmForm}>
                              <form onSubmit={llmForm.handleSubmit(handleSaveLLMConfig)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={llmForm.control}
                                    name="provider"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Provider</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-llm-provider">
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="openai">OpenAI</SelectItem>
                                            <SelectItem value="anthropic">Anthropic</SelectItem>
                                            <SelectItem value="google">Google</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={llmForm.control}
                                    name="model"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-llm-model">
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={llmForm.control}
                                  name="prompt"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>System Prompt</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Enter the system prompt that defines your agent's personality and behavior..."
                                          rows={8}
                                          className="resize-none"
                                          data-testid="textarea-llm-prompt"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        This prompt defines how your AI agent behaves and responds to users.
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={llmForm.control}
                                    name="maxTokens"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Max Tokens</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            data-testid="input-llm-max-tokens"
                                            value={field.value?.toString() || ""}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={llmForm.control}
                                    name="temperature"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Temperature</FormLabel>
                                        <FormControl>
                                          <Input 
                                            type="number" 
                                            step="0.1" 
                                            min="0" 
                                            max="2"
                                            data-testid="input-llm-temperature"
                                            value={field.value?.toString() || ""}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <Button 
                                  type="submit" 
                                  disabled={saveConfigMutation.isPending}
                                  data-testid="button-save-llm-config"
                                >
                                  {saveConfigMutation.isPending ? "Saving..." : "Save LLM Configuration"}
                                </Button>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      )}

                      {configSection === "transcriber" && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Transcriber Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Configure the speech-to-text settings for the assistant.
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <Form {...transcriberForm}>
                              <form onSubmit={transcriberForm.handleSubmit(handleSaveTranscriberConfig)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={transcriberForm.control}
                                    name="provider"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Provider</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-transcriber-provider">
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="deepgram">Deepgram</SelectItem>
                                            <SelectItem value="openai">OpenAI Whisper</SelectItem>
                                            <SelectItem value="google">Google Cloud Speech</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={transcriberForm.control}
                                    name="language"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Language</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-transcriber-language">
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                            <SelectItem value="de">German</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={transcriberForm.control}
                                  name="model"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Model</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-transcriber-model">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="nova-2">Nova 2</SelectItem>
                                          <SelectItem value="whisper-1">Whisper V1</SelectItem>
                                          <SelectItem value="enhanced">Enhanced</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <Button 
                                  type="submit" 
                                  disabled={saveConfigMutation.isPending}
                                  data-testid="button-save-transcriber-config"
                                >
                                  {saveConfigMutation.isPending ? "Saving..." : "Save Transcriber Configuration"}
                                </Button>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      )}

                      {configSection === "voice" && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Voice Configuration</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Select a voice from the list, or sync your voice library if it's missing.
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <Form {...voiceForm}>
                              <form onSubmit={voiceForm.handleSubmit(handleSaveVoiceConfig)} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={voiceForm.control}
                                    name="provider"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Provider</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-voice-provider">
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                                            <SelectItem value="openai">OpenAI TTS</SelectItem>
                                            <SelectItem value="azure">Azure Speech</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={voiceForm.control}
                                    name="voice"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Voice</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-voice-voice">
                                              <SelectValue />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="alloy">Alloy</SelectItem>
                                            <SelectItem value="echo">Echo</SelectItem>
                                            <SelectItem value="fable">Fable</SelectItem>
                                            <SelectItem value="onyx">Onyx</SelectItem>
                                            <SelectItem value="nova">Nova</SelectItem>
                                            <SelectItem value="shimmer">Shimmer</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                <FormField
                                  control={voiceForm.control}
                                  name="model"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Model</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-voice-model">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="eleven_multilingual_v2">Eleven Multilingual v2</SelectItem>
                                          <SelectItem value="eleven_turbo_v2">Eleven Turbo v2</SelectItem>
                                          <SelectItem value="tts-1">TTS-1</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <Button 
                                  type="submit" 
                                  disabled={saveConfigMutation.isPending}
                                  data-testid="button-save-voice-config"
                                >
                                  {saveConfigMutation.isPending ? "Saving..." : "Save Voice Configuration"}
                                </Button>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Preferences</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Configure how your agent interacts with users and displays in the widget.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {preferencesLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : (
                        <Form {...preferencesForm}>
                          <form onSubmit={preferencesForm.handleSubmit(handleSavePreferences)} className="space-y-6">
                            <FormField
                              control={preferencesForm.control}
                              name="displayName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Display Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Agent name displayed in widget"
                                      {...field}
                                      data-testid="input-display-name"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    This is how your agent will be introduced to users
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={preferencesForm.control}
                              name="logo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Logo URL</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="https://example.com/logo.png"
                                      {...field}
                                      data-testid="input-logo"
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Avatar image displayed in the widget chat
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={preferencesForm.control}
                              name="widgetTheme"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Widget Theme</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-widget-theme">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="light">Light</SelectItem>
                                      <SelectItem value="dark">Dark</SelectItem>
                                      <SelectItem value="auto">Auto</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    Color theme for the widget interface
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Voice platform selection removed - voice functionality no longer available */}

                            <FormField
                              control={preferencesForm.control}
                              name="isContactRequired"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                      Require Contact Information
                                    </FormLabel>
                                    <FormDescription>
                                      Users must provide their contact details before chatting
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      data-testid="switch-contact-required"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <Button 
                              type="submit" 
                              disabled={savePreferencesMutation.isPending}
                              data-testid="button-save-preferences"
                            >
                              {savePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                            </Button>
                          </form>
                        </Form>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="widget" className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2">Embed Widgets</h2>
                      <p className="text-muted-foreground">
                        Choose the widget type that best fits your website needs. Each widget can be customized and embedded with a simple script tag.
                      </p>
                    </div>

                    <div className="grid gap-6">
                      {/* Chat + Voice Widget */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                            <Phone className="h-5 w-5 text-green-600" />
                            <div>
                              <CardTitle className="text-lg">Chat + Voice Widget</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Full-featured widget with both text chat and voice calling capabilities
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Embed Code</h4>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCopyWidget('chat-voice')}
                              disabled={copiedWidget === 'chat-voice'}
                              data-testid="button-copy-chat-voice"
                            >
                              {copiedWidget === 'chat-voice' ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {copiedWidget === 'chat-voice' ? "Copied!" : "Copy Code"}
                            </Button>
                          </div>
                          
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{`<script src="${window.location.origin}/chat-widget.js" data-agent-id="${selectedAgent.id}"></script>`}</code>
                            </pre>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>Text messaging</span>
                            <span>•</span>
                            <Phone className="h-4 w-4" />
                            <span>Voice calls</span>
                            <span>•</span>
                            <User className="h-4 w-4" />
                            <span>Contact forms</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chat Only Widget */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">Chat Only Widget</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Text-based chat widget for websites that prefer messaging only
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Embed Code</h4>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCopyWidget('chat-only')}
                              disabled={copiedWidget === 'chat-only'}
                              data-testid="button-copy-chat-only"
                            >
                              {copiedWidget === 'chat-only' ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {copiedWidget === 'chat-only' ? "Copied!" : "Copy Code"}
                            </Button>
                          </div>
                          
                          <div className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{`<script src="${window.location.origin}/chat-only-widget.js" data-agent-id="${selectedAgent.id}"></script>`}</code>
                            </pre>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4" />
                            <span>Text messaging only</span>
                            <span>•</span>
                            <User className="h-4 w-4" />
                            <span>Contact forms</span>
                            <span>•</span>
                            <span>Lightweight & fast</span>
                          </div>
                        </CardContent>
                      </Card>

                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Integration Instructions</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Copy the embed code for your preferred widget type and paste it into your website's HTML, preferably just before the closing <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">&lt;/body&gt;</code> tag. 
                        The widget will automatically initialize when the page loads.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Agent Documents</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage documents that this agent can reference during conversations.
                        </p>
                      </div>
                      <Button 
                        data-testid="button-add-document" 
                        size="sm" 
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Document
                      </Button>
                    </div>

                    {/* Document search */}
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          data-testid="input-search-documents"
                          placeholder="Search documents..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Documents list */}
                    <div className="space-y-4">
                      {documentsLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                              <Skeleton className="h-8 w-20" />
                            </div>
                          ))}
                        </div>
                      ) : agentDocuments?.documents?.length ? (
                        <div className="grid gap-3">
                          {agentDocuments.documents.map((doc) => (
                            <Card key={doc.id} className="p-4 hover-elevate" data-testid={`card-document-${doc.id}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm text-foreground truncate" data-testid={`text-document-name-${doc.id}`}>
                                      {doc.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span data-testid={`text-document-type-${doc.id}`}>{doc.mimeType}</span>
                                      <span>•</span>
                                      <span data-testid={`text-document-size-${doc.id}`}>
                                        {(doc.size / 1024).toFixed(1)} KB
                                      </span>
                                      <span>•</span>
                                      <span data-testid={`text-document-date-${doc.id}`}>
                                        Added {new Date(doc.addedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {doc.description && (
                                      <p className="text-xs text-muted-foreground truncate mt-1" data-testid={`text-document-description-${doc.id}`}>
                                        {doc.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    data-testid={`button-download-document-${doc.id}`}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() => removeDocumentFromAgentMutation.mutate({
                                      agentId: selectedAgent.id,
                                      documentId: doc.id
                                    })}
                                    disabled={removeDocumentFromAgentMutation.isPending}
                                    data-testid={`button-remove-document-${doc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
                          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <h4 className="font-medium text-foreground mb-2" data-testid="text-no-documents">
                            No documents added yet
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            Add documents to provide your agent with additional knowledge and context for conversations.
                          </p>
                          <Button 
                            size="sm" 
                            className="flex items-center gap-2"
                            data-testid="button-add-first-document"
                          >
                            <Plus className="h-4 w-4" />
                            Add Your First Document
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Document stats */}
                    {agentDocuments?.total ? (
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                        <span data-testid="text-document-count">
                          {agentDocuments.total} document{agentDocuments.total !== 1 ? 's' : ''} associated with this agent
                        </span>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value="conversation-history" className="p-6">
                  <ConversationHistory agentId={selectedAgent.id} />
                </TabsContent>

                <TabsContent value="calls" className="p-6">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Phone className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Calls Feature Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      Voice calling functionality will be available in a future update. 
                      For now, enjoy our comprehensive text chat capabilities.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </div>
      
      <CreateAgentModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}

// Conversation History Component
function ConversationHistory({ agentId }: { agentId: string }) {
  const [search, setSearch] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMessageViewerOpen, setIsMessageViewerOpen] = useState(false);

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<{
    conversations: Array<{
      id: string;
      title: string;
      contactId?: string;
      updatedAt: string;
      isActive: boolean;
    }>;
    total: number;
  }>({
    queryKey: ['/api/conversations', { agentId, search }],
    enabled: !!agentId,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{
    messages: Array<{
      id: string;
      content: string;
      role: 'user' | 'assistant' | 'system';
      createdAt: string;
    }>;
    total: number;
  }>({
    queryKey: ['/api/conversations', selectedConversationId, 'messages'],
    enabled: !!selectedConversationId,
  });

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMessageViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Conversation History</h3>
          <p className="text-sm text-muted-foreground">
            View and search through past conversations with this agent
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
            data-testid="input-conversation-search"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-2">
          {conversationsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : conversationsData?.conversations?.length ? (
            conversationsData.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-4 border border-border rounded-lg hover-elevate cursor-pointer"
                onClick={() => handleConversationClick(conversation.id)}
                data-testid={`conversation-item-${conversation.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{conversation.title || 'Untitled Conversation'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {conversation.contactId && `Contact: ${conversation.contactId}`}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No conversations yet</h4>
              <p className="text-sm text-muted-foreground">
                Conversations will appear here once visitors start chatting with your agent
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Off-canvas Message Viewer using Sheet */}
      <Sheet open={isMessageViewerOpen} onOpenChange={setIsMessageViewerOpen}>
        <SheetContent side="right" className="w-full max-w-2xl p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle>
              {conversationsData?.conversations?.find((c) => c.id === selectedConversationId)?.title || 'Conversation'}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">Message History</p>
          </SheetHeader>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-120px)]">
            {messagesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messagesData?.messages?.length ? (
              messagesData.messages.map((message) => (
                <div key={message.id} className="flex gap-3" data-testid={`message-row-${message.id}`}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {message.role === 'user' ? 'U' : 'A'}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{message.role}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg text-sm",
                      message.role === 'user' 
                        ? 'bg-primary/10 text-primary-foreground border border-primary/20' 
                        : 'bg-muted'
                    )}
                    data-testid={`text-message-role-${message.role}-${message.id}`}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No messages in this conversation</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}