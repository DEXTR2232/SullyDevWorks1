// =====================================================================
// Unified SOAR — demo-otp Edge Function (PUBLIC, deploy with Verify JWT OFF)
//
// Powers demo.html: returns the demo login and its CURRENT 6-digit MFA code.
// The TOTP secret stays in Supabase (public.demo_state); only codes go out.
//
// Self-provisioning and self-healing, because the demo login is public and a
// visitor can change its password or replace its MFA. At most every 10 minutes
// this function checks the account and repairs it:
//   - creates the demo user if missing, flags it is_demo in profiles
//   - resets the password / unbans it if sign-in fails
//   - if its MFA factor was removed or replaced: deletes all factors,
//     enrolls a fresh TOTP factor, verifies it, stores the new secret
//
// The demo account is sandboxed by the database (migration 002): it cannot
// see or change real users even when switched to the Admin role.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2";

// Public on purpose: also printed in README.md and on demo.html.
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "DemoMode-2026!";
const DEMO_NAME = "Demo User";
const RECHECK_MS = 10 * 60 * 1000;
const PERIOD = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function envKey(newName: string, legacyName: string): string {
  const raw = Deno.env.get(newName);
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys.default) return keys.default;
    } catch (_) { /* fall through */ }
  }
  return Deno.env.get(legacyName)!;
}

// ---- RFC 6238 TOTP (SHA-1, 6 digits, 30 s) ------------------------------
function base32ToBytes(input: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.toUpperCase().replace(/[\s=]/g, "");
  const out: number[] = [];
  let bits = 0, value = 0;
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) throw new Error("Invalid base32 secret");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
      value &= (1 << bits) - 1;
    }
  }
  return new Uint8Array(out);
}

async function totp(secret: string, timeMs = Date.now()): Promise<string> {
  const counter = Math.floor(timeMs / 1000 / PERIOD);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const key = await crypto.subtle.importKey(
    "raw", base32ToBytes(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
  );
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[h.length - 1] & 0x0f;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

// ---- Demo account check / repair -----------------------------------------
// deno-lint-ignore no-explicit-any
async function ensureDemo(admin: any, url: string, publishableKey: string) {
  const { data: state } = await admin.from("demo_state").select("*").eq("id", 1).maybeSingle();
  if (state?.totp_secret && state.checked_at &&
      Date.now() - new Date(state.checked_at).getTime() < RECHECK_MS) {
    return state;
  }

  // 1. Account exists and is flagged as demo
  let userId: string | null = null;
  const { data: prof } = await admin.from("profiles").select("id").eq("email", DEMO_EMAIL).maybeSingle();
  if (prof) userId = prof.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true,
      user_metadata: { full_name: DEMO_NAME },
    });
    if (error) throw new Error("Create demo user: " + error.message);
    userId = data.user.id;
  }
  const { data: updated, error: upErr } = await admin.from("profiles")
    .update({ is_demo: true, is_active: true, must_change_password: false, full_name: DEMO_NAME })
    .eq("id", userId).select("id");
  if (upErr) throw new Error("Flag demo profile: " + upErr.message);
  if (!updated?.length) {
    const { error } = await admin.from("profiles").insert({
      id: userId, email: DEMO_EMAIL, full_name: DEMO_NAME, role: "analyst",
      is_demo: true, must_change_password: false,
    });
    if (error) throw new Error("Create demo profile: " + error.message);
  }

  // 2. MFA factor still the one we hold the secret for?
  const { data: fl, error: flErr } = await admin.auth.admin.mfa.listFactors({ userId });
  if (flErr) throw new Error("List factors: " + flErr.message);
  const factors = fl?.factors || [];
  const factorOk = !!state?.totp_secret && factors.length === 1 &&
    factors[0].id === state.factor_id && factors[0].status === "verified";
  if (!factorOk) {
    for (const f of factors) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId });
  }

  // 3. Password still works? (repair if a visitor changed it or it was banned)
  const pub = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let { error: siErr } = await pub.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  if (siErr) {
    await admin.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD, ban_duration: "none" });
    ({ error: siErr } = await pub.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD }));
    if (siErr) throw new Error("Demo sign-in: " + siErr.message);
  }

  // 4. Re-enroll MFA if needed, keeping only the secret server-side
  let secret: string = state?.totp_secret;
  let factorId: string = state?.factor_id;
  if (!factorOk) {
    const { data: en, error: enErr } = await pub.auth.mfa.enroll({
      factorType: "totp", friendlyName: "Demo " + new Date().toISOString(),
    });
    if (enErr) throw new Error("Enroll demo MFA: " + enErr.message);
    const { error: vErr } = await pub.auth.mfa.challengeAndVerify({
      factorId: en.id, code: await totp(en.totp.secret),
    });
    if (vErr) throw new Error("Verify demo MFA: " + vErr.message);
    secret = en.totp.secret;
    factorId = en.id;
  }
  await pub.auth.signOut({ scope: "local" });

  const row = { id: 1, user_id: userId, factor_id: factorId, totp_secret: secret, checked_at: new Date().toISOString() };
  const { error: sErr } = await admin.from("demo_state").upsert(row);
  if (sErr) throw new Error("Save demo state: " + sErr.message);
  return row;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, envKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const state = await ensureDemo(admin, url, envKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY"));
    const now = Date.now();
    return json({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      code: await totp(state.totp_secret, now),
      expires_in: PERIOD - Math.floor(now / 1000) % PERIOD,
      period: PERIOD,
    });
  } catch (e) {
    return json({ error: (e as Error).message || "Demo unavailable" }, 500);
  }
});
