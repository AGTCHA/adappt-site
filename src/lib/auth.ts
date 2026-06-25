import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "budget_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

function getAdminEmail() {
  return process.env.BUDGET_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function getPasswordHash() {
  const raw = process.env.BUDGET_ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return "";

  // Next.js expands $ in .env locally; production should use raw hash.
  // Accept hashes whether or not they were escaped during load.
  if (raw.startsWith("$2")) return raw;

  return raw.replace(/\\\$/g, "$");
}

export function isAuthConfigured() {
  const email = getAdminEmail();
  const hash = getPasswordHash();
  const plain = process.env.BUDGET_ADMIN_PASSWORD?.trim();
  return Boolean(email && (hash || plain));
}

export async function verifyCredentials(email: string, password: string) {
  const adminEmail = getAdminEmail();
  const passwordHash = getPasswordHash();
  const plainPassword = process.env.BUDGET_ADMIN_PASSWORD?.trim();

  if (!adminEmail || (!passwordHash && !plainPassword)) {
    return false;
  }

  if (email.trim().toLowerCase() !== adminEmail) {
    return false;
  }

  if (plainPassword) {
    return password === plainPassword;
  }

  return bcrypt.compare(password, passwordHash);
}

export async function createSession(email: string) {
  const token = await new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = payload.email;
    if (typeof email !== "string") return null;
    return { email };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
