import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Workflow, Phone, MessageSquare, DollarSign, Clock } from "lucide-react";
import { DashboardMetrics as MetricsType } from "@/lib/types";

interface DashboardMetricsProps {
  metrics: MetricsType;
  isLoading?: boolean;
}

const metricCards = [
  {
    title: "Total Agents",
    icon: Bot,
    key: "totalAgents" as keyof MetricsType,
    format: (value: number) => value.toString(),
    color: "text-blue-600",
  },
  {
    title: "Workflows",
    icon: Workflow,
    key: "totalWorkflows" as keyof MetricsType,
    format: (value: number) => value.toString(),
    color: "text-purple-600",
  },
  {
    title: "Total Calls",
    icon: Phone,
    key: "totalCalls" as keyof MetricsType,
    format: (value: number) => value.toLocaleString(),
    color: "text-green-600",
  },
  {
    title: "Total Chats",
    icon: MessageSquare,
    key: "totalChats" as keyof MetricsType,
    format: (value: number) => value.toLocaleString(),
    color: "text-orange-600",
  },
  {
    title: "Monthly Cost",
    icon: DollarSign,
    key: "monthlyCallCost" as keyof MetricsType,
    format: (value: number) => `$${(value / 100).toFixed(2)}`,
    color: "text-red-600",
  },
  {
    title: "Call Minutes",
    icon: Clock,
    key: "monthlyCallMinutes" as keyof MetricsType,
    format: (value: number) => `${Math.floor(value / 60)}h ${value % 60}m`,
    color: "text-indigo-600",
  },
];

export function DashboardMetrics({ metrics, isLoading }: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metricCards.map((card) => {
        const Icon = card.icon;
        const value = metrics[card.key] as number;
        
        return (
          <Card key={card.title} className="hover-elevate" data-testid={`card-metric-${card.key}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`value-${card.key}`}>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  card.format(value)
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}