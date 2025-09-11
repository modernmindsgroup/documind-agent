import { useState } from "react";
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
  Phone, 
  Search, 
  Download, 
  Filter,
  PlayCircle,
  FileText,
  DollarSign,
  Clock
} from "lucide-react";

interface CallLogEntry {
  id: string;
  callId: string;
  agent: string;
  fromNumber: string;
  toNumber: string;
  type: 'inbound' | 'outbound';
  status: 'completed' | 'failed' | 'transferred' | 'no_answer';
  reason: string;
  evaluation: string;
  startTime: string;
  duration: number;
  cost: number;
}

interface CallLogsProps {
  logs: CallLogEntry[];
}

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  transferred: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  no_answer: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

const evaluationColors = {
  excellent: "text-green-600",
  good: "text-blue-600",
  poor: "text-red-600",
};

export function CallLogs({ logs }: CallLogsProps) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.status === filter;
    const matchesSearch = 
      log.callId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.fromNumber.includes(searchTerm) ||
      log.toNumber.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Call Logs</h2>
          <p className="text-muted-foreground">Monitor and analyze all voice interactions</p>
        </div>
        <Button 
          variant="outline"
          className="hover-elevate"
          data-testid="button-export-calls"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
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
                  placeholder="Search call ID, agent, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-call-search"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48" data-testid="select-call-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>From/To</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Evaluation</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No call logs found</p>
                        <p className="text-sm">Call logs will appear here as agents make calls</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="hover-elevate"
                      data-testid={`row-call-${log.id}`}
                    >
                      <TableCell className="font-mono text-sm">
                        {log.callId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.agent}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.fromNumber}</div>
                          <div className="text-muted-foreground">{log.toNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={statusColors[log.status]}
                          variant="secondary"
                        >
                          {log.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-48 truncate">
                        {log.reason}
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`font-medium ${
                            evaluationColors[log.evaluation.toLowerCase() as keyof typeof evaluationColors] || 'text-muted-foreground'
                          }`}
                        >
                          {log.evaluation}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(log.duration)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(log.cost)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover-elevate"
                            data-testid={`button-play-${log.id}`}
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover-elevate"
                            data-testid={`button-transcript-${log.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}