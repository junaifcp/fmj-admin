// Analytics Service - Centralized tracking via GTM & Microsoft Clarity
class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.debugMode = import.meta.env.DEV;
    // Disable analytics in development mode
    this.isDisabled = import.meta.env.VITE_ENV === "development";

    if (this.isDisabled) {
      console.log("🔕 Analytics Service DISABLED (development mode)");
    }
  }

  // Initialize all analytics services
  init() {
    if (this.isInitialized) return;

    // Skip initialization if disabled
    if (this.isDisabled) {
      console.log("⏭️  Skipping analytics initialization (development mode)");
      return;
    }

    try {
      // Ensure GTM dataLayer exists
      this.initGTM();

      this.isInitialized = true;

      if (this.debugMode) {
        console.log("✅ Analytics Service initialized (GTM + Clarity mode)");
        console.log("   - GTM loaded via index.html script");
        console.log("   - Clarity loaded via index.html script");
      }
    } catch (error) {
      console.error("Failed to initialize Analytics Service:", error);
    }
  }

  // Initialize GTM dataLayer
  initGTM() {
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      if (this.debugMode) {
        console.log("✅ GTM dataLayer initialized");
      }
    }
  }

  // Identify user (push to GTM for forwarding to other platforms)
  identify(userId, userProperties = {}) {
    if (this.isDisabled) return; // Skip if disabled
    if (!this.isInitialized) this.init();

    try {
      // Push user identification to GTM
      this.pushToDataLayer({
        event: "user_identified",
        user_id: userId,
        user_email: userProperties.email,
        user_name: userProperties.name,
        user_created_at: userProperties.createdAt,
        user_role: "recruiter",
        ...userProperties,
      });

      // Identify in Microsoft Clarity
      if (typeof window !== "undefined" && window.clarity) {
        window.clarity("identify", userId, {
          email: userProperties.email,
          name: userProperties.name,
          role: "recruiter",
        });
      }

      if (this.debugMode) {
        console.log("👤 User identified:", userId, userProperties);
      }
    } catch (error) {
      console.error("Failed to identify user:", error);
    }
  }

  // Core method: Push events to GTM dataLayer
  pushToDataLayer(data) {
    if (this.isDisabled) return; // Skip if disabled
    if (!this.isInitialized) this.init();

    try {
      if (typeof window !== "undefined" && window.dataLayer) {
        // Enrich with common properties
        const enrichedData = {
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          page_title: document.title,
          page_path: window.location.pathname,
          user_type: "recruiter",
          ...data,
        };

        window.dataLayer.push(enrichedData);

        if (this.debugMode) {
          console.log("📊 GTM Event:", enrichedData);
        }
      }
    } catch (error) {
      console.error("Failed to push to dataLayer:", error);
    }
  }

  // Generic event tracking (all events go through GTM)
  track(eventName, properties = {}) {
    this.pushToDataLayer({
      event: "custom_event",
      event_name: eventName,
      ...properties,
    });
  }

  // === USER ACCOUNT EVENTS ===

  userSignedUp(userProperties = {}) {
    this.pushToDataLayer({
      event: "user_signup",
      user_id: userProperties.userId,
      signup_method: userProperties.method || "email",
      user_type: "recruiter",
      ...userProperties,
    });
  }

  userLoggedIn(userProperties = {}) {
    this.pushToDataLayer({
      event: "user_login",
      user_id: userProperties.userId,
      login_method: userProperties.method || "email",
      user_type: "recruiter",
      ...userProperties,
    });
  }

  // === RECRUITER-SPECIFIC EVENTS ===

  jobPosted(jobData = {}) {
    this.pushToDataLayer({
      event: "job_posted",
      job_id: jobData.jobId,
      job_title: jobData.title,
      job_type: jobData.type,
      job_location: jobData.location,
      remote: jobData.remote || false,
      salary_min: jobData.salaryMin,
      salary_max: jobData.salaryMax,
      experience_min: jobData.experienceMin,
      experience_max: jobData.experienceMax,
    });
  }

  jobEdited(jobData = {}) {
    this.pushToDataLayer({
      event: "job_edited",
      job_id: jobData.jobId,
      job_title: jobData.title,
    });
  }

  jobDeleted(jobData = {}) {
    this.pushToDataLayer({
      event: "job_deleted",
      job_id: jobData.jobId,
      job_title: jobData.title,
    });
  }

  jobStatusChanged(jobData = {}) {
    this.pushToDataLayer({
      event: "job_status_changed",
      job_id: jobData.jobId,
      old_status: jobData.oldStatus,
      new_status: jobData.newStatus,
    });
  }

  candidateViewed(candidateData = {}) {
    this.pushToDataLayer({
      event: "candidate_viewed",
      candidate_id: candidateData.candidateId,
      job_id: candidateData.jobId,
      source: candidateData.source || "application_list",
    });
  }

  candidateShortlisted(candidateData = {}) {
    this.pushToDataLayer({
      event: "candidate_shortlisted",
      candidate_id: candidateData.candidateId,
      job_id: candidateData.jobId,
      application_id: candidateData.applicationId,
    });
  }

  candidateRejected(candidateData = {}) {
    this.pushToDataLayer({
      event: "candidate_rejected",
      candidate_id: candidateData.candidateId,
      job_id: candidateData.jobId,
      application_id: candidateData.applicationId,
      rejection_reason: candidateData.reason,
    });
  }

  candidateHired(candidateData = {}) {
    this.pushToDataLayer({
      event: "candidate_hired",
      candidate_id: candidateData.candidateId,
      job_id: candidateData.jobId,
      application_id: candidateData.applicationId,
    });
  }

  interviewScheduled(interviewData = {}) {
    this.pushToDataLayer({
      event: "interview_scheduled",
      candidate_id: interviewData.candidateId,
      job_id: interviewData.jobId,
      interview_type: interviewData.type,
      interview_date: interviewData.date,
    });
  }

  applicationViewed(applicationData = {}) {
    this.pushToDataLayer({
      event: "application_viewed",
      application_id: applicationData.applicationId,
      job_id: applicationData.jobId,
      candidate_id: applicationData.candidateId,
    });
  }

  bulkActionPerformed(actionData = {}) {
    this.pushToDataLayer({
      event: "bulk_action_performed",
      action_type: actionData.actionType,
      items_count: actionData.count,
      job_id: actionData.jobId,
    });
  }

  // === SUBSCRIPTION FUNNEL EVENTS ===

  subscriptionFlowStarted(triggerLocation = "pricing_page") {
    this.pushToDataLayer({
      event: "subscription_flow_started",
      trigger_location: triggerLocation,
      user_type: "recruiter",
    });
  }

  subscriptionPlanSelected(planData = {}) {
    this.pushToDataLayer({
      event: "subscription_plan_selected",
      plan_name: planData.planName || "Unknown Plan",
      price: planData.price || 0,
      currency: planData.currency || "USD",
      billing_cycle: planData.billingCycle || "monthly",
      user_type: "recruiter",
    });
  }

  subscriptionSuccessful(subscriptionData = {}) {
    this.pushToDataLayer({
      event: "purchase",
      transaction_id: subscriptionData.transactionId || null,
      value: subscriptionData.price || 0,
      currency: subscriptionData.currency || "USD",
      user_type: "recruiter",
      items: [
        {
          item_id: subscriptionData.planName || "Unknown Plan",
          item_name: subscriptionData.planName || "Unknown Plan",
          item_category: "subscription",
          price: subscriptionData.price || 0,
          quantity: 1,
        },
      ],
    });
  }

  paymentFailed(failureData = {}) {
    this.pushToDataLayer({
      event: "payment_failed",
      plan_name: failureData.planName || "Unknown Plan",
      price: failureData.price || 0,
      failure_reason: failureData.reason || "unknown_error",
      error_code: failureData.errorCode || null,
      user_type: "recruiter",
    });
  }

  // === SEARCH & FILTER EVENTS ===

  candidateSearched(searchData = {}) {
    this.pushToDataLayer({
      event: "candidate_search",
      query: searchData.query,
      filters: searchData.filters,
      results_count: searchData.resultsCount,
    });
  }

  applicationFiltered(filterData = {}) {
    this.pushToDataLayer({
      event: "application_filtered",
      job_id: filterData.jobId,
      filter_type: filterData.filterType,
      filter_value: filterData.filterValue,
      results_count: filterData.resultsCount,
    });
  }

  // === PAGE VIEW TRACKING ===

  pageView(pageName, additionalProperties = {}) {
    this.pushToDataLayer({
      event: "page_view",
      page_name: pageName,
      ...additionalProperties,
    });
  }

  // === UTILITY METHODS ===

  // Set user properties (sent via GTM to all platforms)
  setUserProperties(properties = {}) {
    this.pushToDataLayer({
      event: "user_properties_updated",
      ...properties,
    });
  }

  // Reset user (useful for logout)
  reset() {
    if (this.isDisabled) return; // Skip if disabled

    this.pushToDataLayer({
      event: "user_logout",
      user_type: "recruiter",
    });

    if (this.debugMode) {
      console.log("🔄 Analytics reset (user logged out)");
    }
  }

  // Custom GTM event (for flexibility)
  trackGTMEvent(eventName, parameters = {}) {
    this.pushToDataLayer({
      event: eventName,
      ...parameters,
    });
  }

  // Legacy methods for backward compatibility
  trackMetaEvent(eventName, data = {}) {
    // Now handled via GTM
    this.pushToDataLayer({
      event: `meta_${eventName.toLowerCase()}`,
      ...data,
    });
  }

  // === PROFILE & COMPANY MANAGEMENT EVENTS ===

  profileUpdated(profileData = {}) {
    this.pushToDataLayer({
      event: "profile_updated",
      user_id: profileData.userId,
      fields_updated: profileData.fieldsUpdated || [],
    });
  }

  companyCreated(companyData = {}) {
    this.pushToDataLayer({
      event: "company_created",
      company_id: companyData.companyId,
      company_name: companyData.name,
      industry: companyData.industry,
    });
  }

  companyUpdated(companyData = {}) {
    this.pushToDataLayer({
      event: "company_updated",
      company_id: companyData.companyId,
      company_name: companyData.name,
      fields_updated: companyData.fieldsUpdated || [],
    });
  }

  // === ENHANCED JOB EVENTS ===

  jobViewed(jobData = {}) {
    this.pushToDataLayer({
      event: "job_viewed",
      job_id: jobData.jobId,
      job_title: jobData.title,
      job_status: jobData.status,
    });
  }

  jobLimitReached(limitData = {}) {
    this.pushToDataLayer({
      event: "job_limit_reached",
      current_plan: limitData.planName || "free",
      jobs_posted: limitData.jobsPosted || 0,
      limit: limitData.limit || 0,
    });
  }

  // === APPLICATION MANAGEMENT EVENTS ===

  applicationStatusUpdated(statusData = {}) {
    this.pushToDataLayer({
      event: "application_status_updated",
      application_id: statusData.applicationId,
      job_id: statusData.jobId,
      candidate_id: statusData.candidateId,
      old_status: statusData.oldStatus,
      new_status: statusData.newStatus,
      action_type: statusData.actionType,
    });
  }

  candidateResumeViewed(resumeData = {}) {
    this.pushToDataLayer({
      event: "candidate_resume_viewed",
      candidate_id: resumeData.candidateId,
      job_id: resumeData.jobId,
      application_id: resumeData.applicationId,
      source: resumeData.source || "unknown",
    });
  }

  candidateNoteAdded(noteData = {}) {
    this.pushToDataLayer({
      event: "candidate_note_added",
      candidate_id: noteData.candidateId,
      job_id: noteData.jobId,
      note_private: noteData.isPrivate || false,
    });
  }

  // === SEARCH & FILTER EVENTS ===

  jobsListFiltered(filterData = {}) {
    this.pushToDataLayer({
      event: "jobs_list_filtered",
      filter_status: filterData.status,
      filter_type: filterData.type,
      results_count: filterData.resultsCount,
    });
  }

  applicationsListFiltered(filterData = {}) {
    this.pushToDataLayer({
      event: "applications_list_filtered",
      job_id: filterData.jobId,
      filter_status: filterData.status,
      results_count: filterData.resultsCount,
    });
  }

  candidatesSearchPerformed(searchData = {}) {
    this.pushToDataLayer({
      event: "candidates_search_performed",
      query: searchData.query,
      filters: searchData.filters,
      results_count: searchData.resultsCount,
    });
  }

  // === NAVIGATION & ENGAGEMENT EVENTS ===

  dashboardViewed(dashboardData = {}) {
    this.pushToDataLayer({
      event: "dashboard_viewed",
      stats_loaded: dashboardData.statsLoaded || false,
    });
  }

  pageNavigated(pageData = {}) {
    this.pushToDataLayer({
      event: "page_navigated",
      from_page: pageData.fromPage,
      to_page: pageData.toPage,
      navigation_type: pageData.navigationType || "link",
    });
  }

  // === PAYMENT & SUBSCRIPTION ENHANCEMENTS ===

  couponApplied(couponData = {}) {
    this.pushToDataLayer({
      event: "coupon_applied",
      coupon_code: couponData.couponCode,
      discount_amount: couponData.discountAmount || 0,
      discount_type: couponData.discountType || "percentage",
      plan_name: couponData.planName,
    });
  }

  paymentVerificationSuccess(verificationData = {}) {
    this.pushToDataLayer({
      event: "payment_verification_success",
      order_id: verificationData.orderId,
      subscription_id: verificationData.subscriptionId,
      amount: verificationData.amount,
    });
  }

  paymentVerificationFailed(failureData = {}) {
    this.pushToDataLayer({
      event: "payment_verification_failed",
      order_id: failureData.orderId,
      error_message: failureData.errorMessage,
    });
  }
}

// Create and export a singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
