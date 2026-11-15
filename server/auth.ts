import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { sessions, users } from "../db/schema.ts";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export class AuthError extends Error {}

const DEMO = { id: "usr-demo-001", name: "Demo Trader", email: "demo@crypto.com", password: "password123" };

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;
  const key = await scrypt(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(keyHex, "hex");
  return expected.length === key.length && timingSafeEqual(key, expected);
}

async function ensureDemoUser() {
  const existing = await db.select().from(users).where(eq(users.email, DEMO.email));
  if (existing.length) return;
  await db
    .insert(users)
    .values({ id: DEMO.id, name: DEMO.name, email: DEMO.email, passwordHash: await hashPassword(DEMO.password), createdAt: new Date("2026-01-01T00:00:00Z") })
    .onConflictDoNothing();
}

async function createSession(user: typeof users.$inferSelect) {
  const token = randomBytes(32).toString("hex");
  await db.insert(sessions).values({ token, userId: user.id });
  return { id: user.id, name: user.name, email: user.email, token, created_at: user.createdAt.toISOString() };
}

export async function registerUser(name: string, email: string, password: string) {
  const emailClean = String(email ?? "").trim().toLowerCase();
  if (!emailClean || !emailClean.includes("@")) throw new AuthError("Please provide a valid email address.");
  if (String(password ?? "").length < 6) throw new AuthError("Password must be at least 6 characters long.");
  if (emailClean === DEMO.email) await ensureDemoUser();
  const existing = await db.select().from(users).where(eq(users.email, emailClean));
  if (existing.length) throw new AuthError("An account with this email already exists.");

  const [user] = await db
    .insert(users)
    .values({
      id: `usr-${randomUUID().replace(/-/g, "").slice(0, 8)}`,
      name: String(name ?? "").trim() || "Crypto Trader",
      email: emailClean,
      passwordHash: await hashPassword(password),
    })
    .returning();
  return createSession(user);
}

export async function loginUser(email: string, password: string) {
  const emailClean = String(email ?? "").trim().toLowerCase();
  if (emailClean === DEMO.email) await ensureDemoUser();
  const [user] = await db.select().from(users).where(eq(users.email, emailClean));
  if (!user || !(await verifyPassword(String(password ?? ""), user.passwordHash))) {
    throw new AuthError("Invalid email or password.");
  }
  return createSession(user);
}

export async function getUserByToken(token: string) {
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token));
  const u = rows[0]?.user;
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, token, created_at: u.createdAt.toISOString() };
}
