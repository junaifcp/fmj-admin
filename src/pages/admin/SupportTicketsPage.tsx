import React, { useState, useEffect } from "react";
import {
  getSupportTickets,
  getSupportTicketById,
  respondToTicket,
  updateTicketStatus,
  updateTicketPriority,
} from "@/api/admin";
import { SupportTicket } from "@/types/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  RefreshCw,
  Send,
  User,
  Mail,
  Phone,
  CreditCard,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const SupportTicketsPage: React.FC = () => {
  // State management
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Load tickets
  const loadTickets = async () => {
    try {
      setLoading(true);
      const result = await getSupportTickets(
        1,
        100,
        statusFilter === "all" ? undefined : statusFilter,
        priorityFilter === "all" ? undefined : priorityFilter,
        categoryFilter === "all" ? undefined : categoryFilter
      );
      setTickets(result.tickets || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load ticket detail
  const loadTicketDetail = async (ticketId: string) => {
    try {
      setLoadingDetail(true);
      const ticket = await getSupportTicketById(ticketId);
      setSelectedTicket(ticket);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load ticket details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setSending(true);
      const updatedTicket = await respondToTicket(
        selectedTicket._id,
        newMessage.trim()
      );
      setSelectedTicket(updatedTicket);
      setNewMessage("");

      // Update ticket in list
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );

      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Update status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;

    try {
      const updatedTicket = await updateTicketStatus(
        selectedTicket._id,
        newStatus
      );
      setSelectedTicket(updatedTicket);

      // Update ticket in list
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );

      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Update priority
  const handlePriorityChange = async (newPriority: string) => {
    if (!selectedTicket) return;

    try {
      const updatedTicket = await updateTicketPriority(
        selectedTicket._id,
        newPriority
      );
      setSelectedTicket(updatedTicket);

      // Update ticket in list
      setTickets((prev) =>
        prev.map((t) => (t._id === updatedTicket._id ? updatedTicket : t))
      );

      toast({
        title: "Success",
        description: "Priority updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    }
  };

  // Effects
  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  // Helper functions
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "in-progress":
        return "default";
      case "waiting-response":
        return "secondary";
      case "resolved":
        return "outline";
      case "closed":
        return "outline";
      default:
        return "default";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage and respond to user support requests
          </p>
        </div>
        <Button onClick={loadTickets} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="waiting-response">
                    Waiting Response
                  </SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="job-search">Job Search</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Ticket List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tickets ({tickets.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tickets found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      onClick={() => loadTicketDetail(ticket._id)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-accent transition-colors",
                        selectedTicket?._id === ticket._id && "bg-accent"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {ticket.subject}
                          </h4>
                          <Badge
                            variant={getStatusBadgeVariant(ticket.status)}
                            className="text-xs shrink-0"
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {ticket.userId.firstName} {ticket.userId.lastName}
                          </span>
                          <span>•</span>
                          <Badge
                            variant={getPriorityBadgeVariant(ticket.priority)}
                            className="text-xs"
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Ticket Detail & Chat */}
        <Card className="lg:col-span-2">
          {!selectedTicket ? (
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            </CardContent>
          ) : loadingDetail ? (
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          ) : (
            <>
              {/* Ticket Header */}
              <CardHeader>
                <div className="space-y-4">
                  <div>
                    <CardTitle>{selectedTicket.subject}</CardTitle>
                    <CardDescription>
                      Ticket #{selectedTicket._id.slice(-6)}
                    </CardDescription>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedTicket.userId.firstName}{" "}
                          {selectedTicket.userId.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {selectedTicket.userId.email}
                      </div>
                      {selectedTicket.userId.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {selectedTicket.userId.phone}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {selectedTicket.userId.subscription?.isActive
                            ? "Active Subscription"
                            : "No Active Subscription"}
                        </span>
                      </div>
                      {selectedTicket.userId.subscription?.isActive && (
                        <>
                          <div className="text-sm text-muted-foreground">
                            Plan:{" "}
                            {selectedTicket.userId.subscriptionPlan?.name ||
                              "N/A"}
                          </div>
                          {selectedTicket.userId.subscription.endDate && (
                            <div className="text-sm text-muted-foreground">
                              Expires:{" "}
                              {new Date(
                                selectedTicket.userId.subscription.endDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ticket Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Status:</Label>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="waiting-response">
                            Waiting Response
                          </SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Priority:</Label>
                      <Select
                        value={selectedTicket.priority}
                        onValueChange={handlePriorityChange}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3",
                          msg.sender === "admin" && "flex-row-reverse"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            msg.sender === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {msg.sender === "admin" ? "A" : "U"}
                        </div>
                        <div
                          className={cn(
                            "flex-1 space-y-1",
                            msg.sender === "admin" && "text-right"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {msg.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "inline-block rounded-lg p-3 text-sm",
                              msg.sender === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                {/* Reply Box */}
                <div className="space-y-2">
                  <Label>Reply to User</Label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your response..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-full"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SupportTicketsPage;
