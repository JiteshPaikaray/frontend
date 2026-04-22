import api from "../api/axios";

export const getStatuses = async (projectId) => {
  const res = await api.get(`/status/getstatus/${projectId}`);
  return res.data;
};