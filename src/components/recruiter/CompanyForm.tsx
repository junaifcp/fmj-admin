// src/components/recruiter/CompanyForm.tsx
import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCompany, updateCompany } from "@/api/recruiter";
import type { Company, CreateCompanyPayload } from "@/types/recruiter";
import type { Location } from "@/types/location";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { CompanyAutocompleteInput } from "@/components/onboarding/CompanyAutocompleteInput";
import { useBusinessResolve } from "@/hooks/useBusinessResolve";
import type { BusinessSuggestItem, ResolvedDetails } from "@/types/onboarding";
import { toast } from "sonner";

import IndustrySelect from "@/components/common/IndustrySelect";
import { industries } from "@/constants/industries";

const companyFormSchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name too long"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[+0-9\s\-()]{6,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  description: z.string().max(500, "Description too long").optional(),
  industry: z.string().optional(),
  size: z
    .enum(["startup", "small", "medium", "large", "enterprise"])
    .optional(),
  location: z.any().optional(),
});

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: Company;
  onSubmit: (company: Company) => void;
  onCancel: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSubmit,
  onCancel,
}) => {
  const { resolve } = useBusinessResolve();

  const [companySearch, setCompanySearch] = useState("");
  const [resolvedDetails, setResolvedDetails] =
    useState<ResolvedDetails | null>(null);
  const [showFullForm, setShowFullForm] = useState<boolean>(!!company);
  const [showInlineAutocomplete, setShowInlineAutocomplete] = useState(false);
  const autocompleteToggleRef = useRef<HTMLButtonElement | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company?.name || "",
      logo: company?.logo || "",
      website: company?.website || "",
      email: company?.email || "",
      phone: (company as any)?.phone || "",
      description: company?.description || "",
      industry: company?.industry || "",
      size: company?.size || "startup",
      location: company?.location || null,
    },
  });

  const handleSelectCompany = async (item: BusinessSuggestItem) => {
    if (item.placeId) {
      try {
        const details = await resolve(item.placeId);
        if (details) {
          setResolvedDetails(details.details);
          form.setValue("name", details.details.name || item.name);
          form.setValue("website", details.details.website || "");
          form.setValue("email", details.details.email || "");
          form.setValue("logo", details.details.logo || "");
          // form.setValue("phone", details.details.phone || "");
          if (details.details.phone) {
            form.setValue("phone", details.details.phone);
          } else {
            // keep editable if no phone provided by resolver
            form.setValue("phone", "");
          }
          form.setValue(
            "industry",
            (details.details as any).industry ||
              form.getValues("industry") ||
              ""
          );
          if (details.details.formattedAddress) {
            form.setValue("location", {
              placeId: details.details.placeId,
              formattedAddress: details.details.formattedAddress,
              lat: details.details.lat,
              lng: details.details.lng,
              country: details.details.country,
              region: details.details.region,
              city: details.details.city,
              postalCode: details.details.postalCode,
              street: details.details.street,
              components: details.details.components,
              source: details.details.source || "google",
            } as Location);
          }
        }
      } catch (err) {
        console.error("Resolve failed", err);
        toast.error("Failed to fetch company details. You can fill manually.");
        setResolvedDetails(null);
        form.setValue("name", item.name);
      }
    } else {
      form.setValue("name", item.name);
      setResolvedDetails(null);
    }

    setShowFullForm(true);
    setShowInlineAutocomplete(false);
    setCompanySearch("");
  };

  const handleAddTyped = (typed: string) => {
    form.setValue("name", typed);
    setResolvedDetails(null);
    setShowFullForm(true);
    setShowInlineAutocomplete(false);
    setCompanySearch("");
  };

  const handleOpenChangeCompany = () => {
    setShowInlineAutocomplete(true);
    setResolvedDetails(null);
  };

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      const cleanData: CreateCompanyPayload = {
        name: data.name,
        logo: data.logo || undefined,
        website: data.website || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        description: data.description || undefined,
        industry: data.industry || undefined,
        size: data.size || "startup",
        location: data.location || undefined,
      };

      let result: Company;
      if (company) {
        result = await updateCompany(company._id, cleanData);
      } else {
        result = await createCompany(cleanData);
      }

      onSubmit(result);
    } catch (error) {
      console.error("Failed to save company:", error);
      toast.error(
        company ? "Failed to update company" : "Failed to create company"
      );
    }
  };

  // COMPACT: autocomplete only
  if (!showFullForm && !showInlineAutocomplete) {
    return (
      <div className="space-y-4">
        <label className="text-sm font-medium mb-2 block">Company</label>
        <div className="relative z-50 min-h-[12rem]">
          <CompanyAutocompleteInput
            value={companySearch}
            onChange={setCompanySearch}
            onSelect={handleSelectCompany}
            onAddTyped={handleAddTyped}
            placeholder="Search your company or type to add..."
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Start typing to search for your company. If not found, you can add it
          manually.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowFullForm(true)}>
            Add Manually
          </Button>
        </div>
      </div>
    );
  }

  // FULL FORM
  const currentIndustryValue = form.watch("industry");
  const isOther =
    currentIndustryValue === "Other" ||
    (typeof currentIndustryValue === "string" &&
      !(industries as readonly string[]).includes(currentIndustryValue));

  return (
    <Form {...form}>
      {/* form is full height column. DialogContent must be 'flex flex-col' */}
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col h-full"
      >
        {/* Scrollable content area (flex-1) */}
        <div
          className="space-y-6 overflow-y-auto px-0 py-2"
          style={{
            maxHeight: "calc(80vh - 72px)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {showInlineAutocomplete && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search / Change company
              </label>
              <div className="relative z-50">
                <CompanyAutocompleteInput
                  value={companySearch}
                  onChange={setCompanySearch}
                  onSelect={handleSelectCompany}
                  onAddTyped={handleAddTyped}
                  placeholder="Search your company or type to add..."
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInlineAutocomplete(false)}
                  ref={autocompleteToggleRef}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <div className="flex gap-2 items-center">
                  <FormControl className="flex-1">
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  {resolvedDetails ? (
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md bg-muted text-sm text-muted-foreground">
                        Suggested
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenChangeCompany}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground"> </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* logo */}
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+91 99999 99999"
                      {...field}
                      // disable only when the resolved details actually include a phone number
                      disabled={Boolean(resolvedDetails?.phone)}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <IndustrySelect
                      value={field.value || ""}
                      onChange={(v) => field.onChange(v)}
                      placeholder="Select an industry..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isOther ? (
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Industry</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Type your industry"
                        value={
                          field.value === "Other" ? "" : (field.value as string)
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div />
            )}

            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startup">
                          Startup (1-10 employees)
                        </SelectItem>
                        <SelectItem value="small">
                          Small (11-50 employees)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (51-200 employees)
                        </SelectItem>
                        <SelectItem value="large">
                          Large (201-1000 employees)
                        </SelectItem>
                        <SelectItem value="enterprise">
                          Enterprise (1000+ employees)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    {resolvedDetails?.formattedAddress ? (
                      <Input
                        value={field.value?.formattedAddress || ""}
                        disabled
                      />
                    ) : (
                      <LocationAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Search for company location..."
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of your company..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* fixed footer inside dialog but not sticky */}
        <div className="border-t pt-3 bg-white/60 backdrop-blur-sm">
          <div className="flex justify-end gap-2 p-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? company
                  ? "Updating..."
                  : "Creating..."
                : company
                ? "Update Company"
                : "Create Company"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default CompanyForm;
