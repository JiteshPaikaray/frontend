import api from "../api/axios";

export async function getStatuses(projectId) {
  const response = await api.get(`/status/getstatus/${projectId}`);
  return response.data;
}
