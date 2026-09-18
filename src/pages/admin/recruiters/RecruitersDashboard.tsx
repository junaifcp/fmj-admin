import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, LayoutDashboard } from "lucide-react";

const RecruitersDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          Recruiter Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of recruiter activities and performance metrics
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Recruiter Dashboard</strong> data will be displayed after team
          discussion.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            This dashboard will provide detailed insights into recruiter
            activities and job posting metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Dashboard components and data visualizations will be implemented
                following team discussion on requirements and key metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planned Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Recruiter activity metrics</li>
              <li>• Job posting analytics</li>
              <li>• Subscription trends</li>
              <li>• Application statistics</li>
              <li>• Performance indicators</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Active recruiters</li>
              <li>• New registrations</li>
              <li>• Job posts created</li>
              <li>• Applications received</li>
              <li>• Plan conversions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visualizations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Time-series charts</li>
              <li>• Distribution graphs</li>
              <li>• Conversion funnels</li>
              <li>• Activity heatmaps</li>
              <li>• KPI dashboards</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruitersDashboard;
