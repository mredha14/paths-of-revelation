import { nextId, updateStore } from "@/lib/store";
import { requireSupabaseUser } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const email = String(identity.user.email ?? "member").toLowerCase();
  const username = email.split("@")[0] || "member";
  const profile = await updateStore((store) => {
    const current = store.profiles.find((item) => item.authSubject === identity.user.id);
    if (current) {
      if (identity.role === 'admin' && current.role !== 'admin') current.role = 'admin';
      return structuredClone(current);
    }
    const created = {
        id: nextId(store, 'profile'),
        authSubject: identity.user.id,
        username: email,
        displayName: String(
          identity.user.user_metadata.full_name ??
            identity.user.user_metadata.username ??
            username,
        ),
        role: identity.role,
        createdAt: Date.now(),
      } as const;
    store.profiles.push(created);
    return structuredClone(created);
  });
  return Response.json({
    id: profile.id,
    username: profile.username,
    displayName: String(
      identity.user.user_metadata.full_name ??
        identity.user.user_metadata.username ??
        (profile.displayName?.includes("@") ? username : profile.displayName) ??
        username,
    ),
    role: profile.role,
    email: identity.user.email,
  });
}
