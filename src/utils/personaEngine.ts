export type Persona =
  | 'PASSIVE'
  | 'ACTIVE'
  | 'CONNECTOR'
  | 'INFLUENCER'
  | 'SUPER_NODE'
  | 'NATURAL_LEADER';

export function getPersona(directCount: number, networkCount: number, activityScore: number): Persona {
  if (directCount >= 100 || networkCount >= 500) return 'SUPER_NODE';
  if (directCount >= 50 && activityScore >= 70) return 'NATURAL_LEADER';
  if (directCount >= 50 || networkCount >= 200) return 'INFLUENCER';
  if (directCount >= 10) return 'CONNECTOR';
  if (directCount >= 1) return 'ACTIVE';
  return 'PASSIVE';
}

export function getPersonaMessage(persona: Persona, name: string): string {
  const messages: Record<Persona, string> = {
    PASSIVE: `Welcome to IRO, ${name}! Share your link and bring the first Reformer.`,
    ACTIVE: `Great start, ${name}! Keep sharing — you are building momentum.`,
    CONNECTOR: `${name}, you are a Connector 🔗 Your network is growing! Aim for 50 referrals.`,
    INFLUENCER: `${name}, you are an Influencer 🌟 You have real reach. Consider leading your Booth.`,
    SUPER_NODE: `${name}, you are a Super Node ⚡ Your network is massive. You should lead at Block level.`,
    NATURAL_LEADER: `${name}, data shows you are a Natural Leader 🏆 We want you to run in the upcoming election.`,
  };
  return messages[persona];
}
