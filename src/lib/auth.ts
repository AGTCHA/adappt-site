import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  DEFAULT_ENABLED_MODULES,
  type ModuleId,
  parseEnabledModules,
  serializeEnabledModules,
  slugifyCompanyName,
} from "./modules";

export const SESSION_COOKIE = "adapt_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type SessionContext = {
  userId: string;
  companyId: string;
  role: string;
  enabledModules: ModuleId[];
  email: string;
  name: string;
  companyName: string;
  companySlug: string;
  isPlatformAdmin: boolean;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, companyId: string) {
  const token = await new SignJWT({ sub: userId, cid: companyId })
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

async function resolveSessionIds(): Promise<{ userId: string; companyId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const companyId = typeof payload.cid === "string" ? payload.cid : null;
    if (!userId) return null;
    return { userId, companyId: companyId ?? "" };
  } catch {
    return null;
  }
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const ids = await resolveSessionIds();
  if (!ids) return null;

  const membership = await prisma.companyMembership.findFirst({
    where: ids.companyId
      ? { userId: ids.userId, companyId: ids.companyId }
      : { userId: ids.userId },
    include: {
      user: { select: { email: true, name: true, isPlatformAdmin: true } },
      company: {
        select: { id: true, name: true, slug: true, enabledModules: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) return null;

  return {
    userId: membership.userId,
    companyId: membership.company.id,
    role: membership.role,
    enabledModules: parseEnabledModules(membership.company.enabledModules),
    email: membership.user.email,
    name: membership.user.name,
    companyName: membership.company.name,
    companySlug: membership.company.slug,
    isPlatformAdmin: membership.user.isPlatformAdmin,
  };
}

/** Backward-compatible helper for layouts */
export async function getSessionUser() {
  const ctx = await getSessionContext();
  if (!ctx) return null;
  return {
    id: ctx.userId,
    email: ctx.email,
    name: ctx.name,
    companyName: ctx.companyName,
    companyId: ctx.companyId,
    role: ctx.role,
    enabledModules: ctx.enabledModules,
    isPlatformAdmin: ctx.isPlatformAdmin,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new AuthError();
  return ctx;
}

/** @deprecated use requireSession().companyId */
export async function requireUserId(): Promise<string> {
  const ctx = await requireSession();
  return ctx.userId;
}

export async function requireCompanyId(): Promise<string> {
  const ctx = await requireSession();
  return ctx.companyId;
}

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}

export class ModuleError extends Error {
  module: ModuleId;
  constructor(module: ModuleId) {
    super(`Module not enabled: ${module}`);
    this.name = "ModuleError";
    this.module = module;
  }
}

export async function requireModule(module: ModuleId, ctx?: SessionContext) {
  const session = ctx ?? (await requireSession());
  if (!session.enabledModules.includes(module) && !session.isPlatformAdmin) {
    throw new ModuleError(module);
  }
  return session;
}

export async function createCompanyWithOwner(input: {
  email: string;
  password: string;
  name: string;
  companyName: string;
  enabledModules?: ModuleId[];
}) {
  const email = input.email.trim().toLowerCase();
  let slug = slugifyCompanyName(input.companyName);
  const existingSlug = await prisma.company.findUnique({ where: { slug } });
  if (existingSlug) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const modules =
    input.enabledModules ?? DEFAULT_ENABLED_MODULES;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      },
    });
    const company = await tx.company.create({
      data: {
        name: input.companyName,
        slug,
        enabledModules: serializeEnabledModules(modules),
      },
    });
    await tx.companyMembership.create({
      data: { companyId: company.id, userId: user.id, role: "owner" },
    });
    return { user, company };
  });
}

export async function uniqueCompanySlug(base: string) {
  let slug = slugifyCompanyName(base);
  let n = 0;
  while (await prisma.company.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${slugifyCompanyName(base)}-${n}`;
  }
  return slug;
}
