import apiClient from '@/src/api/client';

export async function fetchInviteAllowedTargets(): Promise<string[]> {
  const { data } = await apiClient.get<{ levels: string[] }>('/referral-invites/allowed-targets');
  return data.levels ?? [];
}

export async function createReferralInvite(body: {
  targetRoleLevel: string;
  maxUses?: number;
  expiresAt?: string | null;
}): Promise<{ code: string; targetRole: string; maxUses: number }> {
  const { data } = await apiClient.post<{ code: string; targetRole: string; maxUses: number }>(
    '/referral-invites',
    body
  );
  return data;
}

export type MyReferralInviteRow = {
  id: string;
  code: string;
  targetRole: string;
  targetRoleName: string;
  maxUses: number;
  usedCount: number;
  remainingUses: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  joinedViaInviteCount: number;
};

export async function fetchMyReferralInvites(): Promise<MyReferralInviteRow[]> {
  const { data } = await apiClient.get<{ invites: MyReferralInviteRow[] }>('/referral-invites/my');
  return data.invites ?? [];
}

export type ReferralNetworkResponse = {
  summary: {
    totalInvites: number;
    usedInvites: number;
    pendingInvites: number;
    exhaustedInvites: number;
    directJoinCount: number;
  };
  invites: Array<{
    id: string;
    code: string;
    targetRole: string;
    maxUses: number;
    usedCount: number;
    remainingUses: number;
    isActive: boolean;
    expiresAt: string | null;
  }>;
  directDownline: Array<{
    userId: string;
    fullName: string;
    joinedAt: string;
    assignedRole: string | null;
    assignedRoleName: string | null;
    joinedViaInviteCode: string | null;
    inviteTargetRole: string | null;
  }>;
  joinedByRoleLevel: Record<string, number>;
};

export async function fetchReferralMyNetwork(): Promise<ReferralNetworkResponse> {
  const { data } = await apiClient.get<ReferralNetworkResponse>('/referrals/my-network');
  return data;
}
