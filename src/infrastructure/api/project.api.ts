// Reserved for future REST/GraphQL integration. Mock repositories are wired
// today; swap them for HTTP-backed implementations of ProjectRepository.
export const ProjectAPI = {
  listEndpoint: "/api/projects",
  detailEndpoint: (id: string) => `/api/projects/${id}`,
};
