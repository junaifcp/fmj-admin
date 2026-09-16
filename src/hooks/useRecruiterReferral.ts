import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '@/utils/auth';
import {
  getMyReferralCode,
  getReferralStats,
  claimReferralReward,
} from '@/api/recruiter';

export const useRecruiterReferral = () => {
  const { getAuthToken } = useAuthToken();
  const queryClient = useQueryClient();

  // Get my referral code
  const { data: referralCodeData, isLoading: codeLoading } = useQuery({
    queryKey: ['myReferralCode'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      return getMyReferralCode();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get referral stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['referralStats'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      return getReferralStats();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Claim reward
  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error('No auth token');
      return claimReferralReward();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralStats'] });
    },
  });

  return {
    referralCode: referralCodeData?.referralCode,
    referralUrl: referralCodeData?.referralUrl,
    codeLoading,
    stats,
    statsLoading,
    refetchStats,
    claimReward: claimRewardMutation.mutateAsync,
    isClaimingReward: claimRewardMutation.isPending,
  };
};
