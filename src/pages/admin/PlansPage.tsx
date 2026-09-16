import React, { useState, useEffect } from "react";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanAnalytics,
} from "@/api/admin";
import { AdminPlan, PlanAnalytics } from "@/types/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit,
  Users,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  CreditCard,
  BarChart3,
  RefreshCw,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<PlanAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("30");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await getPlans();
      console.log("data", data);
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPlans(data);
      } else {
        console.error("Plans data is not an array:", data);
        setPlans([]);
        toast({
          title: "Invalid data format",
          description: "Received invalid plans data from server",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlans([]);
      toast({
        title: "Failed to load plans",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  // helper: accepts amount in paise (e.g. 19900) and returns formatted INR string (e.g. "₹199")
  const formatRupees = (paise: number | undefined | null) => {
    const amount = Number(paise || 0) / 100;
    // show no decimals for whole rupee amounts, otherwise up to 2 decimals
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      let from: string | undefined;
      let to: string | undefined;

      if (dateRange === "custom") {
        from = customFrom;
        to = customTo;
      } else {
        const days = parseInt(dateRange);
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        from = fromDate.toISOString().split("T")[0];
        to = new Date().toISOString().split("T")[0];
      }

      const data = await getPlanAnalytics(from, to);
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      toast({
        title: "Failed to load analytics",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, customFrom, customTo]);

  const handleCreatePlan = async (formData: FormData) => {
    try {
      const planData = {
        name: formData.get("name") as string,
        cashfreePlanId: formData.get("cashfreePlanId") as string,
        // User inputs rupees; convert to paise for backend storage
        price: Math.round(Number(formData.get("price")) * 100),
        durationMonths: Number(formData.get("durationMonths")),
        features: (formData.get("features") as string)
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
      };

      await createPlan(planData);
      toast({ title: "Plan created successfully" });
      setIsCreateModalOpen(false);
      fetchPlans();
    } catch (error) {
      toast({
        title: "Failed to create plan",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async (formData: FormData) => {
    if (!editingPlan) return;

    try {
      const planData = {
        name: formData.get("name") as string,
        cashfreePlanId: formData.get("cashfreePlanId") as string,
        price: Number(formData.get("price")),
        durationMonths: Number(formData.get("durationMonths")),
        features: (formData.get("features") as string)
          .split("\n")
          .filter((f) => f.trim()),
      };

      await updatePlan(editingPlan._id, planData);
      toast({ title: "Plan updated successfully" });
      setIsEditModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      toast({
        title: "Failed to update plan",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this plan? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deletePlan(planId);
      toast({ title: "Plan deleted successfully" });
      fetchPlans();
    } catch (error) {
      toast({
        title: "Failed to delete plan",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const PlanForm: React.FC<{
    plan?: AdminPlan;
    onSubmit: (formData: FormData) => void;
  }> = ({ plan, onSubmit }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit(formData);
      }}
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={plan?.name}
            required
            placeholder="e.g., Pro Monthly"
          />
        </div>

        <div>
          <Label htmlFor="cashfreePlanId">Cashfree Plan ID</Label>
          <Input
            id="cashfreePlanId"
            name="cashfreePlanId"
            defaultValue={plan?.cashfreePlanId}
            required
            placeholder="CF plan identifier"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price(₹ in paise) </Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              // Show rupees in the form (convert paise -> rupees for existing plan)
              defaultValue={plan ? String(plan.price ?? 0) : ""}
              required
              placeholder="19900 (199.00)"
            />
          </div>

          <div>
            <Label htmlFor="durationMonths">Duration (Months)</Label>
            <Input
              id="durationMonths"
              name="durationMonths"
              type="number"
              defaultValue={plan?.durationMonths}
              required
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="features">Features (one per line)</Label>
          <Textarea
            id="features"
            name="features"
            defaultValue={plan?.features?.join("\n")}
            placeholder="Unlimited resumes&#10;ATS optimization&#10;Priority support"
            rows={5}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" className="btn-primary">
            {plan ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans and pricing
          </p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Plan</DialogTitle>
            </DialogHeader>
            <PlanForm onSubmit={handleCreatePlan} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan._id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{plan.name}</span>
                      <Badge variant="outline">{plan.durationMonths}M</Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-1">
                      <IndianRupee className="h-4 w-4" />
                      <span className="text-2xl font-bold">
                        {formatRupees(plan.price)}
                      </span>
                      <span>
                        / {plan.durationMonths} month
                        {plan.durationMonths > 1 ? "s" : ""}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {plan.activeSubscriptions}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <strong>Cashfree ID:</strong> {plan.cashfreePlanId}
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Features:</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Dialog
                      open={isEditModalOpen && editingPlan?._id === plan._id}
                      onOpenChange={setIsEditModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPlan(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Plan</DialogTitle>
                        </DialogHeader>
                        <PlanForm
                          plan={editingPlan || undefined}
                          onSubmit={handleUpdatePlan}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(plan._id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No plans found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first plan to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analytics Section */}
      <div className="space-y-6 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-mono font-bold tracking-tight">
              Plan Analytics
            </h2>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into subscription performance
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={fetchAnalytics}
              size="sm"
              variant="outline"
              disabled={analyticsLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {dateRange === "custom" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="from">From</Label>
                  <Input
                    id="from"
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analyticsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : analytics ? (
          <>
            {/* Summary Metrics */}
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatRupees(analytics.summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {analytics.summary.totalTransactions} transactions
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Sum of all successful payment transactions (status:
                          'paid') within the selected date range. Calculated
                          from UserTransaction model where amount is summed for
                          all paid transactions.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Monthly Recurring Revenue
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatRupees(analytics.summary.mrr)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      MRR from active subscriptions
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Sum of all active subscription plan prices. Calculated
                          by aggregating all users with 'active' subscription
                          status and summing their plan prices from the Plan
                          model.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Subscriptions
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.summary.totalActiveSubscriptions}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Currently active users
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Total count of users with active subscription status
                          ('userSubscription.status': 'active'). This includes
                          all currently active subscriptions regardless of the
                          selected date range.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Churn Rate
                    </CardTitle>
                    {analytics.summary.churnRate > 5 ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <Activity className="h-4 w-4 text-green-500" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.summary.churnRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Subscription cancellation rate
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Percentage of active subscriptions that were cancelled
                          within the selected date range. Formula: (Cancelled
                          subscriptions in period / Active subscriptions at
                          start of period) × 100.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg Subscription Value
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatRupees(analytics.summary.avgSubscriptionValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average revenue per subscription
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Average revenue per subscription transaction within
                          the selected date range. Calculated as: Total Revenue
                          / Total Number of Transactions.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Lifetime Value (LTV)
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatRupees(analytics.summary.ltv)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated customer lifetime value
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Estimated customer lifetime value. Calculated as:
                          Average Subscription Value × Average Months Subscribed
                          (currently estimated at 3 months). This is a
                          simplified calculation and may be refined with actual
                          customer tenure data.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Payment Success Rate
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.summary.paymentSuccessRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successful payment transactions
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Percentage of successful payment transactions within
                          the selected date range. Formula: (Successful
                          transactions with status 'paid' / Total transactions)
                          × 100.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>

                <Card className="relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Transactions
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.summary.totalTransactions}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Successful payments in period
                    </p>
                  </CardContent>
                  <div className="absolute bottom-3 right-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs" side="top">
                        <p>
                          Total count of successful payment transactions
                          (status: 'paid') within the selected date range. This
                          represents the number of completed subscription
                          payments.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>
              </div>
            </TooltipProvider>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                  <CardDescription>
                    Daily revenue trend in selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.revenueOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value: any) => formatRupees(Number(value))}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* New Subscriptions Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>New Subscriptions</CardTitle>
                  <CardDescription>Daily subscription growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.newSubscriptionsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="count"
                        fill="#82ca9d"
                        name="New Subscriptions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Plan Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Plan Performance</CardTitle>
                  <CardDescription>Revenue by plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.planPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="planName" />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value: any) => formatRupees(Number(value))}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subscription Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>
                    Distribution by subscription status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.subscriptionStatusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.status}: ${entry.count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.subscriptionStatusDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  "#0088FE",
                                  "#00C49F",
                                  "#FFBB28",
                                  "#FF8042",
                                  "#8884d8",
                                ][index % 5]
                              }
                            />
                          )
                        )}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Plans</CardTitle>
                <CardDescription>
                  Plans ranked by revenue generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPlans.map((plan, index) => (
                    <div
                      key={plan.planId}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{plan.planName}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.activeSubscriptions} active subscribers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatRupees(plan.revenue)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {plan.transactions} transactions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                No analytics data available
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlansPage;
