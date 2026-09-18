import React from "react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";

interface OtpVerifyFormProps {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
  isSubmitting: boolean;
  isResending: boolean;
  error: string | null;
}

const OtpVerifyForm: React.FC<OtpVerifyFormProps> = ({
  email,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  onChangeEmail,
  isSubmitting,
  isResending,
  error,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting && code.length === 6) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        If the email is eligible, a code was sent to <strong>{email}</strong>.
      </p>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={onCodeChange}
          disabled={isSubmitting}
        >
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify code"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-muted-foreground underline decoration-muted-foreground/40 hover:decoration-muted-foreground focus:outline-none"
        >
          Use a different email
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="text-primary underline decoration-primary/30 hover:decoration-primary/60 focus:outline-none disabled:opacity-50"
        >
          {isResending ? "Resending..." : "Resend code"}
        </button>
      </div>
    </form>
  );
};

export default OtpVerifyForm;
