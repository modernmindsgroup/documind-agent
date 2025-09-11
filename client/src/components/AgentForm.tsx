import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertAgentSchema } from "@shared/schema";
import type { Agent } from "@shared/schema";
import type { AgentTemplate } from "@/lib/types";

// Use shared schema for type safety, excluding server-controlled fields
const agentFormSchema = insertAgentSchema.omit({
  id: true,
  tenantId: true,
  editedBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  phoneNumber: z.string().optional(),
  config: z.record(z.any()).default({}),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

interface AgentFormProps {
  agent?: Agent | null;
  template?: AgentTemplate | null;
  onSaved: () => void;
  onCancel: () => void;
}

const voiceOptions = [
  { value: "alloy", label: "Alloy (Default)" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "onyx", label: "Onyx" },
  { value: "nova", label: "Nova" },
  { value: "shimmer", label: "Shimmer" },
];

const typeOptions = [
  { value: "single_prompt", label: "Single Prompt" },
  { value: "multi_prompt", label: "Multi Prompt" },
  { value: "conversation_flow", label: "Conversation Flow" },
  { value: "custom_llm", label: "Custom LLM" },
];

export function AgentForm({ agent, template, onSaved, onCancel }: AgentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!agent;
  const isFromTemplate = !!template;

  // Initialize form with agent data, template data, or defaults
  const getDefaultValues = (): AgentFormData => {
    if (agent) {
      return {
        name: agent.name,
        type: agent.type as "conversation_flow" | "single_prompt" | "multi_prompt" | "custom_llm",
        voice: agent.voice || "alloy",
        phoneNumber: agent.phoneNumber || "",
        prompt: agent.prompt || "",
        isActive: agent.isActive ?? false,
        config: agent.config || {},
      };
    }
    
    if (template && template.id !== 'blank') {
      return {
        name: template.name,
        type: template.type as "conversation_flow" | "single_prompt" | "multi_prompt" | "custom_llm",
        voice: "alloy",
        phoneNumber: "",
        prompt: template.description,
        isActive: false,
        config: template.config || {},
      };
    }

    // Defaults for blank agent
    return {
      name: "",
      type: "single_prompt",
      voice: "alloy",
      phoneNumber: "",
      prompt: "",
      isActive: false,
      config: {},
    };
  };

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: getDefaultValues(),
  });

  const createMutation = useMutation({
    mutationFn: (data: AgentFormData) => apiRequest('/api/agents', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Agent created",
        description: "Your agent has been created successfully.",
      });
      onSaved();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AgentFormData) => 
      apiRequest(`/api/agents/${agent!.id}`, 'PUT', data),
    onSuccess: () => {
      toast({
        title: "Agent updated",
        description: "Your agent has been updated successfully.",
      });
      onSaved();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update agent. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Agent' : 'Create New Agent'}
            {isFromTemplate && !isEditing && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                from {template.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter agent name"
                        data-testid="input-agent-name"
                      />
                    </FormControl>
                    <FormDescription>
                      Give your agent a descriptive name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-agent-type">
                            <SelectValue placeholder="Select agent type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how your agent handles conversations.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voice</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-agent-voice">
                            <SelectValue placeholder="Select voice" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {voiceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the voice for your agent.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+1 (555) 123-4567"
                        data-testid="input-phone-number"
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a phone number if this agent handles voice calls.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter the system prompt that defines your agent's personality and behavior..."
                        rows={6}
                        data-testid="textarea-agent-prompt"
                      />
                    </FormControl>
                    <FormDescription>
                      Define your agent's personality, role, and how it should respond.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Activate Agent
                      </FormLabel>
                      <FormDescription>
                        Enable this agent to start handling conversations.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-agent-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="button-save-agent"
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Update Agent' : 'Create Agent')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  data-testid="button-cancel-agent"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}