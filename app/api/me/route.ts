import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { requireSupabaseUser } from "@/lib/supabase";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const email = String(identity.user.email ?? "member").toLowerCase();
  const username = email.split("@")[0] || "member";
  const current = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authSubject, identity.user.id))
    .get();
  const profile =
    current ??
    (
      await db
        .insert(profiles)
        .values({
          authSubject: identity.user.id,
          username: email,
          displayName: String(
            identity.user.user_metadata.full_name ??
              identity.user.user_metadata.username ??
              username,
          ),
          role: identity.role,
          createdAt: new Date(),
        })
        .returning()
    )[0];
  return Response.json({
    id: profile.id,
    username: profile.username,
    displayName: String(
      identity.user.user_metadata.full_name ??
        identity.user.user_metadata.username ??
        (profile.displayName?.includes("@") ? username : profile.displayName) ??
        username,
    ),
    role: identity.role,
    email: identity.user.email,
  });
}
