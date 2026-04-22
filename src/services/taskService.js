import api from "../api/axios";

export const getTasksByProject = async (projectId) => {
  const res = await api.get(`/tasks/projectbyId/${projectId}`);
  return res.data;
};
export const moveTask = async (taskId, statusId) => {
  await api.post("/tasks/move", {
    taskId,
    statusId,
  });
};