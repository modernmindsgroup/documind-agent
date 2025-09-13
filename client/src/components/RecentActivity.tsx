import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Workflow, Phone, MessageSquare, Activity } from "lucide-react";
import { RecentActivity as ActivityType } from "@shared/schema";

interface RecentActivityProps {
  activities?: ActivityType[];
  isLoading?: boolean;
  error?: Error | null;
}

const activityIcons = {
  agent_created: Bot,
  workflow_updated: Workflow,
  call_completed: Phone,
  chat_ended: MessageSquare,
};

const activityColors = {
  agent_created: "bg-blue-500",
  workflow_updated: "bg-purple-500",
  call_completed: "bg-green-500",
  chat_ended: "bg-orange-500",
};

export function RecentActivity({ activities, isLoading, error }: RecentActivityProps) {
  return (
    <Card data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
              <p className="text-destructive font-medium">Failed to load recent activity</p>
              <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
            </div>
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : !activities || activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as you use the platform</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 hover-elevate rounded-lg p-3 -m-3"
                  data-testid={`activity-${activity.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={activityColors[activity.type]}>
                      <Icon className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" data-testid={`activity-title-${activity.id}`}>
                        {activity.title}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {activity.timestamp}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {activity.user}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}