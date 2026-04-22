import api from "../api/axios";

export const getProjects = async () => {
  const res = await api.get("/Project");
  return res.data;
};