import api from "../api/axios";

export async function getProjects() {
  const response = await api.get("/project");
  return response.data;
}

export async function createProject(payload) {
  const response = await api.post("/project/create", payload);
  return response.data;
}

export async function getProjectDetails(projectId) {
  const response = await api.get(`/project/${projectId}`);
  return response.data;
}

export async function updateProject(payload) {
  const response = await api.put("/project/update", payload);
  return response.data;
}

export async function deleteProject(projectId) {
  const response = await api.delete(`/project/${projectId}`);
  return response.data;
}

export async function addProjectMember(projectId, userId) {
  const response = await api.post(`/project/${projectId}/members`, null, {
    params: { userId },
  });
  return response.data;
}

export async function removeProjectMember(projectId, userId) {
  const response = await api.delete(`/project/${projectId}/members/${userId}`);
  return response.data;
}

export async function getProjectMembers(projectId) {
  const response = await api.get(`/project/${projectId}/members`);
  return response.data;
}
