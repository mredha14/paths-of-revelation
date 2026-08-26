import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

const OWNER = "seera@zataat.bh";
const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210000, hash: "SHA-256" }, key, 256);
  return toHex(new Uint8Array(bits));
}
export async function POST(request: Request) {
  const { email, password } = await request.json<{ email?: string; password?: string }>();
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !password || password.length < 10) return NextResponse.json({ error: "Use a valid email and a password of at least 10 characters." }, { status: 400 });
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(normalized).first();
  if (existing) return NextResponse.json({ error: "An account already exists for that email." }, { status: 409 });
  const id = crypto.randomUUID(), salt = toHex(crypto.getRandomValues(new Uint8Array(16))), passwordHash = await hash(password, salt);
  await env.DB.prepare("INSERT INTO users (id, email, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, normalized, passwordHash, salt, normalized === OWNER ? "owner" : "member", Date.now()).run();
  return NextResponse.json({ ok: true, role: normalized === OWNER ? "owner" : "member" }, { status: 201 });
}
