import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  Search, 
  Filter,
  Eye,
  Calendar,
  Clock,
  Globe,
  FileText,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CallLog } from "@shared/schema";

interface CallLogsPageProps {}

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  transferred: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  no_answer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const typeColors = {
  inbound: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  outbound: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  api: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  webhook: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

interface LogDetailSheetProps {
  log: CallLog | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function LogDetailSheet({ log, isOpen, onOpenChange }: LogDetailSheetProps) {
  if (!log) return null;

  const formatHeaders = (headers: any) => {
    if (!headers) return "{}";
    return JSON.stringify(headers, null, 2);
  };

  const formatDuration = (startedAt: string | null, finishedAt: string | null) => {
    if (!startedAt || !finishedAt) return "N/A";
    const start = new Date(startedAt);
    const end = new Date(finishedAt);
    return ((end.getTime() - start.getTime()) / 1000).toFixed(2);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full overflow-y-auto" data-testid="sheet-call-log-detail">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Log Details
          </SheetTitle>
          <SheetDescription>
            Comprehensive details for call ID: {log.callId}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="request" data-testid="tab-request">Request</TabsTrigger>
              <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
              <TabsTrigger value="miscellaneous" data-testid="tab-miscellaneous">Miscellaneous</TabsTrigger>
            </TabsList>
            
            <TabsContent value="request" className="mt-6 space-y-4" data-testid="content-request">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Started At</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-started-at">
                      {log.startedAt ? new Date(log.startedAt).toISOString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Finished At</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-finished-at">
                      {log.finishedAt ? new Date(log.finishedAt).toISOString() : "N/A"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration (seconds)</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-duration">
                    {formatDuration(log.startedAt, log.finishedAt)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all" data-testid="text-url">
                    {log.url || "N/A"}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Path</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-path">
                      {log.path || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Method</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-method">
                      {log.method || "N/A"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Query Parameters</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-query">
                    {log.query || "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Origin</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-origin">
                    {log.origin || "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Headers</label>
                  <pre className="text-xs font-mono bg-muted p-3 rounded mt-1 overflow-auto max-h-40" data-testid="text-request-headers">
                    {formatHeaders(log.requestHeaders)}
                  </pre>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Body</label>
                  <pre className="text-xs font-mono bg-muted p-3 rounded mt-1 overflow-auto max-h-40" data-testid="text-request-body">
                    {log.requestBody || "N/A"}
                  </pre>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="response" className="mt-6 space-y-4" data-testid="content-response">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Response Code</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-response-code">
                    {log.responseCode || "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Response Headers</label>
                  <pre className="text-xs font-mono bg-muted p-3 rounded mt-1 overflow-auto max-h-40" data-testid="text-response-headers">
                    {formatHeaders(log.responseHeaders)}
                  </pre>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Response Body</label>
                  <pre className="text-xs font-mono bg-muted p-3 rounded mt-1 overflow-auto max-h-60" data-testid="text-response-body">
                    {log.responseBody || "N/A"}
                  </pre>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="miscellaneous" className="mt-6 space-y-4" data-testid="content-miscellaneous">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">From Number</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-from-number">
                      {log.fromNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">To Number</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-to-number">
                      {log.toNumber || "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Call Duration</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-call-duration">
                      {log.duration ? `${log.duration}s` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cost</label>
                    <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-cost">
                      {log.cost ? `$${(log.cost / 100).toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-reason">
                    {log.reason || "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Evaluation</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1" data-testid="text-evaluation">
                    {log.evaluation || "N/A"}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Transcript</label>
                  <pre className="text-xs font-mono bg-muted p-3 rounded mt-1 overflow-auto max-h-40" data-testid="text-transcript">
                    {log.transcript || "N/A"}
                  </pre>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Recording URL</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all" data-testid="text-recording">
                    {log.recording || "N/A"}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CallLogsPage({}: CallLogsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch call logs with real-time filtering
  const { data, isLoading, error } = useQuery<{ logs: CallLog[]; total: number }>({
    queryKey: ['/api/call-logs', { 
      search: searchQuery,
      status: statusFilter,
      type: typeFilter,
      limit: pageSize,
      offset: currentPage * pageSize 
    }],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const handleViewLog = (log: CallLog) => {
    setSelectedLog(log);
    setDetailSheetOpen(true);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "0.00";
    return duration.toFixed(2);
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-8 w-8" />
            Call Logs
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze all voice call interactions and API requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {data?.total || 0} total calls
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-call-logs"
                placeholder="Search by call ID, phone numbers, URL, or path..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40" data-testid="select-type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Call Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground/50 mb-4 mx-auto" />
              <h4 className="font-medium text-foreground mb-2">Error loading call logs</h4>
              <p className="text-sm text-muted-foreground">Please try refreshing the page.</p>
            </div>
          ) : data?.logs?.length ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="font-semibold">TIME</TableHead>
                      <TableHead className="font-semibold">TYPE</TableHead>
                      <TableHead className="font-semibold">REQUEST DURATION (SECONDS)</TableHead>
                      <TableHead className="font-semibold">REQUEST HTTP METHOD</TableHead>
                      <TableHead className="font-semibold">RESPONSE HTTP CODE</TableHead>
                      <TableHead className="font-semibold text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50" data-testid={`row-call-log-${log.id}`}>
                        <TableCell data-testid={`cell-time-${log.id}`}>
                          <div className="font-mono text-sm">
                            {formatTime(log.startedAt)}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`cell-type-${log.id}`}>
                          <Badge 
                            className={`text-xs ${typeColors[log.type as keyof typeof typeColors] || typeColors.inbound}`}
                            variant="secondary"
                          >
                            {log.type?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`cell-duration-${log.id}`}>
                          <div className="font-mono text-sm">
                            {formatDuration(log.duration)}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`cell-method-${log.id}`}>
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.method || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`cell-response-code-${log.id}`}>
                          <Badge 
                            variant="outline" 
                            className={`font-mono text-xs ${
                              log.responseCode && log.responseCode >= 200 && log.responseCode < 300 
                                ? "border-green-500 text-green-700 dark:text-green-300" 
                                : log.responseCode && log.responseCode >= 400
                                ? "border-red-500 text-red-700 dark:text-red-300"
                                : "border-muted-foreground"
                            }`}
                          >
                            {log.responseCode || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLog(log)}
                            className="h-8 px-3"
                            data-testid={`button-view-${log.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, data.total)} of {data.total} calls
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Phone className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h4 className="font-medium text-foreground mb-2" data-testid="text-no-call-logs">
                No call logs found
              </h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? "Try adjusting your search or filter criteria."
                  : "Call logs will appear here once your agents start handling calls."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Sheet */}
      <LogDetailSheet 
        log={selectedLog}
        isOpen={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </div>
  );
}