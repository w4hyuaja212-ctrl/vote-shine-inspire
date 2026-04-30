// Bootstrap admin user. One-shot: only works if no admin exists yet.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email & password required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Refuse if any admin already exists (one-shot bootstrap).
    const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error: "Admin sudah ada. Gunakan dashboard untuk mengelola." }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Create user (auto-confirmed)
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cErr || !created.user) {
      return new Response(JSON.stringify({ error: cErr?.message || "create user failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { error: rErr } = await admin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    if (rErr) {
      return new Response(JSON.stringify({ error: rErr.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, email }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
