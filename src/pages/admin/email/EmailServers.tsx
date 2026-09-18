import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getEmailServers,
  getEmailServer,
  createEmailServer,
  updateEmailServer,
  deleteEmailServer,
  setDefaultEmailServer,
  testEmailServerConnection,
  EmailServer,
  EmailServerCreatePayload,
} from "@/api/admin";
import { PaginationResponse } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const EmailServersPage: React.FC = () => {
  const [data, setData] = useState<PaginationResponse<EmailServer> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<
    "gmail" | "smtp" | "outlook" | "ses" | ""
  >("");
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<EmailServer | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState<EmailServer | null>(
    null
  );
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [serverToSetDefault, setServerToSetDefault] =
    useState<EmailServer | null>(null);

  const { toast } = useToast();

  const [formData, setFormData] = useState<EmailServerCreatePayload>({
    name: "",
    provider: "gmail",
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    isDefault: false,
    isActive: true,
    secure: true,
    dailyLimit: 200,
    monthlyLimit: 2000,
  });

  const fetchData = async (
    page = 1,
    provider?: "gmail" | "smtp" | "outlook" | "ses",
    active?: boolean
  ) => {
    try {
      setLoading(true);
      const result = await getEmailServers(page, 20, provider, active);
      setData(result);
    } catch (error) {
      toast({
        title: "Failed to fetch email servers",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchData(1, providerFilter || undefined, activeFilter ?? undefined);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, providerFilter, activeFilter]);

  useEffect(() => {
    fetchData(
      currentPage,
      providerFilter || undefined,
      activeFilter ?? undefined
    );
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreate = () => {
    setEditingServer(null);
    setFormData({
      name: "",
      provider: "gmail",
      username: "",
      password: "",
      fromEmail: "",
      fromName: "",
      isDefault: false,
      isActive: true,
      secure: true,
      host: undefined,
      port: undefined,
      dailyLimit: 200,
      monthlyLimit: 2000,
    });
    setModalOpen(true);
  };

  const handleEdit = async (server: EmailServer) => {
    try {
      const fullServer = await getEmailServer(server._id);
      setEditingServer(fullServer);
      setFormData({
        name: fullServer.name,
        provider: fullServer.provider,
        username: fullServer.username,
        password: "", // Don't pre-fill password for security
        fromEmail: fullServer.fromEmail,
        fromName: fullServer.fromName || "",
        isDefault: fullServer.isDefault,
        isActive: fullServer.isActive,
        secure: fullServer.secure,
        host: fullServer.host,
        port: fullServer.port,
        dailyLimit: fullServer.dailyLimit ?? 200,
        monthlyLimit: fullServer.monthlyLimit ?? 2000,
      });
      setModalOpen(true);
    } catch (error) {
      toast({
        title: "Failed to load server details",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (server: EmailServer) => {
    setServerToDelete(server);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serverToDelete) return;

    try {
      await deleteEmailServer(serverToDelete._id);
      toast({
        title: "Email server deleted successfully",
      });
      fetchData(
        currentPage,
        providerFilter || undefined,
        activeFilter ?? undefined
      );
    } catch (error) {
      toast({
        title: "Failed to delete email server",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServerToDelete(null);
    }
  };

  const handleSetDefaultClick = (server: EmailServer) => {
    if (server.isDefault) return;
    setServerToSetDefault(server);
    setDefaultDialogOpen(true);
  };

  const handleSetDefaultConfirm = async () => {
    if (!serverToSetDefault) return;

    try {
      await setDefaultEmailServer(serverToSetDefault._id);
      toast({
        title: "Default server updated successfully",
      });
      fetchData(
        currentPage,
        providerFilter || undefined,
        activeFilter ?? undefined
      );
    } catch (error) {
      toast({
        title: "Failed to set default server",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDefaultDialogOpen(false);
      setServerToSetDefault(null);
    }
  };

  const handleTestConnection = async (serverId: string) => {
    try {
      setTestingServerId(serverId);
      const result = await testEmailServerConnection(serverId);
      toast({
        title: result.connected ? "Connection successful" : "Connection failed",
        description: result.message,
        variant: result.connected ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Failed to test connection",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTestingServerId(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setModalLoading(true);

      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Validation error",
          description: "Server name is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.username.trim()) {
        toast({
          title: "Validation error",
          description: "Username/Email is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.fromEmail.trim()) {
        toast({
          title: "Validation error",
          description: "From Email is required",
          variant: "destructive",
        });
        return;
      }

      // For SMTP and SES providers, host and port are required
      if (formData.provider === "smtp" || formData.provider === "ses") {
        if (!formData.host?.trim()) {
          toast({
            title: "Validation error",
            description: `Host is required for ${formData.provider.toUpperCase()} provider`,
            variant: "destructive",
          });
          return;
        }
        if (!formData.port) {
          toast({
            title: "Validation error",
            description: `Port is required for ${formData.provider.toUpperCase()} provider`,
            variant: "destructive",
          });
          return;
        }
      }

      // Validate email limits
      if (
        !formData.dailyLimit ||
        formData.dailyLimit < 1 ||
        formData.dailyLimit > 10000
      ) {
        toast({
          title: "Validation error",
          description: "Daily limit must be between 1 and 10,000",
          variant: "destructive",
        });
        return;
      }

      if (
        !formData.monthlyLimit ||
        formData.monthlyLimit < 1 ||
        formData.monthlyLimit > 100000
      ) {
        toast({
          title: "Validation error",
          description: "Monthly limit must be between 1 and 100,000",
          variant: "destructive",
        });
        return;
      }

      // Password is required for new servers
      if (!editingServer && !formData.password) {
        toast({
          title: "Validation error",
          description: "Password is required",
          variant: "destructive",
        });
        return;
      }

      if (editingServer) {
        // Update existing server
        const updatePayload: Partial<EmailServerCreatePayload> = {
          name: formData.name,
          provider: formData.provider,
          username: formData.username,
          fromEmail: formData.fromEmail,
          fromName: formData.fromName || undefined,
          isDefault: formData.isDefault,
          isActive: formData.isActive,
          secure: formData.secure,
          host: formData.host,
          port: formData.port,
          dailyLimit: formData.dailyLimit,
          monthlyLimit: formData.monthlyLimit,
        };

        // Only include password if provided (for updates)
        if (formData.password) {
          updatePayload.password = formData.password;
        }

        await updateEmailServer(editingServer._id, updatePayload);
        toast({
          title: "Email server updated successfully",
        });
      } else {
        // Create new server
        await createEmailServer(formData);
        toast({
          title: "Email server created successfully",
        });
      }

      setModalOpen(false);
      fetchData(
        currentPage,
        providerFilter || undefined,
        activeFilter ?? undefined
      );
    } catch (error) {
      toast({
        title: editingServer
          ? "Failed to update email server"
          : "Failed to create email server",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setModalLoading(false);
    }
  };

  const getProviderConfig = (provider: string) => {
    switch (provider) {
      case "gmail":
        return { host: "smtp.gmail.com", port: 465, secure: true };
      case "outlook":
        return { host: "smtp-mail.outlook.com", port: 587, secure: false };
      case "ses":
        return { host: "", port: 465, secure: true }; // User must provide region-specific endpoint
      default:
        return { host: "", port: 587, secure: true };
    }
  };

  const handleProviderChange = (
    provider: "gmail" | "smtp" | "outlook" | "ses"
  ) => {
    const config = getProviderConfig(provider);
    setFormData((prev) => ({
      ...prev,
      provider,
      ...(provider !== "smtp" &&
        provider !== "ses" && {
          host: config.host,
          port: config.port,
          secure: config.secure,
        }),
      ...((provider === "smtp" || provider === "ses") && {
        host: config.host || "", // SES needs manual entry of region endpoint
        port: config.port || 465,
        secure: config.secure,
      }),
    }));
  };

  const filteredData = data?.data.filter((server) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        server.name.toLowerCase().includes(searchLower) ||
        server.username.toLowerCase().includes(searchLower) ||
        server.fromEmail.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Servers</CardTitle>
              <CardDescription>
                Manage email server configurations for sending emails
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Server
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search servers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select
                value={providerFilter}
                onValueChange={(value) =>
                  setProviderFilter(
                    value as "gmail" | "smtp" | "outlook" | "ses" | ""
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Providers</SelectItem>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                  <SelectItem value="ses">AWS SES</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={
                  activeFilter === null
                    ? "all"
                    : activeFilter
                    ? "active"
                    : "inactive"
                }
                onValueChange={(value) => {
                  if (value === "all") setActiveFilter(null);
                  else setActiveFilter(value === "active");
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  fetchData(
                    currentPage,
                    providerFilter || undefined,
                    activeFilter ?? undefined
                  )
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>From Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData && filteredData.length > 0 ? (
                        filteredData.map((server) => (
                          <TableRow key={server._id}>
                            <TableCell className="font-medium">
                              {server.name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {server.provider.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>{server.fromEmail}</TableCell>
                            <TableCell>
                              {server.isActive ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-600"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {server.isDefault ? (
                                <Badge variant="default">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleTestConnection(server._id)
                                  }
                                  disabled={testingServerId === server._id}
                                >
                                  {testingServerId === server._id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Testing...
                                    </>
                                  ) : (
                                    "Test"
                                  )}
                                </Button>
                                {!server.isDefault && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleSetDefaultClick(server)
                                    }
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(server)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(server)}
                                  disabled={server.isDefault}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No email servers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing page {data.pagination.page} of{" "}
                      {data.pagination.totalPages} ({data.pagination.total}{" "}
                      total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= data.pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingServer ? "Edit Email Server" : "Create Email Server"}
            </DialogTitle>
            <DialogDescription>
              {editingServer
                ? "Update the email server configuration."
                : "Configure a new email server for sending emails."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Server Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Gmail Production"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">
                  Provider <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="smtp">SMTP (Generic)</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="ses">AWS SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.provider === "smtp" || formData.provider === "ses") && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">
                      {formData.provider === "ses"
                        ? "AWS SES SMTP Endpoint"
                        : "SMTP Host"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="host"
                      value={formData.host || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          host: e.target.value,
                        }))
                      }
                      placeholder={
                        formData.provider === "ses"
                          ? "email-smtp.us-east-1.amazonaws.com"
                          : "smtp.example.com"
                      }
                      required={
                        formData.provider === "smtp" ||
                        formData.provider === "ses"
                      }
                    />
                    {formData.provider === "ses" && (
                      <p className="text-xs text-muted-foreground">
                        Region-specific endpoint from AWS SES Console
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="port">
                      Port <span className="text-red-500">*</span>
                    </Label>
                    {formData.provider === "ses" ? (
                      <Select
                        value={formData.port?.toString() || "465"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            port: parseInt(value),
                            secure: value === "465",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="465">
                            465 (SSL/TLS - Recommended)
                          </SelectItem>
                          <SelectItem value="587">587 (StartTLS)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="port"
                        type="number"
                        value={formData.port || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            port: parseInt(e.target.value) || undefined,
                          }))
                        }
                        placeholder="587"
                        min={1}
                        max={65535}
                        required={formData.provider === "smtp"}
                      />
                    )}
                  </div>

                  <div className="space-y-2 flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="secure"
                        checked={formData.secure}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, secure: checked }))
                        }
                      />
                      <Label htmlFor="secure">Use TLS/SSL</Label>
                    </div>
                  </div>
                </div>

                {formData.provider === "ses" && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      AWS SES Setup Instructions:
                    </p>
                    <ol className="text-xs text-blue-800 dark:text-blue-200 list-decimal list-inside space-y-1">
                      <li>Go to AWS SES Console → SMTP Settings</li>
                      <li>Create SMTP credentials (if not already created)</li>
                      <li>
                        Copy the SMTP Server Name (region-specific endpoint)
                      </li>
                      <li>
                        Use the SMTP Username and Password as credentials below
                      </li>
                      <li>
                        Ensure your "From Email" address is verified in AWS SES
                      </li>
                    </ol>
                    <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Common SES Endpoints:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>US East: email-smtp.us-east-1.amazonaws.com</li>
                        <li>US West: email-smtp.us-west-2.amazonaws.com</li>
                        <li>EU Ireland: email-smtp.eu-west-1.amazonaws.com</li>
                        <li>
                          Asia Pacific: email-smtp.ap-south-1.amazonaws.com
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  {formData.provider === "ses"
                    ? "SMTP Username"
                    : "Username/Email"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  type={formData.provider === "ses" ? "text" : "email"}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder={
                    formData.provider === "ses" ? "AKIA..." : "user@example.com"
                  }
                  required
                />
                {formData.provider === "ses" && (
                  <p className="text-xs text-muted-foreground">
                    AWS SES SMTP username (from SES SMTP credentials)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password{" "}
                  {editingServer ? "(leave blank to keep current)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={
                    editingServer ? "Enter new password" : "Enter password"
                  }
                  required={!editingServer}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">
                  From Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fromEmail: e.target.value,
                    }))
                  }
                  placeholder="noreply@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromName">From Name (optional)</Label>
                <Input
                  id="fromName"
                  value={formData.fromName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fromName: e.target.value,
                    }))
                  }
                  placeholder="FitMyJob"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">
                  Daily Limit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={formData.dailyLimit || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dailyLimit: parseInt(e.target.value) || undefined,
                    }))
                  }
                  placeholder="200"
                  min={1}
                  max={10000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum emails per day (1-10,000)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyLimit">
                  Monthly Limit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  value={formData.monthlyLimit || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      monthlyLimit: parseInt(e.target.value) || undefined,
                    }))
                  }
                  placeholder="2000"
                  min={1}
                  max={100000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Maximum emails per month (1-100,000)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked }))
                  }
                />
                <Label htmlFor="isDefault">Set as default server</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={modalLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={modalLoading}>
                {modalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingServer ? (
                  "Update Server"
                ) : (
                  "Create Server"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{serverToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Default Confirmation Dialog */}
      <AlertDialog open={defaultDialogOpen} onOpenChange={setDefaultDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Default Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set "{serverToSetDefault?.name}" as the
              default email server? This will replace the current default
              server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetDefaultConfirm}>
              Set Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailServersPage;
