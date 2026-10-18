import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  cookies: new Map<string, string>(),
  tables: {} as Record<string, Record<string, unknown>[]>,
  conflict: false,
}));
vi.mock("@/lib/auth", () => ({ validateSession: mocks.admin }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (k: string) =>
      mocks.cookies.has(k) ? { value: mocks.cookies.get(k) } : undefined,
    set: (k: string, v: string) => mocks.cookies.set(k, v),
    delete: (k: string) => mocks.cookies.delete(k),
  }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      let operation = "select",
        payload: Record<string, unknown> | null = null;
      let filters: ((r: Record<string, unknown>) => boolean)[] = [];
      let single = false;
      let maximum = Infinity;
      const q = {
        select: () => q,
        eq: (k: string, v: unknown) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        neq: (k: string, v: unknown) => {
          filters.push((r) => r[k] !== v);
          return q;
        },
        in: (k: string, v: unknown[]) => {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        is: (k: string, v: unknown) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        contains: (k: string, v: Record<string, string[]>) => {
          filters.push((r) =>
            Object.entries(v).every(([key, ids]) =>
              ids.every((id) =>
                (r[k] as Record<string, string[]>)[key].includes(id),
              ),
            ),
          );
          return q;
        },
        order: () => q,
        limit: (n: number) => {
          maximum = n;
          return q;
        },
        maybeSingle: () => {
          single = true;
          return q;
        },
        single: () => {
          single = true;
          return q;
        },
        insert: (d: Record<string, unknown>) => {
          operation = "insert";
          payload = d;
          return q;
        },
        update: (d: Record<string, unknown>) => {
          operation = "update";
          payload = d;
          return q;
        },
        upsert: (d: Record<string, unknown>) => {
          operation = "insert";
          payload = d;
          return q;
        },
        delete: () => {
          operation = "delete";
          return q;
        },
        then: (resolve: (r: unknown) => unknown) => {
          const rows = mocks.tables[table] || [];
          let selected = rows
            .filter((r) => filters.every((f) => f(r)))
            .slice(0, maximum);
          if (operation === "insert") {
            const row = {
              status: "submitted",
              payment: "unpaid",
              assigned: null,
              quotes: [],
              confirmation: null,
              version: 1,
              created_at: new Date().toISOString(),
              ...payload,
            };
            mocks.tables[table] = [...rows, row];
            selected = [row];
          }
          if (operation === "update") {
            if (mocks.conflict) selected = [];
            else selected.forEach((r) => Object.assign(r, payload));
          }
          if (operation === "delete")
            mocks.tables[table] = rows.filter((r) => !selected.includes(r));
          return Promise.resolve({
            data: single ? selected[0] || null : selected,
            error: null,
          }).then(resolve);
        },
      };
      return q;
    },
    rpc: async () => ({ data: true, error: null }),
  }),
}));
import { GET, POST } from "@/app/api/sewing/[...path]/route";
import { hash } from "@/lib/sewing/server";
import { names, type Order } from "@/lib/sewing/types";
const id = "11111111-1111-4111-8111-111111111111";
const fileId = "22222222-2222-4222-8222-222222222222";
const form = {
  kind: "personal",
  product: "hoodie",
  quantity: 2,
  date: "2026-11-20",
  name: "Student",
  wechat: "student-wechat",
  group: "",
  notes: "",
  fileIds: [],
};
function as(email: string) {
  mocks.cookies.set("sewing_session", email);
  mocks.tables.sewing_sessions = [
    { email, token_hash: hash(email), expires_at: "2099-01-01T00:00:00Z" },
  ];
}
function order(patch: Partial<Order> = {}) {
  const o = {
    id,
    owner: "a@school.test",
    assigned: "member@school.test",
    status: "submitted",
    payment: "unpaid",
    data: form,
    quotes: [],
    updates: [
      {
        at: "2026-10-18",
        by: "admin",
        text: "SECRET INTERNAL",
        internal: true,
      },
    ],
    confirmation: null,
    version: 1,
    created_at: "2026-10-18",
    ...patch,
  };
  mocks.tables.sewing_orders = [o];
  return o;
}
async function call(
  path: string,
  data?: unknown,
  origin = "http://localhost:3000",
) {
  const req = new NextRequest(`http://localhost:3000/api/sewing/${path}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      host: "localhost:3000",
      origin,
      "x-sewing-request": "1",
      "Content-Type": "application/json",
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  return (data === undefined ? GET : POST)(req, {
    params: Promise.resolve({ path: path.split("?")[0].split("/") }),
  });
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "server-test-key");
  vi.stubEnv("SEWING_SCHOOL_DOMAINS", "school.test");
  vi.stubEnv("SEWING_NOTIFY_EMAILS", "");
  mocks.admin.mockResolvedValue(false);
  mocks.cookies.clear();
  mocks.tables = {
    sewing_members: [
      { email: "member@school.test", name: "Member", contact: "wechat-member" },
    ],
  };
  mocks.conflict = false;
});
describe("sewing private workflow (mock database integration)", () => {
  it("rejects anonymous private reads and cross-origin writes", async () => {
    expect((await call("orders")).status).toBe(401);
    expect((await call("orders", {}, "https://attacker.test")).status).toBe(
      403,
    );
  });
  it("restricts school domains on every authenticated request", async () => {
    as("a@other.test");
    expect((await call("orders")).status).toBe(401);
  });
  it("saves a request without artwork and returns the same reference on retry without exposing notes", async () => {
    as("a@school.test");
    const first = await call("orders", { id, data: form });
    expect(first.status).toBe(200);
    expect((await first.json()).order.id).toBe(id);
    (mocks.tables.sewing_orders[0].updates as unknown[]).push({
      text: "INTERNAL SECRET",
      internal: true,
    });
    const retry = await call("orders", { id, data: form });
    expect(JSON.stringify(await retry.json())).not.toContain("SECRET");
    expect(mocks.tables.sewing_orders).toHaveLength(1);
  });
  it("does not allow attaching another customer’s file", async () => {
    as("a@school.test");
    mocks.tables.sewing_files = [
      { id: fileId, owner: "b@school.test", purpose: "original" },
    ];
    expect(
      (await call("orders", { id, data: { ...form, fileIds: [fileId] } }))
        .status,
    ).toBe(400);
  });
  it("rejects other customers and unassigned members, including file access", async () => {
    order({ data: { ...form, fileIds: [fileId] } } as Partial<Order>);
    mocks.tables.sewing_files = [
      { id: fileId, owner: "a@school.test", purpose: "original" },
    ];
    as("b@school.test");
    expect((await call(`orders/${id}`)).status).toBe(404);
    expect((await call(`files/${fileId}`)).status).toBe(404);
    as("member@school.test");
    mocks.tables.sewing_orders[0].assigned = "other@school.test";
    expect((await call(`orders/${id}`)).status).toBe(404);
  });
  it("filters internal notes from customers but shows them to assigned members", async () => {
    order();
    as("a@school.test");
    const customer = await (await call(`orders/${id}`)).json();
    expect(customer.order.updates).toEqual([]);
    expect(customer.member.contact).toBe("wechat-member");
    as("member@school.test");
    const member = await (await call(`orders/${id}`)).json();
    expect(member.order.updates[0].text).toBe("SECRET INTERNAL");
  });
  it("only admins can assign an existing member", async () => {
    order();
    as("member@school.test");
    expect(
      (
        await call(`orders/${id}`, {
          version: 1,
          action: "assign",
          email: "member@school.test",
        })
      ).status,
    ).toBe(403);
    mocks.admin.mockResolvedValue(true);
    expect(
      (
        await call(`orders/${id}`, {
          version: 1,
          action: "assign",
          email: "member@school.test",
        })
      ).status,
    ).toBe(200);
  });
  it("preserves quote versions, requires customer confirmation, then allows production", async () => {
    order();
    as("member@school.test");
    const quote = {
      items: [{ label: "Hoodie", quantity: 2, unit: 99.5 }],
      notes: "Discussed via WeChat",
      delivery: "2026-11-20",
    };
    expect(
      (await call(`orders/${id}`, { version: 1, action: "quote", quote }))
        .status,
    ).toBe(200);
    let o = mocks.tables.sewing_orders[0] as unknown as Order;
    expect(o.quotes[0].total).toBe(199);
    expect(
      (
        await call(`orders/${id}`, {
          version: 2,
          action: "update",
          status: "production",
          payment: "unpaid",
          text: "start",
          internal: false,
        })
      ).status,
    ).toBe(400);
    as("a@school.test");
    expect(
      (
        await call(`orders/${id}`, {
          version: 2,
          action: "confirm",
          quoteId: o.quotes[0].id,
        })
      ).status,
    ).toBe(200);
    as("member@school.test");
    expect(
      (await call(`orders/${id}`, { version: 3, action: "quote", quote }))
        .status,
    ).toBe(200);
    o = mocks.tables.sewing_orders[0] as unknown as Order;
    expect(o.quotes).toHaveLength(2);
    expect(o.confirmation).toBeNull();
    as("a@school.test");
    expect(
      (
        await call(`orders/${id}`, {
          version: 4,
          action: "confirm",
          quoteId: o.quotes[0].id,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await call(`orders/${id}`, {
          version: 4,
          action: "confirm",
          quoteId: o.quotes[1].id,
        })
      ).status,
    ).toBe(200);
    as("member@school.test");
    expect(
      (
        await call(`orders/${id}`, {
          version: 5,
          action: "update",
          status: "production",
          payment: "deposit",
          text: "Maker confirmed start",
          internal: false,
        })
      ).status,
    ).toBe(200);
    expect(
      (mocks.tables.sewing_orders[0].updates as { text: string }[]).some((u) =>
        u.text.includes("Payment:"),
      ),
    ).toBe(true);
  });
  it("rejects stale and racing updates", async () => {
    order();
    as("member@school.test");
    expect(
      (await call(`orders/${id}`, { version: 0, action: "update" })).status,
    ).toBe(409);
    mocks.conflict = true;
    expect(
      (
        await call(`orders/${id}`, {
          version: 1,
          action: "update",
          status: "communicating",
          payment: "unpaid",
          text: "Called",
          internal: false,
        })
      ).status,
    ).toBe(409);
  });
  it("rejects wrong/unsupported image headers before storage", async () => {
    as("a@school.test");
    const r = await POST(
      new NextRequest("http://localhost:3000/api/sewing/files", {
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "x-sewing-request": "1",
          "Content-Type": "image/png",
          "x-file-purpose": "original",
        },
        body: "<svg>not PNG</svg>",
      }),
      { params: Promise.resolve({ path: ["files"] }) },
    );
    expect(r.status).toBe(415);
  });
  it("fails safely with no backend credentials and exposes public fallback without orders", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const r = await call("content");
    const c = await r.json();
    expect(c.configured).toBe(false);
    expect(c.content.products).toHaveLength(Object.keys(names).length);
    expect(c).not.toHaveProperty("orders");
  });
});
