import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface OtpRequestFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const OtpRequestForm: React.FC<OtpRequestFormProps> = ({
  email,
  onEmailChange,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting && email.trim()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp-email">Email address</Label>
        <Input
          id="otp-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || !email.trim()}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending code...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );
};

export default OtpRequestForm;
