import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Trash2, 
  Edit3,
  Globe, 
  Bot,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Webhook,
  Settings,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Webhook {
  id: string;
  name: string;
  eventTypes: string[];
  url: string;
  secret?: string;
  timeout: number;
  retryLimit: number;
  isActive: boolean;
  disableOnFailure: boolean;
  agentId?: string;
  apiKeyId?: string;
  agent?: { name: string };
  apiKey?: { name: string };
  createdAt: string;
  updatedAt: string;
  _count?: {
    deliveries: number;
  };
  lastDelivery?: {
    status: string;
    createdAt: string;
  };
}

interface Agent {
  id: string;
  name: string;
}

interface ApiKey {
  id: string;
  name: string;
}

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  eventTypes: z.array(z.string()).min(1, 'At least one event type is required'),
  url: z.string().url('Please enter a valid URL'),
  secret: z.string().optional(),
  timeout: z.number().min(1000).max(30000),
  retryLimit: z.number().min(1).max(10),
  isActive: z.boolean(),
  disableOnFailure: z.boolean(),
  scope: z.enum(['global', 'agent', 'apiKey']),
  agentId: z.string().optional(),
  apiKeyId: z.string().optional(),
}).refine((data) => {
  if (data.scope === 'agent' && !data.agentId) {
    return false;
  }
  if (data.scope === 'apiKey' && !data.apiKeyId) {
    return false;
  }
  return true;
}, {
  message: "Please select a valid scope configuration",
});

type WebhookFormData = z.infer<typeof webhookSchema>;

const EVENT_TYPES = [
  { value: 'call.started', label: 'Call Started' },
  { value: 'call.completed', label: 'Call Completed' },
  { value: 'call.failed', label: 'Call Failed' },
  { value: 'chat.started', label: 'Chat Started' },
  { value: 'chat.message', label: 'Chat Message' },
  { value: 'chat.completed', label: 'Chat Completed' },
  { value: 'agent.created', label: 'Agent Created' },
  { value: 'agent.updated', label: 'Agent Updated' },
  { value: 'contact.created', label: 'Contact Created' },
];

export default function WebhooksPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null);
  const [secretToUpdate, setSecretToUpdate] = useState<string>('');

  // Fetch webhooks
  const { data: webhooks = [], isLoading, isError } = useQuery<Webhook[]>({
    queryKey: ['/api/webhooks'],
    refetchInterval: 30000, // Refresh every 30 seconds to show delivery status
  });

  // Fetch agents for the dropdown
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    select: (data) => data.map(agent => ({ id: agent.id, name: agent.name })),
  });

  // Fetch API keys for the dropdown
  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ['/api/api-keys'],
    select: (data) => data.map(key => ({ id: key.id, name: key.name })),
  });

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      eventTypes: [],
      url: '',
      secret: '',
      timeout: 5000,
      retryLimit: 7,
      isActive: true,
      disableOnFailure: false,
      scope: 'global',
      agentId: '',
      apiKeyId: '',
    },
  });
  
  const watchedScope = form.watch('scope');

  // Create webhook mutation
  const createMutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      const { scope, ...payload } = {
        ...data,
        secret: secretToUpdate || undefined, // Use separate secret state
        agentId: data.scope === 'agent' ? data.agentId : undefined,
        apiKeyId: data.scope === 'apiKey' ? data.apiKeyId : undefined,
      };
      return await apiRequest('POST', '/api/webhooks', payload);
    },
    onSuccess: () => {
      toast({
        title: 'Webhook created',
        description: 'Your webhook has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setIsCreateDialogOpen(false);
      setSecretToUpdate('');
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating webhook',
        description: error?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Update webhook mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WebhookFormData }) => {
      const { scope, ...payload } = {
        ...data,
        secret: secretToUpdate || undefined, // Only include if user is updating it
        agentId: data.scope === 'agent' ? data.agentId : undefined,
        apiKeyId: data.scope === 'apiKey' ? data.apiKeyId : undefined,
      };
      return await apiRequest('PUT', `/api/webhooks/${id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: 'Webhook updated',
        description: 'Your webhook has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setEditingWebhook(null);
      setSecretToUpdate('');
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating webhook',
        description: error?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Delete webhook mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Webhook deleted',
        description: 'The webhook has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setDeletingWebhook(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting webhook',
        description: error?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    const scope = webhook.agentId ? 'agent' : webhook.apiKeyId ? 'apiKey' : 'global';
    form.reset({
      name: webhook.name,
      eventTypes: webhook.eventTypes,
      url: webhook.url,
      secret: '', // Never prefill secrets for security
      timeout: webhook.timeout,
      retryLimit: webhook.retryLimit,
      isActive: webhook.isActive,
      disableOnFailure: webhook.disableOnFailure,
      scope: scope,
      agentId: webhook.agentId || '',
      apiKeyId: webhook.apiKeyId || '',
    });
    setSecretToUpdate(''); // Reset secret state
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingWebhook(null);
    setSecretToUpdate('');
    form.reset();
  };

  const onSubmit = (data: WebhookFormData) => {
    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (webhook: Webhook) => {
    if (!webhook.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (!webhook.lastDelivery) {
      return <Badge variant="outline">No deliveries</Badge>;
    }

    switch (webhook.lastDelivery.status) {
      case 'success':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'pending':
      case 'retrying':
        return <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScopeBadge = (webhook: Webhook) => {
    if (webhook.agentId && webhook.agent) {
      return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50"><Bot className="h-3 w-3 mr-1" />{webhook.agent.name}</Badge>;
    }
    if (webhook.apiKeyId && webhook.apiKey) {
      return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">{webhook.apiKey.name}</Badge>;
    }
    return <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50"><Globe className="h-3 w-3 mr-1" />Global</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
          <p className="text-muted-foreground">Manage your webhook endpoints and delivery settings</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhooks</h1>
          <p className="text-muted-foreground">Manage your webhook endpoints and delivery settings</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-webhook">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Endpoints
            <Badge variant="outline" className="ml-2">{webhooks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first webhook to receive real-time notifications
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-webhook">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{webhook.name}</div>
                            {!webhook.isActive && (
                              <div className="text-xs text-muted-foreground">Inactive</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.eventTypes.map((eventType) => (
                            <Badge key={eventType} variant="secondary" className="text-xs">
                              {EVENT_TYPES.find(et => et.value === eventType)?.label || eventType}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-mono text-xs truncate" title={webhook.url}>
                            {webhook.url}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getScopeBadge(webhook)}</TableCell>
                      <TableCell>{getStatusBadge(webhook)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {webhook._count?.deliveries || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {webhook.lastDelivery ? 
                            formatDistanceToNow(new Date(webhook.lastDelivery.createdAt), { addSuffix: true }) :
                            'Never'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(webhook)}
                            data-testid={`button-edit-webhook-${webhook.id}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingWebhook(webhook)}
                            data-testid={`button-delete-webhook-${webhook.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Webhook Dialog */}
      <Dialog open={isCreateDialogOpen || editingWebhook !== null} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
            </DialogTitle>
            <DialogDescription>
              {editingWebhook ? 'Update your webhook configuration' : 'Configure a new webhook endpoint to receive events'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My webhook endpoint" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventTypes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Event Types</FormLabel>
                      <FormDescription>
                        Select one or more event types for this webhook
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {EVENT_TYPES.map((eventType) => (
                          <div key={eventType.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={eventType.value}
                              checked={field.value?.includes(eventType.value) || false}
                              onChange={(e) => {
                                const currentValues = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...currentValues, eventType.value]);
                                } else {
                                  field.onChange(currentValues.filter((v) => v !== eventType.value));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label 
                              htmlFor={eventType.value}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {eventType.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-domain.com/webhooks" {...field} />
                    </FormControl>
                    <FormDescription>
                      The endpoint where webhook events will be delivered
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} data-testid="select-webhook-scope">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select webhook scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">Global - All events</SelectItem>
                        <SelectItem value="agent">Agent - Specific agent events</SelectItem>
                        <SelectItem value="apiKey">API Key - Specific API key events</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the scope for this webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedScope === 'agent' && (
                <FormField
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} data-testid="select-webhook-agent">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select agent" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This webhook will only receive events from this agent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchedScope === 'apiKey' && (
                <FormField
                  control={form.control}
                  name="apiKeyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} data-testid="select-webhook-apikey">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select API key" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {apiKeys.map((key) => (
                            <SelectItem key={key.id} value={key.id}>
                              {key.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This webhook will only receive events from this API key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormItem>
                <FormLabel>Secret (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={editingWebhook ? "Enter new secret to update" : "webhook_secret_123"} 
                    type="password" 
                    value={secretToUpdate}
                    onChange={(e) => setSecretToUpdate(e.target.value)}
                    data-testid="input-webhook-secret"
                  />
                </FormControl>
                <FormDescription>
                  {editingWebhook ? 
                    "Leave empty to keep existing secret, or enter new secret to update" :
                    "Used to verify webhook signatures for security"
                  }
                </FormDescription>
              </FormItem>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (ms)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1000}
                          max={30000}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 5000)}
                          data-testid="input-webhook-timeout"
                        />
                      </FormControl>
                      <FormDescription>
                        Request timeout (1-30 seconds)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retryLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Retries</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 7)}
                          data-testid="input-webhook-retry-limit"
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum retry attempts (1-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable this webhook to receive events
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="disableOnFailure"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-disable on failure</FormLabel>
                        <FormDescription>
                          Automatically disable webhook after max retries exceeded
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-webhook"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {editingWebhook ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingWebhook ? 'Update Webhook' : 'Create Webhook'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingWebhook !== null} onOpenChange={() => setDeletingWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingWebhook?.name}"? This action cannot be undone and will stop all future deliveries to this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWebhook && deleteMutation.mutate(deletingWebhook.id)}
              disabled={deleteMutation.isPending}
            >
              Delete Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}