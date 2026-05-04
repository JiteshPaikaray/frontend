import api from "../api/axios";

export async function login(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data;
}

export async function register(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data;
}

export async function getProfile() {
  const response = await api.get("/auth/profile");
  return response.data;
}

export async function updateProfile(payload) {
  const response = await api.put("/auth/profile", payload);
  return response.data;
}

export async function changePassword(payload) {
  const response = await api.post("/auth/change-password", payload);
  return response.data;
}

export async function getTenantUsers() {
  const response = await api.get("/auth/users");
  return response.data;
}
