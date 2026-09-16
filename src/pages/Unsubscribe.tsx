import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  AlertCircle,
} from "lucide-react";
import { verifyUnsubscribeToken, unsubscribe } from "@/services/unsubscribeApi";
import { useToast } from "@/hooks/use-toast";

const Unsubscribe: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnsubscribeInfo = async () => {
      if (!token) {
        setError("Invalid unsubscribe link");
        setLoading(false);
        return;
      }

      try {
        const info = await verifyUnsubscribeToken(token);
        setEmail(info.email);
        setUnsubscribed(info.isUnsubscribed);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Invalid or expired unsubscribe link"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUnsubscribeInfo();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    try {
      setVerifying(true);
      const result = await unsubscribe(token);
      setUnsubscribed(true);
      setEmail(result.email);
      toast({
        title: "Successfully unsubscribed",
        description: `You have been unsubscribed from marketing emails for ${result.email}`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to unsubscribe",
        description:
          err.response?.data?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Loading unsubscribe page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <CardTitle>Invalid Unsubscribe Link</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          {unsubscribed ? (
            <>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <CardTitle>Already Unsubscribed</CardTitle>
              </div>
              <CardDescription>
                You have already unsubscribed from marketing emails
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Unsubscribe from Marketing Emails</CardTitle>
              </div>
              <CardDescription>
                You are about to unsubscribe from marketing emails for{" "}
                <span className="font-semibold">{email}</span>
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {unsubscribed ? (
            <>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      You will no longer receive marketing emails from us. You
                      will still receive important transactional emails (account
                      updates, password resets, etc.).
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Go to Home
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This will unsubscribe you from marketing emails. You will
                      still receive important transactional emails.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleUnsubscribe}
                disabled={verifying}
                className="w-full"
                variant="destructive"
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unsubscribing...
                  </>
                ) : (
                  "Unsubscribe"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
                disabled={verifying}
              >
                Cancel
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
