import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import { validateSession } from "@/lib/auth";
import type { Identity, Order } from "./types";
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new SewingError("setup", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export class SewingError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw new SewingError("storage", 503);
  return result.data;
}
export function schoolDomains() {
  return (process.env.SEWING_SCHOOL_DOMAINS ?? "uwcchina.org")
    .toLowerCase()
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
export function allowedEmail(email: string) {
  const domains = schoolDomains();
  return (
    /^[^\s@]+@[^\s@]+$/.test(email) && domains.includes(email.split("@")[1])
  );
}
export async function identity(): Promise<Identity | null> {
  if (await validateSession()) return { email: "admin", role: "admin" };
  const token = (await cookies()).get("sewing_session")?.value;
  if (!token) return null;
  const s = check(
    await db()
      .from("sewing_sessions")
      .select("email,expires_at")
      .eq("token_hash", hash(token))
      .maybeSingle(),
  );
  if (!s || Date.parse(s.expires_at) < Date.now() || !allowedEmail(s.email))
    return null;
  const member = check(
    await db()
      .from("sewing_members")
      .select("email")
      .eq("email", s.email)
      .maybeSingle(),
  );
  return { email: s.email, role: member ? "member" : "customer" };
}
export async function requireIdentity() {
  const user = await identity();
  if (!user) throw new SewingError("login", 401);
  return user;
}
export function canRead(user: Identity, order: Order) {
  return (
    user.role === "admin" ||
    order.owner === user.email ||
    (user.role === "member" && order.assigned === user.email)
  );
}
export function canManage(user: Identity, order: Order) {
  return (
    user.role === "admin" ||
    (user.role === "member" && order.assigned === user.email)
  );
}
export async function orderFor(id: string, user: Identity) {
  const o = check(
    await db().from("sewing_orders").select("*").eq("id", id).maybeSingle(),
  ) as Order | null;
  if (!o || !canRead(user, o)) throw new SewingError("missing", 404);
  return o;
}
export async function limit(key: string, max: number, seconds: number) {
  if (!check(await db().rpc("sewing_limit", { k: key, maximum: max, seconds })))
    throw new SewingError("rate", 429);
}
export async function mail(
  to: string[],
  subject: string,
  text: string,
  idempotencyKey?: string,
) {
  if (!process.env.SEWING_MAIL_API_KEY || !process.env.SEWING_MAIL_FROM)
    throw new SewingError("mailSetup", 503);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SEWING_MAIL_API_KEY}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: process.env.SEWING_MAIL_FROM,
      to,
      subject,
      text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new SewingError("mailFailed", 503);
}
export async function notify(order: Order) {
  const recipients = (process.env.SEWING_NOTIFY_EMAILS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (!recipients.length) throw new SewingError("mailSetup", 503);
  const queued = check(
    await db()
      .from("sewing_notifications")
      .select("*")
      .eq("order_id", order.id)
      .single(),
  );
  if (queued.sent_at) return true;
  check(
    await db()
      .from("sewing_notifications")
      .update({ attempts: queued.attempts + 1 })
      .eq("order_id", order.id),
  );
  await mail(
    recipients,
    `新定制需求 / New request ${order.id}`,
    `编号：${order.id}\n产品：${order.data.product}\n数量：${order.data.quantity}\n交期：${order.data.date}\n请登录后台查看详情。 / Sign in to the dashboard for details.`,
    order.id,
  );
  check(
    await db()
      .from("sewing_notifications")
      .update({ sent_at: new Date().toISOString(), last_error: null })
      .eq("order_id", order.id),
  );
  return true;
}
