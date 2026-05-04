import api from "../api/axios";

export async function getTasksByProject(projectId) {
  const response = await api.get(`/tasks/projectbyId/${projectId}`);
  return response.data;
}

export async function getKanbanBoard(projectId) {
  const response = await api.get(`/tasks/kanban/${projectId}`);
  return response.data;
}

export async function getTaskDetails(taskId) {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
}

export async function createTask(payload) {
  const response = await api.post("/tasks/create", payload);
  return response.data;
}

export async function updateTask(payload) {
  const response = await api.put("/tasks/update", payload);
  return response.data;
}

export async function deleteTask(taskId) {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
}

export async function moveTask(taskId, statusId) {
  const response = await api.post("/tasks/move", {
    taskId,
    statusId,
  });
  return response.data;
}

export async function filterTasks(payload) {
  const response = await api.post("/tasks/filter", payload);
  return response.data;
}

export async function addTaskComment(payload) {
  const response = await api.post("/tasks/comments", payload);
  return response.data;
}

export async function getTaskComments(taskId) {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
}
