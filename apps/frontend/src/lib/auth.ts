import type { AuthUser } from "./api";

const STORAGE_KEY = "tqm-auth";

export type StoredAuth = {
  token: string;
  user: AuthUser;
};

export function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function writeStoredAuth(value: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
