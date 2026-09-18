import React, { useState, useEffect } from 'react';
import { getContactMessages, getContactMessage, deleteContactMessage } from '@/api/admin';
import { AdminContactMessage, PaginationResponse } from '@/types/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Mail,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<PaginationResponse<AdminContactMessage> | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<AdminContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const { toast } = useToast();

  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      const data = await getContactMessages(page, 20);
      setMessages(data);
    } catch (err) {
      toast({
        title: 'Failed to load messages',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageDetail = async (messageId: string) => {
    try {
      const message = await getContactMessage(messageId);
      setSelectedMessage(message);
      setIsDetailModalOpen(true);
    } catch (err) {
      toast({
        title: 'Failed to load message details',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteContactMessage(messageId);
      toast({ title: 'Message deleted successfully' });
      fetchMessages(currentPage);
    } catch (error) {
      toast({
        title: 'Failed to delete message',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const handleReply = (message: AdminContactMessage) => {
    const subject = `Re: ${message.subject}`;
    const body = `Hi ${message.name},\n\nThank you for contacting us regarding "${message.subject}".\n\n\n\nBest regards,\nAdmin Team`;
    
    const mailtoUrl = `mailto:${message.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge variant="default">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">Contact Messages</h1>
        <p className="text-muted-foreground mt-1">
          Manage and respond to user inquiries and feedback
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Messages</CardTitle>
              <CardDescription>
                {messages ? `${messages.pagination.total} total messages` : 'Loading messages...'}
              </CardDescription>
            </div>
            <Button
              onClick={() => fetchMessages(currentPage)}
              size="sm"
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
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
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages?.data.map((message) => (
                    <TableRow key={message._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{message.name}</div>
                          <div className="text-sm text-muted-foreground">{message.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{message.subject}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {message.message.substring(0, 60)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(message.status)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchMessageDetail(message._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReply(message)}
                            className="text-primary hover:text-primary"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMessage(message._id)}
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
              {messages && messages.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((messages.pagination.page - 1) * 20) + 1} to{' '}
                    {Math.min(messages.pagination.page * 20, messages.pagination.total)} of{' '}
                    {messages.pagination.total} messages
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage - 1;
                        setCurrentPage(newPage);
                        fetchMessages(newPage);
                      }}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Page {messages.pagination.page} of {messages.pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPage = currentPage + 1;
                        setCurrentPage(newPage);
                        fetchMessages(newPage);
                      }}
                      disabled={currentPage >= messages.pagination.totalPages}
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

      {/* Message Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">From:</span> {selectedMessage.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedMessage.email}
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {selectedMessage.subject}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {getStatusBadge(selectedMessage.status)}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Date:</span> {new Date(selectedMessage.createdAt).toLocaleString()}
                </div>
              </div>
              
              <div>
                <div className="font-medium mb-2">Message:</div>
                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                  {selectedMessage.message}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleReply(selectedMessage)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reply via Email
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteMessage(selectedMessage._id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactMessages;