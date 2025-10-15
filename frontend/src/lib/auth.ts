export function setAuth(token: string, role: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getUserRole(): string | null {
  return localStorage.getItem("role");
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}
