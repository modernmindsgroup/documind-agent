import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  PhoneCall, 
  Search, 
  Filter, 
  Play, 
  FileText, 
  Clock,
  Phone,
  User,
  Zap
} from "lucide-react";

interface CallLog {
  id: string;
  tenantId: string;
  agentId: string;
  callId: string;
  fromNumber?: string;
  toNumber?: string;
  type: 'inbound' | 'outbound';
  status: 'completed' | 'failed' | 'transferred' | 'no_answer';
  duration?: number;
  cost?: number;
  transcript?: string;
  recording?: string;
  analysis?: any;
  reason?: string;
  evaluation?: string;
  startTime?: string;
  endTime?: string;
}

interface CallLogsResponse {
  logs: CallLog[];
  total: number;
}

export default function CallsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch calls from API
  const { data: callsData, isLoading, error } = useQuery<CallLogsResponse>({
    queryKey: ['/api/call-logs'],
  });

  const calls = callsData?.logs || [];

  const filteredCalls = calls.filter((call: CallLog) => {
    const matchesStatus = statusFilter === "all" || call.status === statusFilter;
    const matchesSearch = 
      call.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.agentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'transferred':
        return <Badge variant="secondary">Transferred</Badge>;
      case 'no_answer':
        return <Badge variant="outline">No Answer</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDirectionIcon = (type: string) => {
    return type === 'inbound' ? 
      <Phone className="h-4 w-4 text-green-600" /> : 
      <Phone className="h-4 w-4 text-blue-600 rotate-180" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Calls</h2>
            <p className="text-muted-foreground">Manage active and recent voice calls</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading calls...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Calls</h2>
            <p className="text-muted-foreground">Manage active and recent voice calls</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">Error loading calls. Please try again.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Calls</h2>
          <p className="text-muted-foreground">Manage active and recent voice calls</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="hover-elevate" 
            data-testid="button-refresh-calls"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/call-logs'] });
              toast({
                title: "Refreshed",
                description: "Call data has been refreshed.",
              });
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search call ID, agent, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-call-search"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-call-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Voice Calls ({filteredCalls.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No calls found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your filters to see more calls."
                  : "No voice calls have been made yet. Calls will appear here once customers start using your voice agents."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call: CallLog) => (
                    <TableRow key={call.id} data-testid={`row-call-${call.id}`}>
                      <TableCell className="font-mono text-sm">
                        {call.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(call.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(call.type)}
                          <span className="capitalize">{call.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {call.agentId ? (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span className="font-mono text-sm">{call.agentId.slice(0, 8)}...</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{call.fromNumber || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{call.toNumber || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{formatTime(call.startTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {call.status === 'completed' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover-elevate"
                                data-testid={`button-play-${call.id}`}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover-elevate"
                                data-testid={`button-transcript-${call.id}`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
    </div>
  );
}