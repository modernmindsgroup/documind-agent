import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentActivity } from "@/components/RecentActivity";
import { QuickActions } from "@/components/QuickActions";
import AgentsPage from "@/pages/AgentsPage";
import WorkflowsPage from "@/pages/WorkflowsPage";
import { CallLogs } from "@/components/CallLogs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  Filter,
  Plus,
  Calendar,
  File
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DashboardMetrics as DashboardMetricsType, RecentActivity as RecentActivityType } from "@shared/schema";
// All mock data imports removed - using real API data
// TODO: remove mock functionality - replace with actual user avatar
const avatarImage = "/api/placeholder/32/32";

export type ViewMode = 'dashboard' | 'agents' | 'workflows' | 'call-logs' | 'chat-logs' | 'webhook-logs' | 'knowledge' | 'webhooks' | 'api-keys';

interface DashboardProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function Dashboard({ currentView, onViewChange }: DashboardProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // State for Knowledge Base
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  
  // Fetch real dashboard metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<DashboardMetricsType>({
    queryKey: ['/api/dashboard/metrics'],
    enabled: !!user?.tenantId,
  });

  // Fetch real recent activity
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery<RecentActivityType[]>({
    queryKey: ['/api/dashboard/recent-activity'],
    enabled: !!user?.tenantId,
  });

  // Fetch all documents for Knowledge Base
  const { data: allDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<{
    documents: Array<{
      id: string;
      name: string;
      description: string | null;
      mimeType: string;
      size: number;
      uploadedBy: string;
      createdAt: string;
      storageKey: string;
    }>;
    total: number;
  }>({
    queryKey: ['/api/documents', { search: searchQuery, mimeType: filterType !== 'all' ? filterType : undefined }],
    enabled: currentView === 'knowledge',
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting document",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const getTenantName = () => {
    // For now, we'll show tenant ID until we fetch tenant data
    return user?.tenantId?.substring(0, 8) || 'Unknown';
  };
  const renderContent = () => {
    switch (currentView) {
      case 'agents':
        return <AgentsPage />;
      case 'workflows':
        return <WorkflowsPage />;
      case 'call-logs':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Call Logs</h2>
            <p className="text-muted-foreground">Call logs interface would be implemented here with real data</p>
          </div>
        );
      case 'chat-logs':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Chat Logs</h2>
            <p className="text-muted-foreground">Chat monitoring interface would be implemented here</p>
          </div>
        );
      case 'webhook-logs':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Webhook Logs</h2>
            <p className="text-muted-foreground">Webhook monitoring interface would be implemented here</p>
          </div>
        );
      case 'knowledge':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
                <p className="text-muted-foreground">
                  Manage your organization's documents and knowledge assets.
                </p>
              </div>
              <Button 
                data-testid="button-upload-document" 
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      data-testid="input-search-knowledge"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-48" data-testid="select-filter-type">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="application/pdf">PDF</SelectItem>
                        <SelectItem value="text/plain">Text</SelectItem>
                        <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word</SelectItem>
                        <SelectItem value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel</SelectItem>
                        <SelectItem value="text/csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-total-documents">
                        {allDocuments?.total || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-recent-uploads">
                        {allDocuments?.documents?.filter(doc => 
                          new Date(doc.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ).length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Recent Uploads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-total-size">
                        {allDocuments?.documents ? 
                          (allDocuments.documents.reduce((acc, doc) => acc + doc.size, 0) / (1024 * 1024)).toFixed(1) 
                          : 0
                        } MB
                      </p>
                      <p className="text-sm text-muted-foreground">Total Size</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-unique-uploaders">
                        {allDocuments?.documents ? 
                          new Set(allDocuments.documents.map(doc => doc.uploadedBy)).size 
                          : 0
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">Contributors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  All documents in your knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {documentsLoading ? (
                  <div className="space-y-3 p-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : allDocuments?.documents?.length ? (
                  <div className="divide-y">
                    {allDocuments.documents.map((doc, index) => (
                      <div key={doc.id} className="p-6 hover-elevate" data-testid={`row-document-${doc.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-foreground truncate" data-testid={`text-doc-name-${doc.id}`}>
                                {doc.name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span data-testid={`text-doc-type-${doc.id}`}>{doc.mimeType}</span>
                                <span>•</span>
                                <span data-testid={`text-doc-size-${doc.id}`}>
                                  {(doc.size / 1024).toFixed(1)} KB
                                </span>
                                <span>•</span>
                                <span data-testid={`text-doc-date-${doc.id}`}>
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span data-testid={`text-doc-uploader-${doc.id}`}>
                                  by {doc.uploadedBy}
                                </span>
                              </div>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground truncate mt-1" data-testid={`text-doc-description-${doc.id}`}>
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
                              data-testid={`button-download-doc-${doc.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteDocumentMutation.mutate(doc.id)}
                              disabled={deleteDocumentMutation.isPending}
                              data-testid={`button-delete-doc-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h4 className="font-medium text-foreground mb-2" data-testid="text-no-documents-knowledge">
                      No documents found
                    </h4>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      {searchQuery || filterType !== 'all' 
                        ? "Try adjusting your search or filter criteria."
                        : "Get started by uploading your first document to the knowledge base."
                      }
                    </p>
                    {!searchQuery && filterType === 'all' && (
                      <Button 
                        className="flex items-center gap-2"
                        data-testid="button-upload-first-doc"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Your First Document
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'webhooks':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Webhooks</h2>
            <p className="text-muted-foreground">Webhook configuration interface would be implemented here</p>
          </div>
        );
      case 'api-keys':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">API Keys</h2>
            <p className="text-muted-foreground">API key management interface would be implemented here</p>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Martin</h1>
              <p className="text-muted-foreground">
                Manage your voice and chat AI agents, workflows, and monitoring all in one place.
              </p>
            </div>
            
            <DashboardMetrics 
              metrics={metrics} 
              isLoading={metricsLoading}
              error={metricsError}
            />
            
            <div className="grid gap-8 lg:grid-cols-2">
              <QuickActions />
              <RecentActivity 
                activities={recentActivity} 
                isLoading={activityLoading}
                error={activityError}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between p-6 border-b bg-card/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {user?.role === 'super_admin' ? 'Super Admin' : `Tenant: ${getTenantName()}`}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="hover-elevate"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
          </Button>
          
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full hover-elevate"
                data-testid="button-user-menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarImage} alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {renderContent()}
      </main>
    </div>
  );
}