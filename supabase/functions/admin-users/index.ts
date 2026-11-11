// =====================================================================
// Unified SOAR — admin-users Edge Function
//
// Privileged user management that the browser must never do itself:
//   create_user, reset_password, reset_mfa, set_active
//
// Every call must come from a logged-in, ACTIVE ADMIN whose session has
// passed MFA (aal2). The secret key used here never leaves Supabase.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ROLES = ["analyst", "team_lead", "admin"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// New-style secret key if present, legacy service_role key otherwise.
function secretKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys.default) return keys.default;
    } catch (_) { /* fall through */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

// 16-char temporary password: upper, lower, digit, symbol; no look-alikes.
function tempPassword(): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "!@#$%*?-"];
  const all = sets.join("");
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = sets.map((s) => s[rnd(s.length)]);
  while (chars.length < 16) chars.push(all[rnd(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// Read claims from a JWT that Supabase Auth has already validated.
function claims(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part + "=".repeat((4 - (part.length % 4)) % 4)));
  } catch (_) {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- Who is calling? ------------------------------------------------
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Not signed in" }, 401);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Session invalid or expired" }, 401);
  if (claims(token).aal !== "aal2") return json({ error: "MFA verification required" }, 403);

  const { data: me } = await admin
    .from("profiles").select("id, email, role, is_active, is_demo").eq("id", userData.user.id).single();
  if (!me || !me.is_active || me.role !== "admin") return json({ error: "Admins only" }, 403);
  // The public demo account can switch itself to "admin" — it must never reach real user management.
  if (me.is_demo) return json({ error: "Demo account cannot manage real users" }, 403);

  const audit = (action: string, targetId: string, newValue: Record<string, unknown> = {}) =>
    admin.from("audit_log").insert({
      actor_id: me.id, actor_email: me.email, action,
      target_type: "user", target_id: targetId, new_value: newValue,
    });

  // ---- What do they want? --------------------------------------------
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch (_) { return json({ error: "Invalid JSON" }, 400); }
  const action = String(body.action || "");
  const userId = String(body.user_id || "");

  if (action !== "create_user") {
    if (!UUID_RE.test(userId)) return json({ error: "user_id required" }, 400);
    if (userId === me.id && action !== "reset_password") {
      return json({ error: "You cannot do that to your own account" }, 400);
    }
  }

  try {
    switch (action) {
      case "create_user": {
        const email = String(body.email || "").trim().toLowerCase();
        const fullName = String(body.full_name || "").trim().slice(0, 120);
        const role = String(body.role || "analyst");
        if (!EMAIL_RE.test(email)) return json({ error: "Valid email required" }, 400);
        if (!fullName) return json({ error: "Full name required" }, 400);
        if (!ROLES.includes(role)) return json({ error: "Invalid role" }, 400);

        const password = tempPassword();
        const { data, error } = await admin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { full_name: fullName },
        });
        if (error) return json({ error: error.message }, 400);

        const id = data.user.id;
        const { error: pErr } = await admin.from("profiles")
          .update({ full_name: fullName, role, must_change_password: true }).eq("id", id);
        if (pErr) return json({ error: pErr.message }, 500);

        await audit("user.created", id, { email, role });
        return json({ user_id: id, temp_password: password });
      }

      case "reset_password": {
        const password = tempPassword();
        const { error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) return json({ error: error.message }, 400);
        await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);
        await audit("user.password_reset", userId);
        return json({ temp_password: password });
      }

      case "reset_mfa": {
        const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
        if (error) return json({ error: error.message }, 400);
        for (const f of data.factors || []) {
          const { error: dErr } = await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId });
          if (dErr) return json({ error: dErr.message }, 400);
        }
        await audit("user.mfa_reset", userId, { factors_removed: (data.factors || []).length });
        return json({ ok: true });
      }

      case "set_active": {
        const active = body.active === true;
        const { error: pErr } = await admin.from("profiles").update({ is_active: active }).eq("id", userId);
        if (pErr) return json({ error: pErr.message }, 400);
        // Also block/unblock the login itself, so a disabled user gets no new sessions.
        const { error } = await admin.auth.admin.updateUserById(userId, {
          ban_duration: active ? "none" : "876000h",
        });
        if (error) return json({ error: error.message }, 400);
        await audit(active ? "user.enabled" : "user.disabled", userId);
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message || "Server error" }, 500);
  }
});
