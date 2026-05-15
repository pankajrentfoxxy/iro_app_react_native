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
  /** API `role.roleName`, e.g. "Volunteer" — preferred for display */
  roleName?: string | null;
  email?: string | null;
  /** Location labels (API profile / registration) */
  state?: string;
  district?: string;
  block?: string;
  dob?: string | null;
  gender?: string | null;
  village?: string | null;
  pincode?: string | null;
  occupation?: string | null;
  education?: string | null;
  avatarUrl?: string;
  networkCount?: number;
  directReferrals?: number;
  nationalRank?: number;
  dayStreak?: number;
  surveyScore?: number;
  tasksCompleted?: number;
  surveysSubmitted?: number;
  status?: string;
  joinedAt?: string;
  /** Server `jurisdiction.boothId` — hierarchy BOOTH location id when assigned */
  boothLocationId?: string | null;
}
