import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingAnimation } from "@/components/ui/loading-animation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestionInput } from "@/components/ui/suggestion-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { CompanySelector } from "./CompanySelector";
import type {
  Job,
  CreateJobPayload,
  GenerateJobResponse,
} from "@/types/recruiter";
import type { Location } from "@/types/location";
import QualificationsMultiSelect from "@/components/recruiter/QualificationsMultiSelect";
import {
  educationOptions,
  type EducationLevel,
} from "@/constants/educationOptions";
import MultiSelectWithOther from "@/components/ui/MultiSelectWithOther";
import { allowanceOptions } from "@/constants/allowanceOptions";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateJobDetails } from "@/api/recruiter";
const MIN_GENERATE_MS = 3000;
const jobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  titleId: z.string().optional(),
  experienceYears: z.number().min(0).max(30),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  requirements: z.array(z.string()).min(1, "At least one skill is required"),
  qualifications: z
    .array(
      z.enum([
        "high-school",
        "associate",
        "bachelor",
        "master",
        "phd",
        "certificate",
        "other",
      ])
    )
    .min(1, "At least one qualification is required"),
  fieldOfStudies: z.array(z.string()).optional(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default("USD"),
  }),
  type: z.enum(["full-time", "part-time", "contract", "internship"]),
  companyId: z.string().min(1, "Company selection is required"),
  useCompanyLocation: z.boolean().default(true),
  location: z.any().optional(),
  genderPreference: z.string().optional(),
  ageMin: z.number().optional(),
  ageMax: z.number().optional(),
  otherAllowances: z.array(z.string()).optional(),
  hasOtherAllowances: z.boolean().optional().default(false),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  job?: Job;
  onSubmit: (data: CreateJobPayload) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const JobForm: React.FC<JobFormProps> = ({
  job,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditMode = false,
}) => {
  const { toast } = useToast();
  const [generateMode, setGenerateMode] = useState<
    "idle" | "manual" | "generating"
  >(isEditMode ? "manual" : "idle");
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job?.title || "",
      titleId: job?.titleId || "",
      experienceYears: job?.experienceYears || 0,
      summary: job?.summary || "",
      description: job?.description || "",
      requirements: job?.requirements || [],
      qualifications:
        job?.qualifications && job.qualifications.length
          ? (job.qualifications as EducationLevel[])
          : (["bachelor"] as EducationLevel[]),
      fieldOfStudies:
        job?.fieldOfStudies && Array.isArray(job.fieldOfStudies)
          ? job.fieldOfStudies.map((f: any) =>
              typeof f === "string" ? f : f.name || f._id || ""
            )
          : [],
      salary: {
        min: job?.salary?.min || undefined,
        max: job?.salary?.max || undefined,
        currency: job?.salary?.currency || "INR",
      },
      type: job?.type || "full-time",
      companyId:
        typeof job?.companyId === "object" && (job?.companyId as any)?._id
          ? (job.companyId as any)._id
          : ((job?.companyId || "") as string),
      useCompanyLocation: job?.useCompanyLocation ?? true,
      location: job?.location || null,
      genderPreference: job?.genderPreference || "",
      ageMin: job?.ageMin ?? 18,
      ageMax: job?.ageMax ?? 35,
      hasOtherAllowances: false,
      otherAllowances: job?.otherAllowances || [],
    },
  });

  const watchedUseCompanyLocation = form.watch("useCompanyLocation");
  const watchedExperience = form.watch("experienceYears");
  const watchedTitle = form.watch("title");
  const watchedCompanyId = form.watch("companyId");

  const canGenerate = Boolean(
    watchedTitle && watchedCompanyId && watchedExperience >= 0
  );

  const handleGenerateJobDetails = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setGenerateMode("generating");

    // create abort controller so we can cancel if needed
    const controller = new AbortController();
    const { signal } = controller;

    const start = Date.now();

    try {
      const payload = {
        title: watchedTitle,
        companyId: watchedCompanyId,
        experienceYears: watchedExperience,
      };

      // call the API
      const dataPromise = generateJobDetails(payload);

      // wait for both the API call and the minimum time
      const [data] = await Promise.all([
        dataPromise,
        new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.max(0, MIN_GENERATE_MS - (Date.now() - start))
          )
        ),
      ]);

      // Map response to form fields (only set fields that exist)
      if (data.summary) form.setValue("summary", data.summary);
      if (data.description) form.setValue("description", data.description);
      if (Array.isArray(data.requirements))
        form.setValue("requirements", data.requirements);
      if (Array.isArray(data.qualifications))
        form.setValue(
          "qualifications",
          data.qualifications as EducationLevel[]
        );
      if (Array.isArray(data.fieldOfStudies))
        form.setValue("fieldOfStudies", data.fieldOfStudies);
      if (data.salary?.min !== undefined)
        form.setValue("salary.min", data.salary.min);
      if (data.salary?.max !== undefined)
        form.setValue("salary.max", data.salary.max);
      if (data.salary?.currency)
        form.setValue("salary.currency", data.salary.currency);
      if (data.type) form.setValue("type", data.type);
      if (data.useCompanyLocation !== undefined)
        form.setValue("useCompanyLocation", data.useCompanyLocation);
      if (data.location) form.setValue("location", data.location);
      if (data.genderPreference !== undefined)
        form.setValue("genderPreference", data.genderPreference);
      if (data.ageMin !== undefined) form.setValue("ageMin", data.ageMin);
      if (data.ageMax !== undefined) form.setValue("ageMax", data.ageMax);
      if (Array.isArray(data.otherAllowances))
        form.setValue("otherAllowances", data.otherAllowances);
      if (data.hasOtherAllowances !== undefined)
        form.setValue("hasOtherAllowances", data.hasOtherAllowances);

      setGenerateMode("manual");
      toast({
        title: "Generated details",
        description: "Review and edit the generated job details if needed.",
      });
    } catch (err: any) {
      // If abort, you can check: err.name === 'AbortError'
      toast({
        title: "Generation failed",
        description:
          err?.message || "Failed to generate job details. Please try again.",
        variant: "destructive",
      });
      setGenerateMode("idle");
    } finally {
      setIsGenerating(false);
    }

    // Optional: you can return the controller if you want to allow cancellation by parent
    // return controller;
  };

  const handleEnterManually = () => {
    setGenerateMode("manual");
  };

  const handleSubmit = async (data: JobFormData) => {
    await onSubmit(data as CreateJobPayload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job ? "Edit Job" : "Create New Job"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      type="job-titles"
                      value={field.value}
                      onChange={(value, item) => {
                        field.onChange(value);
                        form.setValue("titleId", item?._id || "");
                      }}
                      placeholder="Search for job title..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <CompanySelector
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experienceYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Required</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Slider
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                        max={30}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>0 yrs</span>
                        <span className="font-medium">
                          {watchedExperience} years
                        </span>
                        <span>30 yrs</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Generation or Manual Entry Buttons - Only show in create mode */}
            {!isEditMode && generateMode === "idle" && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEnterManually}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Enter Details manually
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateJobDetails}
                  disabled={!canGenerate || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Job details with AI
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Loading Skeleton while generating */}
            {/* {generateMode === "generating" && (
              <div className="space-y-4" aria-busy="true" aria-live="polite">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            )} */}

            {generateMode === "generating" && (
              <div aria-busy="true" aria-live="polite">
                <LoadingAnimation label="Generating job summary and skills" />
              </div>
            )}

            {/* Show form fields only when in manual mode or after generation */}
            {generateMode === "manual" && (
              <>
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills</FormLabel>
                      <FormControl>
                        <SuggestionInput
                          type="skills"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search and add skills..."
                          maxItems={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
              control={form.control}
              name="qualifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education Qualifications</FormLabel>
                  <FormControl>
                    <SuggestionInput
                      type="qualifications"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Search and add qualifications..."
                      maxItems={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

                <FormField
                  control={form.control}
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education Qualifications</FormLabel>
                      <FormControl>
                        <QualificationsMultiSelect
                          value={field.value || []}
                          onChange={(vals) => field.onChange(vals)}
                          placeholder="Select qualifications..."
                          maxItems={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldOfStudies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study</FormLabel>
                      <FormControl>
                        <SuggestionInput
                          type="field-of-study"
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Search and add fields of study..."
                          maxItems={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Summary</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief one-line summary of the role..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full-time">Full Time</SelectItem>
                            <SelectItem value="part-time">Part Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">
                              Internship
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="genderPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender Preference (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ageMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Age (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="18"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number(e.target.value) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Age (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="65"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number(e.target.value) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="salary.min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number(e.target.value) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salary.max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Salary</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="80000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number(e.target.value) || undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salary.currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* <FormField
              control={form.control}
              name="otherAllowances"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Other Allowances (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Transport allowance, Health insurance..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

                <FormField
                  control={form.control}
                  name="useCompanyLocation"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Job Location</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          value={field.value ? "true" : "false"}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="true"
                              id="company-location"
                            />
                            <Label htmlFor="company-location">
                              Use company location
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="false"
                              id="custom-location"
                            />
                            <Label htmlFor="custom-location">
                              Search custom location
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!watchedUseCompanyLocation && (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Location</FormLabel>
                        <FormControl>
                          <LocationAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Search for job location..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the role, responsibilities, and what you're looking for..."
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other Allowances checkbox */}
                <FormField
                  control={form.control}
                  name="hasOtherAllowances"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Allowances</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <input
                            id="has-other-allowances"
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4"
                          />
                          <label
                            htmlFor="has-other-allowances"
                            className="text-sm"
                          >
                            Add other allowances
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show multi-select only when checkbox is checked */}
                {form.watch("hasOtherAllowances") && (
                  <FormField
                    control={form.control}
                    name="otherAllowances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Allowances</FormLabel>
                        <FormControl>
                          <MultiSelectWithOther
                            options={allowanceOptions}
                            value={field.value || []}
                            onChange={(vals) => field.onChange(vals)}
                            placeholder="Select allowances..."
                            maxItems={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <div className="flex gap-4 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : job ? "Update Job" : "Create Job"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default JobForm;
