/**
 * Local registration wizard fields — sent to POST /auth/register with registerToken + phone.
 */
export interface RegisterWizardDraft {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  state: string;
  district: string;
  block: string;
  village: string;
  pincode: string;
  occupation: string;
  education: string;
  referralCode?: string;
}
