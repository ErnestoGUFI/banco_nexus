const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "banco-nexus-token";

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Error al conectar con Banco Nexus");
  }

  return data;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return parseJsonResponse(response);
}

export async function getSystemHealth() {
  return request("/health", { headers: {} });
}

export async function registerClient(payload) {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(result.token);
  return result;
}

export async function loginClient(payload) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(result.token);
  return result;
}

export async function getDashboard() {
  return request("/api/dashboard");
}

export async function getAccountByNumber(accountNumber) {
  return request(`/api/accounts/${accountNumber}`);
}

export async function updateProfile(payload) {
  return request("/api/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createBeneficiary(payload) {
  return request("/api/beneficiaries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createTransfer(payload) {
  return request("/api/transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function hasSession() {
  return Boolean(getToken());
}

export function logout() {
  setToken(null);
}
