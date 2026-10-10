import { cookies } from "next/headers";

export interface UserSession {
  username: string;
  name: string;
  role: "CLINICAL_TRIAGE_LEAD" | "TRIAGE_NURSE" | "CLINIC_ADMIN";
  hospital: string;
  isLoggedIn: boolean;
  loginTime: string;
}

const AUTH_COOKIE_NAME = "medisense_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "medisense-secure-clinical-key-2026";

export function getExpectedCredentials() {
  return {
    username: process.env.MEDISENSE_ADMIN_USER || "trashika",
    password: process.env.MEDISENSE_ADMIN_PASSWORD || "trash#123",
  };
}

export function verifyCredentials(u: string, p: string): boolean {
  const creds = getExpectedCredentials();
  return u.trim() === creds.username && p.trim() === creds.password;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.username === "trashika" && parsed.isLoggedIn) {
      return parsed;
    }
  } catch (e) {
    return null;
  }

  return null;
}

export async function createSession(username: string): Promise<UserSession> {
  const cookieStore = cookies();
  const session: UserSession = {
    username,
    name: "Dr. Trashika (Clinical Lead)",
    role: "CLINICAL_TRIAGE_LEAD",
    hospital: "HexaClinic",
    isLoggedIn: true,
    loginTime: new Date().toISOString(),
  };

  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");

  cookieStore.set(AUTH_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return session;
}

export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
