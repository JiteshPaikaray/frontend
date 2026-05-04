import api from "../api/axios";

export async function getDashboardSummary(projectId) {
  const response = await api.get(`/dashboard/summary/${projectId}`);
  return response.data;
}

export async function getDashboardStatusBreakdown(projectId) {
  const response = await api.get(`/dashboard/status/${projectId}`);
  return response.data;
}

export async function getDashboardUserBreakdown(projectId) {
  const response = await api.get(`/dashboard/users/${projectId}`);
  return response.data;
}

export async function getDashboardOverdue(projectId) {
  const response = await api.get(`/dashboard/overdue/${projectId}`);
  return response.data;
}
