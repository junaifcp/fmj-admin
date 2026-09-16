// src/components/public/OTPVerification.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
import { Mail, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  temporaryUploadId: string;
  onVerified: () => void;
  onResendOTP: () => Promise<void>;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  temporaryUploadId,
  onVerified,
  onResendOTP,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setVerificationStatus("idle");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }

    setIsVerifying(true);
    setVerificationStatus("idle");

    try {
      const { verifyOTP } = await import("@/api/public");
      const result = await verifyOTP(temporaryUploadId, otpCode);

      if (result.verified) {
        setVerificationStatus("success");
        toast.success("Email verified successfully!");
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setVerificationStatus("error");
        toast.error(result.message || "Invalid OTP code. Please try again.");
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      setVerificationStatus("error");
      toast.error(error?.message || "Failed to verify OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendOTP();
      toast.success("OTP sent successfully! Please check your email.");
      setOtp(["", "", "", "", "", ""]);
      setVerificationStatus("idle");
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Verify Your Email
        </CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Enter Verification Code</Label>
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-12 text-center text-lg font-semibold ${
                  verificationStatus === "error" ? "border-destructive" : ""
                } ${
                  verificationStatus === "success" ? "border-green-500" : ""
                }`}
                disabled={isVerifying}
              />
            ))}
          </div>
          {verificationStatus === "error" && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive text-center flex items-center justify-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Invalid code. Please try again.
            </motion.p>
          )}
          {verificationStatus === "success" && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 text-center flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              Email verified successfully!
            </motion.p>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={isVerifying || otp.join("").length !== 6}
            className="w-full"
            size="lg"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              className="text-sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending ? "Sending..." : "Resend OTP"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Didn't receive the code? Check your spam folder or click "Resend
            OTP" above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
