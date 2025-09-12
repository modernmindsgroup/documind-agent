import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
});

type CreateAgentForm = z.infer<typeof createAgentSchema>;

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgentModal({ open, onOpenChange }: CreateAgentModalProps) {
  const { toast } = useToast();
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const form = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: CreateAgentForm) => {
      const response = await apiRequest("POST", "/api/agents", {
        ...data,
        type: "single_prompt", // Fixed type for Single Prompt Agents
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setCreatedAgentId(data.id);
      toast({
        title: "Agent created successfully!",
        description: `${form.getValues("name")} has been created with ID: ${data.id}`,
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating agent",
        description: error instanceof Error ? error.message : "Failed to create agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopyId = async () => {
    if (createdAgentId) {
      try {
        await navigator.clipboard.writeText(createdAgentId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
        toast({
          title: "Copied!",
          description: "Agent ID copied to clipboard",
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Could not copy agent ID to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: CreateAgentForm) => {
    createAgentMutation.mutate(data);
  };

  const handleClose = () => {
    setCreatedAgentId(null);
    setCopiedId(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Create Single Prompt Agent</DialogTitle>
          <DialogDescription>
            Create a new AI agent that responds with a single prompt. Fill in the details below to get started.
          </DialogDescription>
        </DialogHeader>

        {createdAgentId ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-green-600 font-medium">✓ Agent Created Successfully!</div>
              <div className="text-sm text-muted-foreground">
                Your agent "{form.getValues("name")}" has been created.
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Agent ID</label>
              <div className="flex items-center space-x-2">
                <Input
                  value={createdAgentId}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="text-agent-id"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyId}
                  data-testid="button-copy-id"
                >
                  {copiedId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter agent name..."
                        data-testid="input-agent-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this agent does..."
                        className="min-h-[100px]"
                        data-testid="input-agent-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          {createdAgentId ? (
            <Button onClick={handleClose} data-testid="button-close-modal">
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createAgentMutation.isPending}
                data-testid="button-submit-create"
              >
                {createAgentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Agent"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}