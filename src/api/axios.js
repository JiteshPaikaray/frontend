import axios from "axios";
import { clearAuthSession, getStoredToken } from "../utils/auth";

const DEFAULT_API_BASE_URL = "https://webapijitesh.runasp.net/api";

function trimTrailingSlash(value = "") {
  return value.replace(/\/+$/, "");
}

const apiBaseUrl = "https://webapijitesh.runasp.net/api"
//trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function getSignalRHubUrl() {
  const explicitHubUrl = "https://webapijitesh.runasp.net/api";

  if (explicitHubUrl) {
    return trimTrailingSlash(explicitHubUrl);
  }

  if (apiBaseUrl.endsWith("/api")) {
    return `${apiBaseUrl.slice(0, -4)}/hubs/notifications`;
  }

  return `${apiBaseUrl}/hubs/notifications`;
}

export function getApiErrorMessage(error, fallbackMessage = "Something went wrong. Please try again.") {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData.trim();
  }

  if (responseData?.message) {
    return String(responseData.message);
  }

  if (responseData?.title) {
    return String(responseData.title);
  }

  if (Array.isArray(responseData?.errors)) {
    return responseData.errors.join(", ");
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthSession();
    }

    return Promise.reject(error);
  }
);

export default api;
