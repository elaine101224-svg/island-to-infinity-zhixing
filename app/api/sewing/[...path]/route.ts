import { after, NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, randomInt, randomUUID, createHmac } from "crypto";
import { z } from "zod";
import {
  allowedEmail,
  schoolDomains,
  canManage,
  check,
  db,
  hash,
  identity,
  limit,
  mail,
  notify,
  orderFor,
  requireIdentity,
  SewingError,
} from "@/lib/sewing/server";
import {
  contentSchema,
  imageMime,
  quoteSchema,
  requestSchema,
} from "@/lib/sewing/schema";
import {
  defaultContent,
  statuses,
  paymentNames,
  type Order,
} from "@/lib/sewing/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const uuid = z.string().uuid();
const digest = (email: string, code: string) =>
  createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${email}:${code}`)
    .digest("hex");
async function body(req: NextRequest, max = 200000) {
  const reader = req.body?.getReader();
  if (!reader) throw new SewingError("invalid");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > max) {
      await reader.cancel();
      throw new SewingError("size", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
async function handle(req: NextRequest, ctx: Context) {
  try {
    const parts = (await ctx.params).path;
    const path = parts.join("/");
    const write = req.method === "POST";
    if (write) {
      const origin = req.headers.get("origin");
      if (
        !origin ||
        new URL(origin).host !== req.headers.get("host") ||
        req.headers.get("x-sewing-request") !== "1"
      )
        throw new SewingError("forbidden", 403);
    }
    if (path === "content" && !write) {
      let content = defaultContent;
      let configured = false;
      try {
        const r = check(
          await db()
            .from("sewing_content")
            .select("data")
            .eq("id", "main")
            .maybeSingle(),
        );
        if (r) content = contentSchema.parse(r.data);
        check(await db().from("sewing_orders").select("id").limit(0));
        configured = true;
      } catch {}
      return NextResponse.json({
        content,
        configured,
        loginConfigured:
          configured &&
          schoolDomains().length > 0 &&
          !!process.env.SEWING_MAIL_API_KEY &&
          !!process.env.SEWING_MAIL_FROM,
      });
    }
    if (path === "session" && !write)
      return NextResponse.json({ user: await identity() });
    let data: Record<string, unknown> = {};
    if (write && path !== "files") {
      data = JSON.parse((await body(req)).toString());
    }
    if (path === "auth/send" && write) {
      const email = z.string().email().max(254).parse(data.email).toLowerCase();
      db();
      if (!schoolDomains().length) throw new SewingError("setup", 503);
      if (!allowedEmail(email)) throw new SewingError("school", 403);
      if (!process.env.SEWING_MAIL_API_KEY || !process.env.SEWING_MAIL_FROM)
        throw new SewingError("mailSetup", 503);
      await limit(
        `send-ip:${req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"}`,
        30,
        3600,
      );
      await limit("send-global", 500, 86400);
      await limit(`send:${email}`, 1, 60);
      await limit(`send-day:${email}`, 10, 86400);
      const code = String(randomInt(100000, 1000000));
      check(
        await db()
          .from("sewing_otp")
          .upsert({
            email,
            code_hash: digest(email, code),
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 600000).toISOString(),
            attempts: 0,
          }),
      );
      await mail(
        [email],
        "Island to Infinity · 校内身份验证码",
        `验证码 / Verification code: ${code}\n10 分钟内有效，仅可使用一次。 / Expires in 10 minutes. Single use.`,
      );
      return NextResponse.json({ ok: true });
    }
    if (path === "auth/verify" && write) {
      const email = z.string().email().parse(data.email).toLowerCase();
      const code = z
        .string()
        .regex(/^\d{6}$/)
        .parse(data.code);
      if (!allowedEmail(email)) throw new SewingError("school", 403);
      await limit(`verify:${email}`, 20, 600);
      if (
        !check(
          await db().rpc("sewing_verify", { e: email, h: digest(email, code) }),
        )
      )
        throw new SewingError("code", 401);
      const token = randomBytes(32).toString("hex");
      check(
        await db()
          .from("sewing_sessions")
          .insert({
            email,
            token_hash: hash(token),
            expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          }),
      );
      (await cookies()).set("sewing_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 86400,
      });
      return NextResponse.json({ ok: true });
    }
    if (path === "auth/logout" && write) {
      const jar = await cookies();
      const token = jar.get("sewing_session")?.value;
      if (token)
        check(
          await db()
            .from("sewing_sessions")
            .delete()
            .eq("token_hash", hash(token)),
        );
      jar.delete("sewing_session");
      return NextResponse.json({ ok: true });
    }
    const user = await requireIdentity();
    if (path === "previews") {
      if (write) {
        const p = z
          .object({
            id: uuid,
            product: z.enum(["hoodie", "zip", "tshirt", "jersey"]),
            color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
            fileIds: z.array(uuid).min(2).max(4),
            transforms: z.object({
              front: z.object({
                x: z.number(),
                y: z.number(),
                scale: z.number(),
                angle: z.number(),
              }),
              back: z.object({
                x: z.number(),
                y: z.number(),
                scale: z.number(),
                angle: z.number(),
              }),
            }),
          })
          .parse(data);
        const files = check(
          await db()
            .from("sewing_files")
            .select("id")
            .eq("owner", user.email)
            .neq("purpose", "public")
            .in("id", p.fileIds),
        );
        if (new Set(files?.map((f) => f.id)).size !== new Set(p.fileIds).size)
          throw new SewingError("file");
        check(
          await db()
            .from("sewing_previews")
            .insert({ id: p.id, owner: user.email, data: p }),
        );
        return NextResponse.json({ id: p.id });
      }
      return NextResponse.json({
        previews: check(
          await db()
            .from("sewing_previews")
            .select("*")
            .eq("owner", user.email)
            .order("created_at", { ascending: false })
            .limit(50),
        ),
      });
    }
    if (path === "content" && write) {
      if (user.role !== "admin") throw new SewingError("forbidden", 403);
      const content = contentSchema.parse(data);
      const ids = [
        ...content.products.flatMap((p) => p.photos),
        ...content.gallery.map((p) => p.photo),
      ];
      if (ids.length) {
        const files = check(
          await db()
            .from("sewing_files")
            .select("id")
            .eq("purpose", "public")
            .in("id", ids),
        );
        if (new Set(files?.map((f) => f.id)).size !== new Set(ids).size)
          throw new SewingError("invalid");
      }
      check(
        await db()
          .from("sewing_audit")
          .insert({ actor: user.email, action: "content", data: content }),
      );
      check(
        await db().from("sewing_content").upsert({ id: "main", data: content }),
      );
      return NextResponse.json({ ok: true });
    }
    if (path === "members") {
      if (user.role === "customer") throw new SewingError("forbidden", 403);
      if (write) {
        if (user.role !== "admin") throw new SewingError("forbidden", 403);
        const m = z
          .object({
            email: z.string().email(),
            name: z.string().min(1).max(100),
            contact: z.string().max(200),
          })
          .parse(data);
        m.email = m.email.toLowerCase();
        if (!allowedEmail(m.email)) throw new SewingError("school");
        check(
          await db()
            .from("sewing_audit")
            .insert({ actor: user.email, action: "member", data: m }),
        );
        check(await db().from("sewing_members").upsert(m));
      }
      const rows = check(await db().from("sewing_members").select("*"));
      return NextResponse.json({ members: rows });
    }
    if (path === "files" && write) {
      await limit(`file:${user.email}`, 60, 3600);
      const raw = await body(req, 5242880);
      const mime = imageMime(raw);
      if (!mime || mime !== req.headers.get("content-type"))
        throw new SewingError("file", 415);
      const purpose = z
        .enum(["original", "preview", "public"])
        .parse(req.headers.get("x-file-purpose"));
      if (purpose === "public" && user.role !== "admin")
        throw new SewingError("forbidden", 403);
      const name = decodeURIComponent(
        req.headers.get("x-file-name") || "design",
      ).slice(0, 200);
      const id = randomUUID();
      const objectPath = `${purpose}/${id}`;
      check(
        await db()
          .storage.from("sewing-private")
          .upload(objectPath, raw, { contentType: mime, upsert: false }),
      );
      const saved = await db().from("sewing_files").insert({
        id,
        owner: user.email,
        path: objectPath,
        name,
        mime,
        purpose,
      });
      if (saved.error) {
        await db().storage.from("sewing-private").remove([objectPath]);
        throw new SewingError("storage", 503);
      }
      return NextResponse.json({ file: { id, name, mime, purpose } });
    }
    if (parts[0] === "files" && parts.length === 2 && !write) {
      const id = uuid.parse(parts[1]);
      const f = check(
        await db().from("sewing_files").select("*").eq("id", id).maybeSingle(),
      );
      if (!f) throw new SewingError("missing", 404);
      if (f.owner !== user.email && user.role !== "admin") {
        let q = db()
          .from("sewing_orders")
          .select("*")
          .contains("data", { fileIds: [id] });
        q =
          user.role === "member"
            ? q.eq("assigned", user.email)
            : q.eq("owner", user.email);
        const orders = check(await q.limit(1));
        if (!orders?.length) throw new SewingError("missing", 404);
      }
      const blob = check(
        await db().storage.from("sewing-private").download(f.path),
      );
      return new NextResponse(blob, {
        headers: {
          "Content-Type": f.mime,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": `inline; filename="design.${f.mime.split("/")[1]}"`,
        },
      });
    }
    if (path === "orders" && !write) {
      let q = db()
        .from("sewing_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const mode = req.nextUrl.searchParams.get("manage");
      if (user.role === "admin" && mode === "1") {
      } else if (user.role === "member" && mode === "1")
        q = q.eq("assigned", user.email);
      else q = q.eq("owner", user.email);
      const orders = check(await q) as Order[];
      return NextResponse.json({
        orders: orders.map((o) => ({
          ...o,
          updates: canManage(user, o)
            ? o.updates
            : o.updates.filter((u) => !u.internal),
        })),
      });
    }
    if (path === "orders" && write) {
      if (user.role === "admin") throw new SewingError("school", 403);
      const id = uuid.parse(data.id);
      const parsed = requestSchema.parse(data.data);
      const prior = check(
        await db()
          .from("sewing_orders")
          .select("*")
          .eq("id", id)
          .eq("owner", user.email)
          .maybeSingle(),
      );
      if (prior) return NextResponse.json({ order: { id: prior.id } });
      await limit(`order:${user.email}`, 10, 3600);
      if (parsed.fileIds.length) {
        const files = check(
          await db()
            .from("sewing_files")
            .select("id")
            .eq("owner", user.email)
            .neq("purpose", "public")
            .in("id", parsed.fileIds),
        );
        if (
          new Set(files?.map((f) => f.id)).size !== new Set(parsed.fileIds).size
        )
          throw new SewingError("file");
      }
      const result = await db()
        .from("sewing_orders")
        .insert({
          id,
          owner: user.email,
          data: parsed,
          updates: [
            {
              at: new Date().toISOString(),
              by: user.email,
              text: "",
              status: "submitted",
              internal: false,
            },
          ],
        })
        .select()
        .single();
      if (result.error?.code === "23505") {
        const existing = await orderFor(id, user);
        return NextResponse.json({ order: { id: existing.id } });
      }
      const order = check(result) as Order;
      if (
        process.env.SEWING_NOTIFY_EMAILS &&
        process.env.SEWING_MAIL_API_KEY &&
        process.env.SEWING_MAIL_FROM
      )
        after(async () => {
          try {
            await notify(order);
          } catch {
            await db()
              .from("sewing_notifications")
              .update({ last_error: "mailFailed" })
              .eq("order_id", order.id);
          }
        });
      return NextResponse.json({ order: { id: order.id } });
    }
    if (parts[0] === "orders" && parts.length === 2) {
      const order = await orderFor(uuid.parse(parts[1]), user);
      const manager = canManage(user, order);
      if (!write) {
        const files = order.data.fileIds.length
          ? check(
              await db()
                .from("sewing_files")
                .select("id,name,mime,purpose")
                .in("id", order.data.fileIds),
            )
          : [];
        const member = order.assigned
          ? check(
              await db()
                .from("sewing_members")
                .select("name,contact")
                .eq("email", order.assigned)
                .maybeSingle(),
            )
          : null;
        return NextResponse.json({
          order: {
            ...order,
            updates: manager
              ? order.updates
              : order.updates.filter((u) => !u.internal),
          },
          files,
          member,
        });
      }
      if (data.version !== order.version)
        throw new SewingError("conflict", 409);
      const now = new Date().toISOString();
      const updates = [...order.updates];
      let patch: Partial<Order> = {};
      const action = data.action;
      if (action === "confirm") {
        if (
          user.email !== order.owner ||
          order.status !== "quoted" ||
          !order.quotes.length ||
          data.quoteId !== order.quotes.at(-1)?.id
        )
          throw new SewingError("transition");
        patch = {
          status: "confirmed",
          confirmation: {
            at: now,
            by: user.email,
            quoteId: String(data.quoteId),
          },
        };
        updates.push({
          at: now,
          by: user.email,
          text: "",
          status: "confirmed",
          internal: false,
        });
      } else {
        if (!manager) throw new SewingError("forbidden", 403);
        if (action === "assign") {
          if (user.role !== "admin") throw new SewingError("forbidden", 403);
          const email = z.string().email().parse(data.email).toLowerCase();
          const m = check(
            await db()
              .from("sewing_members")
              .select("email")
              .eq("email", email)
              .maybeSingle(),
          );
          if (!m) throw new SewingError("invalid");
          patch = { assigned: email };
          updates.push({
            at: now,
            by: user.email,
            text: `分配成员 / Assigned: ${email}`,
            internal: true,
          });
        } else if (action === "quote") {
          if (
            !["submitted", "communicating", "quoted", "confirmed"].includes(
              order.status,
            )
          )
            throw new SewingError("transition");
          const q = quoteSchema.parse(data.quote);
          const quote = {
            ...q,
            id: randomUUID(),
            at: now,
            by: user.email,
            total:
              q.items.reduce(
                (sum, i) => sum + Math.round(i.quantity * i.unit * 100),
                0,
              ) / 100,
          };
          patch = {
            quotes: [...order.quotes, quote],
            status: "quoted",
            confirmation: null,
          };
          updates.push({
            at: now,
            by: user.email,
            text: "",
            status: "quoted",
            internal: false,
          });
        } else if (action === "update") {
          const status = z.enum(statuses).parse(data.status);
          const transitions: Record<string, string[]> = {
            submitted: ["communicating", "declined", "cancelled"],
            communicating: ["declined", "cancelled"],
            quoted: ["communicating", "declined", "cancelled"],
            confirmed: ["production", "cancelled"],
            production: ["delivery", "cancelled"],
            delivery: ["completed", "cancelled"],
            completed: [],
            declined: [],
            cancelled: [],
          };
          if (
            status !== order.status &&
            !transitions[order.status].includes(status)
          )
            throw new SewingError("transition");
          if (
            status === "production" &&
            (!order.confirmation ||
              order.confirmation.quoteId !== order.quotes.at(-1)?.id)
          )
            throw new SewingError("transition");
          const text = z.string().trim().max(3000).parse(data.text);
          if (status !== order.status && !text)
            throw new SewingError("invalid");
          const internal = z.boolean().parse(data.internal);
          if (status !== order.status && internal)
            throw new SewingError("invalid");
          patch = {
            status,
            payment: z.enum(["unpaid", "deposit", "paid"]).parse(data.payment),
          };
          if (patch.payment !== order.payment)
            updates.push({
              at: now,
              by: user.email,
              text: `付款状态：${paymentNames[order.payment].zh} → ${paymentNames[patch.payment!].zh} / Payment: ${paymentNames[order.payment].en} → ${paymentNames[patch.payment!].en}`,
              internal: false,
            });
          updates.push({
            at: now,
            by: user.email,
            text,
            internal,
            status: internal ? undefined : status,
          });
        } else if (action === "notify") {
          try {
            await notify(order);
          } catch {
            throw new SewingError("mailFailed", 503);
          }
          return NextResponse.json({ ok: true });
        } else throw new SewingError("invalid");
      }
      patch.updates = updates;
      patch.version = order.version + 1;
      const result = check(
        await db()
          .from("sewing_orders")
          .update(patch)
          .eq("id", order.id)
          .eq("version", order.version)
          .select("id"),
      );
      if (!result?.length) throw new SewingError("conflict", 409);
      return NextResponse.json({ ok: true });
    }
    if (path === "notifications" && !write && user.role === "admin")
      return NextResponse.json({
        notifications: check(
          await db()
            .from("sewing_notifications")
            .select("*")
            .is("sent_at", null),
        ),
        mailConfigured:
          !!process.env.SEWING_NOTIFY_EMAILS &&
          !!process.env.SEWING_MAIL_API_KEY &&
          !!process.env.SEWING_MAIL_FROM,
      });
    throw new SewingError("missing", 404);
  } catch (e) {
    const error =
      e instanceof SewingError
        ? e
        : new SewingError(
            e instanceof z.ZodError || e instanceof SyntaxError
              ? "invalid"
              : "storage",
            e instanceof z.ZodError || e instanceof SyntaxError ? 400 : 503,
          );
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
}
async function respond(request: NextRequest, context: Context) {
  const response = await handle(request, context);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const GET = respond;
export const POST = respond;
