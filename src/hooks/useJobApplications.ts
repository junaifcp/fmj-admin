import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Mock data for development - replace with actual API calls when backend is ready
const MOCK_APPLICATIONS = [
  {
    id: "1",
    createdAt: "2024-01-15T10:00:00Z",
    jobTitle: "Senior Frontend Developer",
    companyName: "TechCorp Inc",
    status: "sent" as const,
    companyEmail: "hr@techcorp.com",
  },
  {
    id: "2",
    createdAt: "2024-01-14T15:30:00Z",
    jobTitle: "Full Stack Engineer",
    companyName: "StartupXYZ",
    status: "viewed" as const,
    companyEmail: "careers@startupxyz.com",
  },
  {
    id: "3",
    createdAt: "2024-01-13T09:15:00Z",
    jobTitle: "React Developer",
    companyName: "Digital Solutions",
    status: "responded" as const,
    companyEmail: "jobs@digitalsolutions.com",
  },
];

interface CreateApplicationData {
  resumeId: string;
  coverLetterId?: string;
  jobDescriptionText: string;
  companyEmail: string;
  jobTitle?: string;
  generateCover?: boolean;
}

interface JobApplication {
  id: string;
  createdAt: string;
  jobTitle: string;
  companyName: string;
  status: "draft" | "sent" | "viewed" | "responded" | "rejected" | "queued";
  companyEmail: string;
}

export const useJobApplications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create job application
  const createApplicationMutation = useMutation({
    mutationFn: async (
      data: CreateApplicationData
    ): Promise<JobApplication> => {
      // TODO: Replace with actual API call
      // const response = await apiService.createJobApplication(data);
      // return response;

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newApplication: JobApplication = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        jobTitle: data.jobTitle || "Software Developer",
        companyName:
          data.companyEmail.split("@")[1]?.split(".")[0] || "Company",
        status: "draft",
        companyEmail: data.companyEmail,
      };

      return newApplication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create job application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get recent applications
  const getRecentApplications = async (
    limit: number = 6
  ): Promise<JobApplication[]> => {
    // TODO: Replace with actual API call
    // const response = await apiService.getJobApplications({ limit });
    // return response.data;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_APPLICATIONS.slice(0, limit);
  };

  // Preview application
  const previewApplication = async (
    id: string
  ): Promise<{ htmlPreview: string }> => {
    // TODO: Replace with actual API call
    // const response = await apiService.previewJobApplication(id);
    // return response;

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 300));
    toast({
      title: "Preview",
      description: "Application preview opened successfully.",
    });

    return {
      htmlPreview: "<div>Mock preview content</div>",
    };
  };

  // Send application
  const sendApplicationMutation = useMutation({
    mutationFn: async (id: string): Promise<{ status: string }> => {
      // TODO: Replace with actual API call
      // const response = await apiService.sendJobApplication(id);
      // return response;

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { status: "queued" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({
        title: "Application Sent!",
        description: "Your job application has been queued for sending.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send application. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resend application
  const resendApplication = async (id: string) => {
    return sendApplicationMutation.mutateAsync(id);
  };

  return {
    createApplication: createApplicationMutation.mutateAsync,
    isCreatingApplication: createApplicationMutation.isPending,
    getRecentApplications,
    previewApplication,
    sendApplication: sendApplicationMutation.mutateAsync,
    isSendingApplication: sendApplicationMutation.isPending,
    resendApplication,
  };
};
