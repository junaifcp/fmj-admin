import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users, CheckCircle, Clock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useRecruiterReferral } from "@/hooks/useRecruiterReferral";
import { Skeleton } from "@/components/ui/skeleton";

const RecruiterReferralCard: React.FC = () => {
  const {
    referralCode,
    referralUrl,
    codeLoading,
    stats,
    statsLoading,
    claimReward,
    isClaimingReward,
  } = useRecruiterReferral();
  const [copied, setCopied] = useState(false);
  console.log(referralCode, referralUrl);
  const handleCopyCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralUrl) {
      try {
        await navigator.share({
          title: "Join FitMyJob as a Recruiter",
          text: `Use my referral code to get started on FitMyJob: ${referralCode}`,
          url: referralUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleClaimReward = async () => {
    try {
      const result = await claimReward();
      toast.success(result.message || "Reward claimed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to claim reward");
    }
  };

  if (codeLoading || statsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Referral Program
            </CardTitle>
            <CardDescription>
              Refer 2 recruiters and get 1 month free Starter plan!
            </CardDescription>
          </div>
          {stats?.canClaimReward && (
            <Badge variant="default" className="animate-pulse">
              Reward Available!
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex gap-2">
            <Input
              value={referralCode || ""}
              readOnly
              className="font-mono text-lg"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              disabled={!referralCode}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              disabled={!referralUrl}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {stats?.totalReferrals || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats?.completedReferrals || 0}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.pendingReferrals || 0}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats?.availableCredits || 0}
            </div>
            <div className="text-xs text-muted-foreground">Credits</div>
          </div>
        </div>

        {/* Claim Reward Button */}
        {stats?.canClaimReward && (
          <Button
            onClick={handleClaimReward}
            disabled={isClaimingReward}
            className="w-full"
            size="lg"
          >
            <Gift className="h-4 w-4 mr-2" />
            {isClaimingReward ? "Claiming..." : "Claim Your Free Month!"}
          </Button>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress to next reward
            </span>
            <span className="font-medium">
              {Math.min(stats?.creditsEarned || 0, 2)}/2
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.min((stats?.creditsEarned || 0) / 2, 1) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Recent Referrals */}
        {stats?.referrals && stats.referrals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recent Referrals
            </h4>
            <div className="space-y-2">
              {stats.referrals.slice(0, 3).map((referral) => (
                <div
                  key={referral._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {referral.referredUser.firstName ||
                          referral.referredUser.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      referral.status === "completed"
                        ? "default"
                        : referral.status === "rewarded"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {referral.status === "completed" && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {referral.status === "pending" && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {referral.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">How it works:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>1. Share your referral code with other recruiters</li>
            <li>2. They sign up and make their first payment</li>
            <li>3. You earn 1 credit per successful referral</li>
            <li>4. Every 2 credits = 1 month free Starter plan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecruiterReferralCard;
