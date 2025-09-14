import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Key, 
  Globe, 
  Shield,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ApiKey {
  id: string;
  name: string;
  keyType: 'private' | 'public';
  keyValue: string;
  maskedValue: string;
  origins?: string[];
  assistants?: string[];
  transientAssistants: boolean;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  keyType: z.enum(['private', 'public']),
  origins: z.array(z.string().url('Please enter valid URLs')).optional(),
  assistants: z.array(z.string()).optional(),
  transientAssistants: z.boolean().default(false),
});

type CreateApiKeyForm = z.infer<typeof createApiKeySchema>;

export default function ApiKeysPage() {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/api-keys'],
  });

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: (data: CreateApiKeyForm) => apiRequest('POST', '/api/api-keys', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setCreateModalOpen(false);
      toast({
        title: 'Success',
        description: 'API key created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API key',
        variant: 'destructive',
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/api-keys'] });
      setDeleteKeyId(null);
      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<CreateApiKeyForm>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
      keyType: 'private',
      origins: [],
      assistants: [],
      transientAssistants: false,
    },
  });

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: CreateApiKeyForm) => {
    createApiKeyMutation.mutate(data);
  };

  const privateKeys = apiKeys?.filter(key => key.keyType === 'private') || [];
  const publicKeys = apiKeys?.filter(key => key.keyType === 'public') || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Manage your API keys for integration</p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-api-keys-title">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for backend and frontend integration
          </p>
        </div>
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-api-key">
              <Plus className="h-4 w-4 mr-2" />
              Add Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for your application integration.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My API Key" {...field} data-testid="input-api-key-name" />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this API key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-api-key-type">
                            <SelectValue placeholder="Select key type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="private">Private Key (Backend)</SelectItem>
                          <SelectItem value="public">Public Key (Frontend)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Private keys for backend, public keys for frontend SDK
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('keyType') === 'public' && (
                  <>
                    <FormField
                      control={form.control}
                      name="transientAssistants"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Transient Assistants</FormLabel>
                            <FormDescription>
                              Allow creating temporary assistants
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-transient-assistants"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateModalOpen(false)}
                    data-testid="button-cancel-api-key"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createApiKeyMutation.isPending}
                    data-testid="button-create-api-key"
                  >
                    {createApiKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Private API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Private API Keys
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use these keys for interacting with our APIs in your backend systems.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {privateKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No private API keys created yet</p>
              <p className="text-sm">Create your first private key to get started</p>
            </div>
          ) : (
            privateKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium" data-testid={`text-private-key-name-${key.id}`}>{key.name}</h3>
                    <Badge variant={key.isActive ? 'default' : 'secondary'}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono" data-testid={`text-private-key-value-${key.id}`}>
                      {visibleKeys.has(key.id) ? key.keyValue : key.maskedValue}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleKeyVisibility(key.id)}
                    data-testid={`button-toggle-private-key-${key.id}`}
                  >
                    {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(key.keyValue, 'Private API key')}
                    data-testid={`button-copy-private-key-${key.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteKeyId(key.id)}
                    data-testid={`button-delete-private-key-${key.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Public API Keys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Public API Keys
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use these keys for interacting with Vapi Client SDKs (e.g. from your frontend).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {publicKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No public API keys created yet</p>
              <p className="text-sm">Create your first public key to get started</p>
            </div>
          ) : (
            publicKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium" data-testid={`text-public-key-name-${key.id}`}>{key.name}</h3>
                    <Badge variant={key.isActive ? 'default' : 'secondary'}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {key.transientAssistants && (
                      <Badge variant="outline">Transient Assistants</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono" data-testid={`text-public-key-value-${key.id}`}>
                      {visibleKeys.has(key.id) ? key.keyValue : key.maskedValue}
                    </code>
                  </div>
                  {key.origins && key.origins.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Allowed Origins:</p>
                      <div className="flex flex-wrap gap-1">
                        {key.origins.map((origin, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {origin}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` • Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleKeyVisibility(key.id)}
                    data-testid={`button-toggle-public-key-${key.id}`}
                  >
                    {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(key.keyValue, 'Public API key')}
                    data-testid={`button-copy-public-key-${key.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteKeyId(key.id)}
                    data-testid={`button-delete-public-key-${key.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={(open) => !open && setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This action cannot be undone and will immediately revoke access for any applications using this key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-api-key">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && deleteApiKeyMutation.mutate(deleteKeyId)}
              disabled={deleteApiKeyMutation.isPending}
              data-testid="button-confirm-delete-api-key"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteApiKeyMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}