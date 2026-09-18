import React, { useState } from "react";
import { requestOtp, verifyOtp, useAuth } from "@/auth";
import OtpRequestForm from "./OtpRequestForm";
import OtpVerifyForm from "./OtpVerifyForm";

type Step = "email" | "verify";

const INVALID_CODE_MESSAGE = "Invalid or expired code";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

function getErrorMessage(err: any, fallback: string): string {
  return err?.response?.data?.message || fallback;
}

interface AdminOtpFormProps {
  onAuthenticated?: () => void;
}

/**
 * Passwordless email OTP login for the admin console (jwt-authentication
 * phase 9.2). Login only — the backend never creates a user on this portal,
 * and an unknown email verifies to the same generic 401 as a bad code.
 * Portal is never passed explicitly; requestOtp/verifyOtp fall back to this
 * app's PORTAL ('admin', src/auth/types.ts).
 */
const AdminOtpForm: React.FC<AdminOtpFormProps> = ({ onAuthenticated }) => {
  const { setSession } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const requestCode = async () => {
    try {
      await requestOtp(email.trim());
      setStep("verify");
      setError(null);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError(getErrorMessage(err, "Please wait before requesting another code."));
        return;
      }
      // Backend never leaks eligibility for non-429 outcomes — proceed to
      // the verify step showing the same generic message either way.
      setStep("verify");
      setError(null);
    }
  };

  const handleRequestOtp = async () => {
    setIsSubmitting(true);
    try {
      await requestCode();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await requestCode();
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await verifyOtp(email.trim(), code);
      setSession(result.accessToken, result.user);
      onAuthenticated?.();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError(INVALID_CODE_MESSAGE);
        setCode("");
      } else {
        // 403 wrong-portal: backend message verbatim, stay on the form.
        setError(getErrorMessage(err, GENERIC_ERROR_MESSAGE));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    setCode("");
    setError(null);
  };

  if (step === "email") {
    return (
      <OtpRequestForm
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleRequestOtp}
        isSubmitting={isSubmitting}
        error={error}
      />
    );
  }

  return (
    <OtpVerifyForm
      email={email}
      code={code}
      onCodeChange={setCode}
      onSubmit={handleVerifyOtp}
      onResend={handleResend}
      onChangeEmail={handleChangeEmail}
      isSubmitting={isSubmitting}
      isResending={isResending}
      error={error}
    />
  );
};

export default AdminOtpForm;
