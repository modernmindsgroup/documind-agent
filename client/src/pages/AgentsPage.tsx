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
import { 
  Bot, 
  Activity, 
  Settings, 
  Code2, 
  Phone, 
  MessageSquare, 
  Plus, 
  Play, 
  Pause, 
  Copy, 
  Check,
  ChevronRight,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
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

type LLMConfig = z.infer<typeof llmConfigSchema>;
type TranscriberConfig = z.infer<typeof transcriberConfigSchema>;
type VoiceConfig = z.infer<typeof voiceConfigSchema>;

export default function AgentsPage() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("stats");
  const [configSection, setConfigSection] = useState("llm");
  const [copiedWidget, setCopiedWidget] = useState(false);

  // Fetch agents
  const { data: agents = [], isLoading, isError, error } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Fetch agent-specific data
  const { data: agentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/agents', selectedAgent?.id, 'stats'],
    enabled: !!selectedAgent?.id,
  });

  const { data: agentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['/api/agents', selectedAgent?.id, 'activity'],
    enabled: !!selectedAgent?.id,
  });

  // Mutations for agent actions
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ agentId, isActive }: { agentId: string; isActive: boolean }) => {
      return await apiRequest(`/api/agents/${agentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
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
      return await apiRequest(`/api/agents/${agentId}/configuration`, {
        method: 'PATCH',
        body: JSON.stringify(config),
      });
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

  // Select first agent by default
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  // Form instances
  const llmForm = useForm<LLMConfig>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues: {
      provider: "openai",
      model: "gpt-4",
      prompt: selectedAgent?.prompt || "",
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
      voice: selectedAgent?.voice || "alloy",
      model: "eleven_multilingual_v2",
    },
  });

  // Update forms when selected agent changes
  useEffect(() => {
    if (selectedAgent) {
      llmForm.reset({
        provider: "openai",
        model: "gpt-4",
        prompt: selectedAgent.prompt || "",
        maxTokens: 2048,
        temperature: 0.7,
      });
      voiceForm.reset({
        provider: "elevenlabs",
        voice: selectedAgent.voice || "alloy",
        model: "eleven_multilingual_v2",
      });
    }
  }, [selectedAgent, llmForm, voiceForm]);

  const handleToggleStatus = () => {
    if (!selectedAgent) return;
    toggleStatusMutation.mutate({
      agentId: selectedAgent.id,
      isActive: !selectedAgent.isActive,
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

  const handleCopyWidget = async () => {
    if (!selectedAgent) return;
    
    const widgetCode = `<script>
  window.VoiceFlowConfig = {
    agentId: "${selectedAgent.id}",
    theme: "light"
  };
</script>
<script src="https://cdn.voiceflow.com/widget.js"></script>`;

    try {
      await navigator.clipboard.writeText(widgetCode);
      setCopiedWidget(true);
      toast({
        title: "Widget code copied!",
        description: "The embed code has been copied to your clipboard.",
      });
      setTimeout(() => setCopiedWidget(false), 2000);
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

  if (isLoading || statsLoading || activityLoading) {
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
          <Button>
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
            <Button size="sm" variant="outline">
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
                    variant={agent.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full mr-1", 
                      agent.isActive ? "bg-green-500" : "bg-yellow-500"
                    )} />
                    {getStatusText(agent.isActive)}
                  </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Bot className="h-3 w-3 mr-1" />
                  <span className="capitalize">{agent.type.replace('_', ' ')}</span>
                  {agent.phoneNumber && (
                    <>
                      <span className="mx-2">•</span>
                      <Phone className="h-3 w-3 mr-1" />
                      <span>Voice</span>
                    </>
                  )}
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
                      variant={selectedAgent.isActive ? "default" : "secondary"}
                      className={getStatusColor(selectedAgent.isActive)}
                    >
                      <div className={cn("w-2 h-2 rounded-full mr-2", 
                        selectedAgent.isActive ? "bg-green-500" : "bg-yellow-500"
                      )} />
                      {getStatusText(selectedAgent.isActive)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {selectedAgent.prompt || "No description available"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid="button-agent-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button 
                    variant={selectedAgent.isActive ? "secondary" : "default"} 
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={toggleStatusMutation.isPending}
                    data-testid="button-agent-toggle-status"
                  >
                    {selectedAgent.isActive ? (
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
                  <TabsTrigger value="widget" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Widget
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="stats" className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                            `${agentStats?.weeklyGrowth > 0 ? '+' : ''}${(agentStats?.weeklyGrowth * 100)?.toFixed(1) || 0}% from last week`
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
                            {(agentStats?.successRate * 100)?.toFixed(1) || 0}%
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activityLoading ? (
                        <div className="space-y-4">
                          {[...Array(5)].map((_, i) => (
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
                      ) : agentActivity.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No recent activity for this agent</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {agentActivity.map((activity, index) => (
                            <div key={activity.id} className="flex items-center justify-between py-2" data-testid={`activity-item-${index}`}>
                              <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", {
                                  "bg-green-500": activity.status === "completed",
                                  "bg-blue-500": activity.status === "active", 
                                  "bg-red-500": activity.status === "failed"
                                })} />
                                <div>
                                  <p className="text-sm font-medium capitalize">
                                    {activity.type} {activity.status}
                                    {activity.duration && ` (${Math.floor(activity.duration / 60)}:${String(activity.duration % 60).padStart(2, '0')})`}
                                  </p>
                                  {activity.phoneNumber && (
                                    <p className="text-xs text-muted-foreground">{activity.phoneNumber}</p>
                                  )}
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
                                            {...field}
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
                                            {...field}
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

                <TabsContent value="widget" className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Widget</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Add this conversational widget to your website. Visitors can talk or chat with your AI assistant directly from any page.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Embed Code</h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Customize
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleCopyWidget}
                              disabled={copiedWidget}
                            >
                              {copiedWidget ? (
                                <Check className="h-4 w-4 mr-2" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              {copiedWidget ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`<script>
  window.VoiceFlowConfig = {
    agentId: "${selectedAgent.id}",
    theme: "light"
  };
</script>
<script src="https://cdn.voiceflow.com/widget.js"></script>`}</code>
                          </pre>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Copy and paste this code into your website's HTML to add the conversational widget.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}