import type { UserProfile, UserRole } from '@/src/types/user.types';

/** Shape from iro-server `authService.publicUser` */
export type IroPublicUser = {
  id: string;
  fullName: string;
  email?: string | null;
  referralCode: string;
  role?: { id: string; levelCode: string; roleName: string } | null;
  profile?: {
    dob: string | null;
    gender: string | null;
    village: string | null;
    pincode: string | null;
    occupation: string | null;
    education: string | null;
    stateName: string | null;
    districtName: string | null;
    blockName: string | null;
  };
  jurisdiction?: {
    stateId?: string | null;
    districtId?: string | null;
    blockId?: string | null;
    boothId?: string | null;
  };
  stats?: {
    leadershipScore?: unknown;
    peerRatingAvg?: unknown;
    totalReferrals?: number;
    networkSize?: number;
    tasksCompleted?: number;
    surveysSubmitted?: number;
    daysActive?: number;
  };
  status?: string;
  createdAt?: string;
};

function mapIroRole(role: unknown): UserRole {
  if (!role || typeof role !== 'object') return 'reformer';
  const { levelCode, roleName } = role as { levelCode?: string; roleName?: string };
  const name = `${roleName ?? ''}`.toLowerCase();
  const code = `${levelCode ?? ''}`.toLowerCase();

  if (name.includes('president')) return 'president';
  if (name.includes('national')) return 'national_exec';
  if (name.includes('state')) return 'state_leader';
  if (name.includes('district')) return 'district_leader';
  if (name.includes('block')) return 'block_leader';
  if (name.includes('booth')) return 'booth_worker';
  if (name.includes('volunteer') || code === 'l8') return 'volunteer';
  return 'reformer';
}

export function iroUserToProfile(user: IroPublicUser, phone: string): UserProfile {
  const stats = user.stats ?? {};
  const p = user.profile;
  return {
    id: user.id,
    name: user.fullName,
    phone,
    reformerId: user.referralCode,
    role: mapIroRole(user.role),
    roleName: user.role?.roleName ?? undefined,
    email: user.email ?? undefined,
    state: p?.stateName ?? undefined,
    district: p?.districtName ?? undefined,
    block: p?.blockName ?? undefined,
    dob: p?.dob,
    gender: p?.gender ?? undefined,
    village: p?.village ?? undefined,
    pincode: p?.pincode ?? undefined,
    occupation: p?.occupation ?? undefined,
    education: p?.education ?? undefined,
    networkCount: Number(stats.networkSize ?? 0),
    directReferrals: Number(stats.totalReferrals ?? 0),
    nationalRank: Number(stats.leadershipScore ?? 0),
    dayStreak: Number(stats.daysActive ?? 0),
    surveyScore: Number(stats.peerRatingAvg ?? 0),
    tasksCompleted: Number(stats.tasksCompleted ?? 0),
    surveysSubmitted: Number(stats.surveysSubmitted ?? 0),
    status: user.status,
    joinedAt: user.createdAt,
  };
}
