import type { Project } from "@/domain/entities/Project";

// Mappers translate raw API/DB shapes into domain entities.
// Mock data is already in domain shape, so these are pass-throughs that
// document the boundary for future backend wiring.
export const ProjectMapper = {
  fromRaw(raw: unknown): Project {
    return raw as Project;
  },
  toRaw(project: Project): unknown {
    return project;
  },
};
