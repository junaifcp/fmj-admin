import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
  Filter,
} from "lucide-react";
import { ManagedItem, PaginationResponse } from "@/types/admin";

interface ManagementTableProps<T extends ManagedItem> {
  title: string;
  data: PaginationResponse<T> | null;
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  onVerifyToggle: (
    id: string,
    verified: "verified" | "pending" | "rejected"
  ) => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onBulkAction: (
    ids: string[],
    action: "verify" | "unverify" | "delete"
  ) => void;
  onCreate?: () => void;
  verifiedFilter: string;
  onVerifiedFilterChange: (filter: string) => void;
  extraColumns?: {
    header: string;
    render: (item: T) => React.ReactNode;
  }[];
  extraActions?: React.ReactNode;
}

export function ManagementTable<T extends ManagedItem>({
  title,
  data,
  loading,
  search,
  onSearchChange,
  onRefresh,
  onPageChange,
  currentPage,
  onVerifyToggle,
  onEdit,
  onDelete,
  onBulkAction,
  onCreate,
  verifiedFilter,
  onVerifiedFilterChange,
  extraColumns = [],
  extraActions,
}: ManagementTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const getVerificationBadgeVariant = (verified: string) => {
    switch (verified) {
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(data?.data.map((item) => item._id) || []);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter((selectedId) => selectedId !== id));
    }
  };

  // sentinel for the "All" option — must be non-empty so Radix doesn't reject it.
  const ALL_SENTINEL = "__all__";
  // convert external verifiedFilter ("" means all) into Select value
  const selectValue = verifiedFilter === "" ? ALL_SENTINEL : verifiedFilter;

  // Helper to safely format createdBy which can be string or populated object
  function formatCreatedBy(
    createdBy:
      | string
      | { _id: string; email?: string; name?: string }
      | undefined
  ) {
    if (!createdBy) return "";
    if (typeof createdBy === "string") {
      return createdBy.slice(-8);
    }
    // object case
    if (createdBy.name && createdBy.name.trim()) return createdBy.name;
    if (createdBy.email && createdBy.email.trim()) return createdBy.email;
    if (createdBy._id) return createdBy._id.slice(-8);
    return "";
  }
  // console.log("extraActions present?", !!extraActions, extraActions);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">
            {data ? `${data.pagination.total} total items` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {extraActions}
          {onCreate && (
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add {title.slice(0, -1)}
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={selectValue}
          onValueChange={(val) => {
            // map sentinel back to empty string before sending upstream
            const mapped = val === ALL_SENTINEL ? "" : val;
            onVerifiedFilterChange(mapped);
          }}
        >
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={onRefresh}
          size="sm"
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction(selectedItems, "verify")}
          >
            <Check className="h-4 w-4 mr-1" />
            Verify
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkAction(selectedItems, "unverify")}
          >
            <X className="h-4 w-4 mr-1" />
            Unverify
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Items</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedItems.length}{" "}
                  selected items? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onBulkAction(selectedItems, "delete");
                    setSelectedItems([]);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedItems.length === data?.data.length &&
                    data?.data.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              {extraColumns.map((col, idx) => (
                <TableHead key={idx}>{col.header}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedItems.includes(item._id)}
                    onCheckedChange={(checked) =>
                      handleSelectItem(item._id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {item.notes && (
                      <div className="text-sm text-muted-foreground">
                        {item.notes}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={item.verified === "verified"}
                      onCheckedChange={(checked) =>
                        onVerifyToggle(
                          item._id,
                          checked ? "verified" : "pending"
                        )
                      }
                    />
                    <Badge variant={getVerificationBadgeVariant(item.verified)}>
                      {item.verified}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCreatedBy(item.createdBy as any)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                {extraColumns.map((col, idx) => (
                  <TableCell key={idx}>{col.render(item)}</TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.name}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(item._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total
            )}{" "}
            of {data.pagination.total} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
