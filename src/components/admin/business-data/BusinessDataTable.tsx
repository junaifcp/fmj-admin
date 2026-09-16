// src/components/admin/business-data/BusinessDataTable.tsx
import React from "react";
import { BusinessData } from "@/types/businessData";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BusinessDataTableProps {
  data: BusinessData[];
  loading?: boolean;
}

export const BusinessDataTable: React.FC<BusinessDataTableProps> = ({
  data,
  loading = false,
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const renderRating = (rating?: number) => {
    if (rating === undefined || rating === null)
      return <span className="text-muted-foreground">N/A</span>;
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span>{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {[...Array(9)].map((_, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-sm font-medium"
                  >
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No businesses found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Business Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Address
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Location
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Reviews
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Website
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Emails
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Scraped Date
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((business) => (
              <tr
                key={business._id}
                className="border-t hover:bg-muted/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{business.business.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div
                    className="text-sm max-w-xs truncate"
                    title={business.business.formattedAddress}
                  >
                    {business.business.formattedAddress}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {business.location.city && business.location.state
                      ? `${business.location.city}, ${business.location.state}`
                      : business.location.formattedAddress}
                  </div>
                  {business.location.country && (
                    <div className="text-xs text-muted-foreground">
                      {business.location.country}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {renderRating(business.business.rating)}
                </td>
                <td className="px-4 py-3">
                  {business.business.reviewsCount !== undefined &&
                  business.business.reviewsCount !== null
                    ? business.business.reviewsCount.toLocaleString()
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  {business.business.internationalPhone ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      <a
                        href={`tel:${business.business.internationalPhone}`}
                        className="hover:underline"
                      >
                        {business.business.internationalPhone}
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {business.business.website ? (
                    <a
                      href={business.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="max-w-[150px] truncate">Visit</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {business.business.emails &&
                  business.business.emails.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {business.business.emails.map((email, idx) => (
                        <a
                          key={idx}
                          href={`mailto:${email}`}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          <span>{email}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(business.scrapedAt)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
