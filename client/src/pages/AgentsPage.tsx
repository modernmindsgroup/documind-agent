import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Agent } from "@shared/schema";

export default function AgentsPage() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState("stats");
  const [configSection, setConfigSection] = useState("llm");
  const [copiedWidget, setCopiedWidget] = useState(false);

  // Fetch agents
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Select first agent by default
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

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
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button 
                    variant={selectedAgent.isActive ? "secondary" : "default"} 
                    size="sm"
                  >
                    {selectedAgent.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
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
                        <div className="text-2xl font-bold">324</div>
                        <p className="text-xs text-muted-foreground">+12% from last week</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">94.2%</div>
                        <p className="text-xs text-muted-foreground">+2.1% from last week</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Avg Duration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">3m 24s</div>
                        <p className="text-xs text-muted-foreground">-8s from last week</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { time: "2 minutes ago", action: "Call completed", status: "success", phone: "+1 (555) 123-4567" },
                          { time: "8 minutes ago", action: "Call started", status: "active", phone: "+1 (555) 987-6543" },
                          { time: "15 minutes ago", action: "Call completed", status: "success", phone: "+1 (555) 456-7890" },
                          { time: "23 minutes ago", action: "Call failed", status: "failed", phone: "+1 (555) 321-0987" },
                          { time: "1 hour ago", action: "Call completed", status: "success", phone: "+1 (555) 147-2580" },
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", {
                                "bg-green-500": activity.status === "success",
                                "bg-blue-500": activity.status === "active", 
                                "bg-red-500": activity.status === "failed"
                              })} />
                              <div>
                                <p className="text-sm font-medium">{activity.action}</p>
                                <p className="text-xs text-muted-foreground">{activity.phone}</p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                        ))}
                      </div>
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
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select defaultValue="openai">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="anthropic">Anthropic</SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Model</Label>
                                <Select defaultValue="gpt-4">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>System Prompt</Label>
                              <Textarea
                                placeholder="Enter the system prompt that defines your agent's personality and behavior..."
                                defaultValue={selectedAgent.prompt}
                                rows={8}
                                className="resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Max Tokens</Label>
                                <Input type="number" defaultValue="2048" />
                              </div>
                              <div className="space-y-2">
                                <Label>Temperature</Label>
                                <Input type="number" step="0.1" min="0" max="2" defaultValue="0.7" />
                              </div>
                            </div>

                            <Button>Save LLM Configuration</Button>
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
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select defaultValue="deepgram">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="deepgram">Deepgram</SelectItem>
                                    <SelectItem value="openai">OpenAI Whisper</SelectItem>
                                    <SelectItem value="google">Google Cloud Speech</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Language</Label>
                                <Select defaultValue="en">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Model</Label>
                              <Select defaultValue="nova-2">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nova-2">Nova 2</SelectItem>
                                  <SelectItem value="whisper-1">Whisper V1</SelectItem>
                                  <SelectItem value="enhanced">Enhanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button>Save Transcriber Configuration</Button>
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
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Provider</Label>
                                <Select defaultValue="elevenlabs">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                                    <SelectItem value="openai">OpenAI TTS</SelectItem>
                                    <SelectItem value="azure">Azure Speech</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Voice</Label>
                                <Select defaultValue={selectedAgent.voice || "alloy"}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="alloy">Alloy</SelectItem>
                                    <SelectItem value="echo">Echo</SelectItem>
                                    <SelectItem value="fable">Fable</SelectItem>
                                    <SelectItem value="onyx">Onyx</SelectItem>
                                    <SelectItem value="nova">Nova</SelectItem>
                                    <SelectItem value="shimmer">Shimmer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Model</Label>
                              <Select defaultValue="eleven_multilingual_v2">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="eleven_multilingual_v2">Eleven Multilingual v2</SelectItem>
                                  <SelectItem value="eleven_turbo_v2">Eleven Turbo v2</SelectItem>
                                  <SelectItem value="tts-1">TTS-1</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <Button>Save Voice Configuration</Button>
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