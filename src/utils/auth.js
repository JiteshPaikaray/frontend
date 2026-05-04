const AUTH_KEYS = {
  token: "token",
  userId: "userId",
  tenantId: "tenantId",
  roles: "roles",
  selectedProjectId: "selectedProjectId",
};

function readNumber(key) {
  const rawValue = localStorage.getItem(key);
  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_KEYS.token) || "";
}

export function getStoredUserId() {
  return readNumber(AUTH_KEYS.userId);
}

export function getStoredTenantId() {
  return readNumber(AUTH_KEYS.tenantId);
}

export function getStoredRoles() {
  const rawValue = localStorage.getItem(AUTH_KEYS.roles);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function saveAuthSession(session = {}) {
  const token = session.token || "";
  const userId = session.userId ?? session.id ?? "";
  const tenantId = session.tenantId ?? "";
  const roles = Array.isArray(session.roles) ? session.roles : [];

  localStorage.setItem(AUTH_KEYS.token, token);
  localStorage.setItem(AUTH_KEYS.userId, String(userId));
  localStorage.setItem(AUTH_KEYS.tenantId, String(tenantId));
  localStorage.setItem(AUTH_KEYS.roles, JSON.stringify(roles));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEYS.token);
  localStorage.removeItem(AUTH_KEYS.userId);
  localStorage.removeItem(AUTH_KEYS.tenantId);
  localStorage.removeItem(AUTH_KEYS.roles);
  localStorage.removeItem(AUTH_KEYS.selectedProjectId);
}

export function hasAuthSession() {
  return Boolean(getStoredToken());
}

export function getStoredSelectedProjectId() {
  return readNumber(AUTH_KEYS.selectedProjectId);
}

export function setStoredSelectedProjectId(projectId) {
  if (projectId == null) {
    localStorage.removeItem(AUTH_KEYS.selectedProjectId);
    return;
  }

  localStorage.setItem(AUTH_KEYS.selectedProjectId, String(projectId));
}
