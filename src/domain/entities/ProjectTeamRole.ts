export interface ProjectTeamRole {
  id: string;
  projectId: string; // FK → Project.id
  name: string;
  role: string;
  phone: string;
  email: string;
}
