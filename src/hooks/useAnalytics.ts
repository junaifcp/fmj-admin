import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import analyticsService from "@/services/AnalyticsService";

export const useAnalytics = () => {
  const { user, isLoaded } = useUser();

  // Initialize analytics and identify user when authentication is loaded
  useEffect(() => {
    if (isLoaded) {
      analyticsService.init();

      if (user) {
        analyticsService.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName,
          createdAt: user.createdAt,
        });
      }
    }
  }, [user, isLoaded]);

  return {
    // User Account Events
    trackUserSignUp: (userProperties = {}) => {
      analyticsService.userSignedUp(userProperties);
    },

    trackUserLogIn: (userProperties = {}) => {
      analyticsService.userLoggedIn(userProperties);
    },

    // Recruiter-Specific Events
    trackJobPosted: (jobData = {}) => {
      analyticsService.jobPosted(jobData);
    },

    trackJobEdited: (jobData = {}) => {
      analyticsService.jobEdited(jobData);
    },

    trackJobDeleted: (jobData = {}) => {
      analyticsService.jobDeleted(jobData);
    },

    trackJobStatusChanged: (jobData = {}) => {
      analyticsService.jobStatusChanged(jobData);
    },

    trackCandidateViewed: (candidateData = {}) => {
      analyticsService.candidateViewed(candidateData);
    },

    trackCandidateShortlisted: (candidateData = {}) => {
      analyticsService.candidateShortlisted(candidateData);
    },

    trackCandidateRejected: (candidateData = {}) => {
      analyticsService.candidateRejected(candidateData);
    },

    trackCandidateHired: (candidateData = {}) => {
      analyticsService.candidateHired(candidateData);
    },

    trackInterviewScheduled: (interviewData = {}) => {
      analyticsService.interviewScheduled(interviewData);
    },

    trackApplicationViewed: (applicationData = {}) => {
      analyticsService.applicationViewed(applicationData);
    },

    trackBulkActionPerformed: (actionData = {}) => {
      analyticsService.bulkActionPerformed(actionData);
    },

    trackCandidateSearched: (searchData = {}) => {
      analyticsService.candidateSearched(searchData);
    },

    trackApplicationFiltered: (filterData = {}) => {
      analyticsService.applicationFiltered(filterData);
    },

    // Subscription Events
    trackSubscriptionFlowStarted: (triggerLocation = "pricing_page") => {
      analyticsService.subscriptionFlowStarted(triggerLocation);
    },

    trackSubscriptionPlanSelected: (planData = {}) => {
      analyticsService.subscriptionPlanSelected(planData);
    },

    trackSubscriptionSuccessful: (subscriptionData = {}) => {
      analyticsService.subscriptionSuccessful(subscriptionData);
    },

    trackPaymentFailed: (failureData = {}) => {
      analyticsService.paymentFailed(failureData);
    },

    // Page Tracking
    trackPageView: (pageName, additionalProperties = {}) => {
      analyticsService.pageView(pageName, additionalProperties);
    },

    // Utility
    setUserProperties: (properties = {}) => {
      analyticsService.setUserProperties(properties);
    },

    trackMetaEvent: (eventName: string, data = {}) => {
      analyticsService.trackMetaEvent(eventName, data);
    },

    trackGTMEvent: (eventName: string, data = {}) => {
      analyticsService.trackGTMEvent(eventName, data);
    },

    // Profile & Company Management
    trackProfileUpdated: (profileData = {}) => {
      analyticsService.profileUpdated(profileData);
    },

    trackCompanyCreated: (companyData = {}) => {
      analyticsService.companyCreated(companyData);
    },

    trackCompanyUpdated: (companyData = {}) => {
      analyticsService.companyUpdated(companyData);
    },

    // Enhanced Job Events
    trackJobViewed: (jobData = {}) => {
      analyticsService.jobViewed(jobData);
    },

    trackJobLimitReached: (limitData = {}) => {
      analyticsService.jobLimitReached(limitData);
    },

    // Application Management
    trackApplicationStatusUpdated: (statusData = {}) => {
      analyticsService.applicationStatusUpdated(statusData);
    },

    trackCandidateResumeViewed: (resumeData = {}) => {
      analyticsService.candidateResumeViewed(resumeData);
    },

    trackCandidateNoteAdded: (noteData = {}) => {
      analyticsService.candidateNoteAdded(noteData);
    },

    // Search & Filter
    trackJobsListFiltered: (filterData = {}) => {
      analyticsService.jobsListFiltered(filterData);
    },

    trackApplicationsListFiltered: (filterData = {}) => {
      analyticsService.applicationsListFiltered(filterData);
    },

    trackCandidatesSearchPerformed: (searchData = {}) => {
      analyticsService.candidatesSearchPerformed(searchData);
    },

    // Navigation & Engagement
    trackDashboardViewed: (dashboardData = {}) => {
      analyticsService.dashboardViewed(dashboardData);
    },

    trackPageNavigated: (pageData = {}) => {
      analyticsService.pageNavigated(pageData);
    },

    // Payment & Subscription Enhancements
    trackCouponApplied: (couponData = {}) => {
      analyticsService.couponApplied(couponData);
    },

    trackPaymentVerificationSuccess: (verificationData = {}) => {
      analyticsService.paymentVerificationSuccess(verificationData);
    },

    trackPaymentVerificationFailed: (failureData = {}) => {
      analyticsService.paymentVerificationFailed(failureData);
    },

    reset: () => {
      analyticsService.reset();
    },
  };
};
