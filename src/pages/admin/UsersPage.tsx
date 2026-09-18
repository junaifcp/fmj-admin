import React, { useState, useEffect } from "react";
import {
  getUsers,
  deleteUser,
  exportUsersCSV,
  getCashfreeOrderDetails,
  activateUserPlan,
  getPlans,
} from "@/api/admin";
import { AdminUser, PaginationResponse, AdminPlan } from "@/types/admin";
import { Location } from "@/types/location";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { SuggestionInput } from "@/components/ui/suggestion-input";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<PaginationResponse<AdminUser> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<Location | null>(null);
  const [filterRadius, setFilterRadius] = useState<number>(50000); // Default 50km in meters
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [filterJobTitles, setFilterJobTitles] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Activate Plan Modal state
  const [isActivatePlanModalOpen, setIsActivatePlanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [cashfreeOrderId, setCashfreeOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState<any | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(false);
  const [orderCheckError, setOrderCheckError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<AdminPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [activationResult, setActivationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { toast } = useToast();

  const fetchUsers = async (
    page = 1,
    searchTerm = "",
    applyFilters = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Build filters object
      const filters: any = {};

      if (applyFilters) {
        if (filterLocation && filterLocation.lat && filterLocation.lng) {
          filters.location = {
            lat: filterLocation.lat,
            lng: filterLocation.lng,
            radius: filterRadius, // Use selected radius
          };
        }

        if (filterSkills.length > 0) {
          filters.skills = filterSkills;
        }

        if (filterJobTitles.length > 0) {
          filters.jobTitles = filterJobTitles;
        }

        if (filterDateFrom || filterDateTo) {
          filters.dateRange = {
            from: filterDateFrom,
            to: filterDateTo,
          };
        }
      }

      const data = await getUsers(
        page,
        20,
        searchTerm,
        Object.keys(filters).length > 0 ? filters : undefined
      );
      console.log("data", data);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers(1, search, hasActiveFilters);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, hasActiveFilters]);

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({ title: "User deleted successfully" });
      fetchUsers(currentPage, search, hasActiveFilters);
    } catch (error) {
      toast({
        title: "Failed to delete user",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportUsersCSV(selectedUsers);
      toast({
        title: "Export started",
        description: "Your CSV file will download shortly",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleActivatePlan = (user: AdminUser) => {
    setSelectedUser(user);
    setIsActivatePlanModalOpen(true);
    setCashfreeOrderId("");
    setOrderDetails(null);
    setOrderCheckError(null);
    setSelectedPlanId("");
    setActivationResult(null);
  };

  const handleCheckOrderStatus = async () => {
    if (!cashfreeOrderId.trim()) {
      toast({
        title: "Order ID required",
        description: "Please enter a Cashfree order ID",
        variant: "destructive",
      });
      return;
    }

    try {
      setCheckingOrder(true);
      setOrderDetails(null);
      setActivationResult(null);
      setOrderCheckError(null);

      const response = await getCashfreeOrderDetails(cashfreeOrderId.trim());
      setOrderDetails(response.order);

      // If order is paid, load available plans
      if (response.order.order_status?.toUpperCase() === "PAID") {
        const plans = await getPlans();
        setAvailablePlans(plans);
      }

      toast({
        title: "Order details retrieved",
        description: `Order status: ${response.order.order_status}`,
      });
    } catch (error: any) {
      // Extract error message from API response
      let errorMessage = "Something went wrong";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setOrderCheckError(errorMessage);

      toast({
        title: "Failed to fetch order details",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCheckingOrder(false);
    }
  };

  const handleActivateUserPlan = async () => {
    if (!selectedUser || !selectedPlanId || !cashfreeOrderId) {
      toast({
        title: "Missing information",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }

    try {
      setActivatingPlan(true);
      setActivationResult(null);

      const response = await activateUserPlan({
        userId: selectedUser._id,
        orderId: cashfreeOrderId.trim(),
        planId: selectedPlanId,
      });

      setActivationResult({
        success: true,
        message: response.message || "Plan activated successfully",
      });

      toast({
        title: "Success",
        description: "Plan activated successfully for the user",
      });

      // Refresh user list
      setTimeout(() => {
        fetchUsers(currentPage, search, hasActiveFilters);
        setIsActivatePlanModalOpen(false);
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate plan";
      setActivationResult({
        success: false,
        message: errorMessage,
      });

      toast({
        title: "Activation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActivatingPlan(false);
    }
  };

  const formatRupees = (paise: number) => {
    const amount = Number(paise || 0) / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  };

  // Filter handlers
  const handleApplyFilters = () => {
    setHasActiveFilters(true);
    setCurrentPage(1);
    fetchUsers(1, search, true);
    toast({
      title: "Filters applied",
      description: "User list updated with filters",
    });
  };

  const handleClearFilters = () => {
    setFilterLocation(null);
    setFilterRadius(50000); // Reset to default 50km
    setFilterSkills([]);
    setFilterJobTitles([]);
    setFilterDateFrom("");
    setFilterDateTo("");
    setHasActiveFilters(false);
    setCurrentPage(1);
    fetchUsers(1, search, false);
    toast({
      title: "Filters cleared",
      description: "Showing all users",
    });
  };

  const toggleFilterPanel = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">
          Users Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                {users
                  ? `${users.pagination.total} total users`
                  : "Loading users..."}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                onClick={() =>
                  fetchUsers(currentPage, search, hasActiveFilters)
                }
                size="sm"
                variant="outline"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={handleExportCSV}
                size="sm"
                variant="outline"
                disabled={selectedUsers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedUsers.length})
              </Button>
              <Button
                onClick={toggleFilterPanel}
                size="sm"
                variant={isFilterOpen ? "default" : "outline"}
                className={cn(
                  hasActiveFilters &&
                    !isFilterOpen &&
                    "border-primary text-primary"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1">
                    Active
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users?.data.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(
                              users?.data.map((u) => u._id) || []
                            );
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.data.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user._id]);
                            } else {
                              setSelectedUsers(
                                selectedUsers.filter((id) => id !== user._id)
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.firstName && (
                            <div className="text-sm text-muted-foreground">
                              {user.firstName} {user.lastName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.userSubscription &&
                        user.userSubscription.status !== "inactive" ? (
                          <div className="flex flex-col space-y-1">
                            <Badge
                              variant={
                                user.userSubscription.status === "active"
                                  ? "default"
                                  : user.userSubscription.status ===
                                    "initialized"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {user.userSubscription.status}
                            </Badge>
                            {user.userSubscription.endDate && (
                              <span className="text-xs text-muted-foreground">
                                Until{" "}
                                {new Date(
                                  user.userSubscription.endDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No Plan</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivatePlan(user)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Activate Plan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {users && users.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(users.pagination.page - 1) * 20 + 1} to{" "}
                    {Math.min(
                      users.pagination.page * 20,
                      users.pagination.total
                    )}{" "}
                    of {users.pagination.total} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchUsers(newPage, search, hasActiveFilters);
                      }}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {users.pagination.page} of{" "}
                      {users.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchUsers(newPage, search, hasActiveFilters);
                      }}
                      disabled={currentPage >= users.pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activate Plan Modal */}
      <Dialog
        open={isActivatePlanModalOpen}
        onOpenChange={setIsActivatePlanModalOpen}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activate Plan for User</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Activating plan for: <strong>{selectedUser.email}</strong>
                  {selectedUser.firstName && (
                    <>
                      {" "}
                      ({selectedUser.firstName} {selectedUser.lastName})
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Step 1: Enter Order ID */}
            <div className="space-y-2">
              <Label htmlFor="orderId">Cashfree Order ID</Label>
              <div className="flex space-x-2">
                <Input
                  id="orderId"
                  placeholder="Enter Cashfree order ID"
                  value={cashfreeOrderId}
                  onChange={(e) => {
                    setCashfreeOrderId(e.target.value);
                    setOrderCheckError(null);
                  }}
                  disabled={checkingOrder || !!orderDetails}
                />
                <Button
                  onClick={handleCheckOrderStatus}
                  disabled={checkingOrder || !cashfreeOrderId.trim()}
                >
                  {checkingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Status"
                  )}
                </Button>
              </div>
              {checkingOrder && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Fetching order details from Cashfree...</span>
                </div>
              )}
            </div>

            {/* Order Check Error */}
            {orderCheckError && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4" />
                    <span>{orderCheckError}</span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Step 2: Show Order Details */}
            {orderDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Order ID
                      </p>
                      <p className="text-sm">{orderDetails.order_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        CF Order ID
                      </p>
                      <p className="text-sm">{orderDetails.cf_order_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Amount
                      </p>
                      <p className="text-sm font-semibold">
                        ₹{orderDetails.order_amount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                      <Badge
                        variant={
                          orderDetails.order_status === "PAID"
                            ? "default"
                            : orderDetails.order_status === "ACTIVE"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {orderDetails.order_status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Customer Email
                      </p>
                      <p className="text-sm">
                        {orderDetails.customer_details?.customer_email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Customer Phone
                      </p>
                      <p className="text-sm">
                        {orderDetails.customer_details?.customer_phone || "N/A"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Created At
                      </p>
                      <p className="text-sm">
                        {orderDetails.created_at
                          ? new Date(orderDetails.created_at).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {orderDetails.order_note && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Note
                      </p>
                      <p className="text-sm">{orderDetails.order_note}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Select Plan (only if order is PAID) */}
            {orderDetails &&
              orderDetails.order_status?.toUpperCase() === "PAID" && (
                <div className="space-y-2">
                  <Label htmlFor="plan">Select Plan</Label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={setSelectedPlanId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans.map((plan) => (
                        <SelectItem key={plan._id} value={plan._id}>
                          {plan.name} - {formatRupees(plan.price)} (
                          {plan.durationMonths} months)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Step 4: Activate Plan Button */}
            {orderDetails &&
              orderDetails.order_status?.toUpperCase() === "PAID" &&
              selectedPlanId && (
                <Button
                  onClick={handleActivateUserPlan}
                  disabled={activatingPlan}
                  className="w-full"
                >
                  {activatingPlan ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Activating Plan...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Activate Plan
                    </>
                  )}
                </Button>
              )}

            {/* Order Status Warning */}
            {orderDetails &&
              orderDetails.order_status?.toUpperCase() !== "PAID" && (
                <Alert>
                  <AlertDescription>
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span>
                        Order status is{" "}
                        <strong>{orderDetails.order_status}</strong>. Only PAID
                        orders can be used to activate plans.
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

            {/* Activation Result */}
            {activationResult && (
              <Alert
                variant={activationResult.success ? "default" : "destructive"}
              >
                <AlertDescription>
                  <div className="flex items-center space-x-2">
                    {activationResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>{activationResult.message}</span>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFilterPanel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Location Filter */}
            <div className="space-y-3">
              <Label>Location</Label>
              <LocationAutocomplete
                value={filterLocation}
                onChange={setFilterLocation}
                placeholder="Search for a location..."
                allowManual={false}
              />

              {/* Radius Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Search Radius
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={filterRadius === 50000 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRadius(50000)}
                    className="rounded-full px-4"
                  >
                    50 km
                  </Button>
                  <Button
                    type="button"
                    variant={filterRadius === 80000 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRadius(80000)}
                    className="rounded-full px-4"
                  >
                    80 km
                  </Button>
                  <Button
                    type="button"
                    variant={filterRadius === 100000 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterRadius(100000)}
                    className="rounded-full px-4"
                  >
                    100 km
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Find users within {filterRadius / 1000}km of the selected
                location
              </p>
            </div>

            {/* Skills Filter */}
            <div className="space-y-2">
              <Label>Skills</Label>
              <SuggestionInput
                type="skills"
                value={filterSkills}
                onChange={setFilterSkills}
                placeholder="Select skills..."
                maxItems={10}
              />
              <p className="text-xs text-muted-foreground">
                Filter users by their skills
              </p>
            </div>

            {/* Job Titles Filter */}
            <div className="space-y-2">
              <Label>Job Titles</Label>
              <SuggestionInput
                type="job-titles"
                value={filterJobTitles}
                onChange={setFilterJobTitles}
                placeholder="Select job titles..."
                maxItems={10}
              />
              <p className="text-xs text-muted-foreground">
                Filter users by their dream job titles
              </p>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-4">
              <Label>Registration Date Range</Label>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="dateFrom"
                    className="text-sm text-muted-foreground"
                  >
                    From
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    max={filterDateTo || undefined}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="dateTo"
                    className="text-sm text-muted-foreground"
                  >
                    To
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    min={filterDateFrom || undefined}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Filter users by when they registered
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                onClick={handleApplyFilters}
                className="w-full"
                disabled={
                  !filterLocation &&
                  filterSkills.length === 0 &&
                  filterJobTitles.length === 0 &&
                  !filterDateFrom &&
                  !filterDateTo
                }
              >
                Apply Filters
              </Button>
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="w-full"
                disabled={!hasActiveFilters}
              >
                Clear Filters
              </Button>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm font-medium">Active Filters:</Label>
                <div className="space-y-1">
                  {filterLocation && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium truncate ml-2">
                          {filterLocation.formattedAddress}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Radius:</span>
                        <span className="font-medium">
                          {filterRadius / 1000} km
                        </span>
                      </div>
                    </div>
                  )}
                  {filterSkills.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Skills:</span>
                      <span className="font-medium">
                        {filterSkills.length} selected
                      </span>
                    </div>
                  )}
                  {filterJobTitles.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Job Titles:</span>
                      <span className="font-medium">
                        {filterJobTitles.length} selected
                      </span>
                    </div>
                  )}
                  {(filterDateFrom || filterDateTo) && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span className="font-medium">
                        {filterDateFrom &&
                          new Date(filterDateFrom).toLocaleDateString()}
                        {filterDateFrom && filterDateTo && " - "}
                        {filterDateTo &&
                          new Date(filterDateTo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
