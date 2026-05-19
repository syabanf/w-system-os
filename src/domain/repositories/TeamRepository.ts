import type { TeamMember } from "../entities/TeamMember";

export interface TeamRepository {
  getAll(): Promise<TeamMember[]>;
  getById(id: string): Promise<TeamMember | null>;
  getOverallocated(): Promise<TeamMember[]>;
  getAvailable(): Promise<TeamMember[]>;
}
