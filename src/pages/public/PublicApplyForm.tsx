import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { ResumeUpload } from "@/components/public/ResumeUpload";
import { OTPVerification } from "@/components/public/OTPVerification";
import { ApplicationReview } from "@/components/public/ApplicationReview";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Building2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getJobByPublicLink,
  initiateApplication,
  sendOTP,
  uploadResume,
  submitApplication,
  getApplicationStatus,
} from "@/api/public";

const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  coverLetter: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, title: "Job Details", description: "Review the position" },
  { id: 2, title: "Your Information", description: "Personal details" },
  { id: 3, title: "Email Verification", description: "Verify your email" },
  { id: 4, title: "Resume & Cover Letter", description: "Upload your resume" },
  { id: 5, title: "Review", description: "Review and submit" },
];

const PublicApplyForm: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [signInUrl, setSignInUrl] = useState<string | null>(null);
  const [temporaryUploadId, setTemporaryUploadId] = useState<string | null>(
    null
  );
  const [emailVerified, setEmailVerified] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<{
    name: string;
    email: string;
    phone?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  // Fetch job details
  const {
    data: jobData,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery({
    queryKey: ["jobByPublicLink", uniqueId],
    queryFn: async () => {
      if (!uniqueId) throw new Error("Public link ID is required");
      return await getJobByPublicLink(uniqueId);
    },
    enabled: !!uniqueId,
    retry: 1,
  });

  // Check application status if we have a temporaryUploadId
  const { data: applicationStatus } = useQuery({
    queryKey: ["applicationStatus", temporaryUploadId],
    queryFn: async () => {
      if (!temporaryUploadId)
        throw new Error("Temporary upload ID is required");
      return await getApplicationStatus(temporaryUploadId);
    },
    enabled: !!temporaryUploadId,
    refetchInterval: (query) => {
      // Poll if resume is still processing
      const data = query.state.data;
      return data?.temporaryUpload?.status === "processing" ? 3000 : false;
    },
  });

  // Update step based on application status
  useEffect(() => {
    if (applicationStatus) {
      const status = applicationStatus.temporaryUpload;
      if (status.emailVerified && !emailVerified) {
        setEmailVerified(true);
        if (currentStep === 3) {
          setCurrentStep(4);
        }
      }
      if (status.fileUrl && currentStep < 4) {
        // Resume already uploaded, skip to review
        setCurrentStep(5);
      }
    }
  }, [applicationStatus, emailVerified, currentStep]);

  const handleNext = async () => {
    if (currentStep === 1) {
      // Step 1: Job Details - just move to next
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2: Personal Information - validate and initiate application
      const isValid = await trigger(["name", "email"]);
      if (isValid) {
        const formData = watch();
        try {
          if (!uniqueId) {
            toast.error("Invalid application link");
            return;
          }

          const result = await initiateApplication(uniqueId, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          });

          setTemporaryUploadId(result.temporaryUploadId);
          setPersonalInfo({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          });

          if (result.otpSent) {
            toast.success("OTP sent to your email!");
            setCurrentStep(3);
          } else {
            // Email already verified
            setEmailVerified(true);
            setCurrentStep(4);
          }
        } catch (error: any) {
          toast.error(error?.message || "Failed to initiate application");
        }
      }
    } else if (currentStep === 3) {
      // Step 3: OTP Verification - handled by OTPVerification component
      // This step is managed by the OTPVerification component's onVerified callback
    } else if (currentStep === 4) {
      // Step 4: Resume Upload - validate and upload
      if (!resumeFile) {
        toast.error("Please upload your resume to continue");
        return;
      }

      if (!temporaryUploadId) {
        toast.error("Application session expired. Please start over.");
        return;
      }

      try {
        setIsSubmitting(true);
        await uploadResume(temporaryUploadId, resumeFile);
        toast.success("Resume uploaded successfully!");
        setCurrentStep(5);
      } catch (error: any) {
        toast.error(error?.message || "Failed to upload resume");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleOTPVerified = () => {
    setEmailVerified(true);
    setCurrentStep(4);
  };

  const handleResendOTP = async () => {
    if (!temporaryUploadId) {
      throw new Error("Temporary upload ID not found");
    }
    await sendOTP(temporaryUploadId);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!temporaryUploadId) {
      toast.error("Application session expired. Please start over.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitApplication(
        temporaryUploadId,
        data.coverLetter
      );
      setIsSuccess(true);
      toast.success(result.message || "Application submitted successfully!");
    } catch (error: any) {
      // Check if error is a duplicate application with sign-in URL
      // Handle different error response structures
      const errorResponse =
        error?.response?.data || error?.responseData || error?.data || error;

      // Debug: Log error structure to understand what we're receiving
      console.log("Error caught:", {
        error,
        errorResponse,
        responseData: error?.response?.data,
        message: error?.message,
        errorResponseMessage: errorResponse?.message,
      });

      // Check for CONFLICT error with signInUrl in various possible locations
      const errorCode = errorResponse?.error?.code || errorResponse?.code;
      const signInUrlValue =
        errorResponse?.error?.signInUrl ||
        errorResponse?.signInUrl ||
        (errorResponse?.error &&
        typeof errorResponse.error === "object" &&
        "signInUrl" in errorResponse.error
          ? errorResponse.error.signInUrl
          : null);

      // Also check if the message contains "already applied" as a fallback
      const errorMessage = error?.message || errorResponse?.message || "";
      const isDuplicateMessage =
        errorMessage.toLowerCase().includes("already applied") ||
        errorMessage.toLowerCase().includes("already submitted");

      if (
        (errorCode === "CONFLICT" && signInUrlValue) ||
        (isDuplicateMessage && signInUrlValue)
      ) {
        // Show success-like screen for duplicate application (no toast)
        setIsDuplicate(true);
        setSignInUrl(signInUrlValue);
        setIsSubmitting(false); // Reset submitting state immediately
        return; // Exit early to prevent any other error handling
      } else if (isDuplicateMessage && !signInUrlValue) {
        // If it's a duplicate message but no signInUrl, use default sign-in URL
        setIsDuplicate(true);
        setSignInUrl("https://resume.fitmyskill.com/sign-in");
        setIsSubmitting(false);
        return;
      } else {
        // Only show toast for non-duplicate errors
        toast.error(
          error?.message ||
            errorResponse?.message ||
            "Failed to submit application"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 pb-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading job details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (jobError || !jobData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Application Link Invalid</h2>
            <p className="text-muted-foreground mb-4">
              {jobError
                ? "This application link is invalid or has expired."
                : "Job details not found."}
            </p>
            <Button
              onClick={() =>
                (window.location.href = "https://resume.fitmyskill.com/")
              }
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Duplicate application state
  if (isDuplicate && signInUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 pb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Already Applied!</h2>
              <p className="text-muted-foreground mb-6">
                You have already applied for this job. Please login to view
                application status.
              </p>
              <Button
                onClick={() => {
                  window.location.href = signInUrl;
                }}
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 pb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">
                Application Submitted!
              </h2>
              <p className="text-muted-foreground mb-6">
                Thank you for your interest. We'll review your application and
                get back to you soon.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "https://resume.fitmyskill.com/")
                }
              >
                Return Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const formValues = watch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <p className="text-xs mt-2 text-center hidden sm:block">
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <CardDescription>
                  {steps[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Job Details */}
                  {currentStep === 1 && jobData?.job && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <div>
                          <h3 className="font-semibold">
                            {jobData.job.title || "Job Title"}
                          </h3>
                          {(jobData.job.location || jobData.job.type) && (
                            <p className="text-sm text-muted-foreground">
                              {jobData.job.location || ""}
                              {jobData.job.location &&
                                jobData.job.type &&
                                " • "}
                              {jobData.job.type || ""}
                            </p>
                          )}
                          {jobData.job.salary && (
                            <p className="text-sm text-muted-foreground">
                              {jobData.job.salary.currency || "$"}
                              {jobData.job.salary.min
                                ? jobData.job.salary.min.toLocaleString()
                                : ""}
                              {jobData.job.salary.max &&
                                ` - ${jobData.job.salary.max.toLocaleString()}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Review the job details above. Click "Next" to continue
                        with your application.
                      </p>
                    </div>
                  )}

                  {/* Step 2: Personal Information */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="John Doe"
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="john.doe@example.com"
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          {...register("phone")}
                          placeholder="+1 (555) 123-4567"
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: OTP Verification */}
                  {currentStep === 3 && personalInfo && temporaryUploadId && (
                    <OTPVerification
                      email={personalInfo.email}
                      temporaryUploadId={temporaryUploadId}
                      onVerified={handleOTPVerified}
                      onResendOTP={handleResendOTP}
                    />
                  )}

                  {/* Step 4: Resume Upload */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <ResumeUpload
                        onFileSelect={setResumeFile}
                        selectedFile={resumeFile}
                        onRemove={() => setResumeFile(null)}
                      />
                      <div>
                        <Label htmlFor="coverLetter">
                          Cover Letter (Optional)
                        </Label>
                        <Textarea
                          id="coverLetter"
                          {...register("coverLetter")}
                          placeholder="Tell us why you're interested in this position..."
                          rows={6}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Review */}
                  {currentStep === 5 && personalInfo && jobData?.job && (
                    <ApplicationReview
                      personalInfo={personalInfo}
                      resumeFile={resumeFile}
                      resumeUrl={applicationStatus?.temporaryUpload?.fileUrl}
                      coverLetter={formValues.coverLetter}
                      jobTitle={jobData.job.title || "Job Title"}
                    />
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1 || currentStep === 3}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    {currentStep < steps.length && currentStep !== 3 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : currentStep === steps.length ? (
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PublicApplyForm;
