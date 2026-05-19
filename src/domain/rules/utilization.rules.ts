import type { TeamMember } from "../entities/TeamMember";

export function isOverallocated(member: TeamMember): boolean {
  return member.allocationPercent > 100;
}

export function isUnderutilized(member: TeamMember): boolean {
  return member.allocationPercent < 60 && member.availability === "available";
}

export function averageUtilization(members: TeamMember[]): number {
  if (members.length === 0) return 0;
  const total = members.reduce((sum, m) => sum + m.allocationPercent, 0);
  return total / members.length;
}
