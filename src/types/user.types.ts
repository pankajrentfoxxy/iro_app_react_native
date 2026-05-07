export type UserRole =
  | 'volunteer'
  | 'reformer'
  | 'booth_worker'
  | 'block_leader'
  | 'district_leader'
  | 'state_leader'
  | 'national_exec'
  | 'president';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  reformerId: string;
  role: UserRole;
  state?: string;
  district?: string;
  avatarUrl?: string;
  networkCount?: number;
  directReferrals?: number;
  nationalRank?: number;
  dayStreak?: number;
  surveyScore?: number;
  joinedAt?: string;
}
