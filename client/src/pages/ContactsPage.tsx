import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  lastContact?: string;
  source: string;
  tags?: string[];
  location?: string;
  createdAt: string;
  totalInteractions: number;
}

interface ContactStats {
  total: number;
  newThisMonth: number;
  active: number;
  activePercentage: string;
  recentActivity: number;
  avgInteractions: number;
}

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch contacts data - build query params for the API
  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);
  if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
  if (sourceFilter && sourceFilter !== 'all') params.append('source', sourceFilter);
  
  const { data: contacts, isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: [`/api/contacts?${params.toString()}`],
  });

  // Fetch summary stats
  const { data: stats } = useQuery<ContactStats>({
    queryKey: ['/api/contacts/stats'],
  });

  // Filter contacts based on search and filters
  const filteredContacts = contacts?.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || contact.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'website':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'chat':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'api':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'import':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-contacts-title">Contacts</h1>
          <p className="text-muted-foreground">
            Manage and view your registered contacts
          </p>
        </div>
        <Button data-testid="button-add-contact">
          <Users className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-contacts">
              {contactsLoading ? '...' : stats?.total ?? filteredContacts?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newThisMonth ?? 0} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-contacts">
              {stats?.active ?? filteredContacts?.filter(c => c.status === 'active').length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.activePercentage ?? '0'}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-recent-activity">
              {stats?.recentActivity ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Contacts active in last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-interactions">
              {stats?.avgInteractions ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per contact this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-contacts"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-source-filter">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="import">Import</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSourceFilter('all');
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contact Directory</span>
            <Badge variant="secondary" data-testid="badge-contact-count">
              {filteredContacts?.length || 0} contacts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contactsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading contacts...</p>
            </div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  className="border rounded-lg p-4 hover-elevate transition-colors"
                  data-testid={`contact-card-${contact.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" data-testid={`text-contact-name-${contact.id}`}>
                          {contact.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{contact.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right text-sm">
                        <p className="font-medium">{contact.totalInteractions} interactions</p>
                        <p className="text-muted-foreground">
                          {contact.lastContact ? `Last: ${new Date(contact.lastContact).toLocaleDateString()}` : 'No recent contact'}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                        <Badge variant="outline" className={getSourceColor(contact.source)}>
                          {contact.source}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start by adding your first contact'}
              </p>
              <Button variant="outline" data-testid="button-clear-search">
                Clear Search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}