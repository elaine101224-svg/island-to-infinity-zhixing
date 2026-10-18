import { describe, it, expect, vi } from "vitest";
import { allowedEmail, canRead, canManage } from "@/lib/sewing/server";
import { contentSchema, imageMime, requestSchema } from "@/lib/sewing/schema";
import { defaultContent, type Order } from "@/lib/sewing/types";
describe("sewing validation and authorization", () => {
  it("uses exact, configured domains and is disabled by default", () => {
    vi.stubEnv("SEWING_SCHOOL_DOMAINS", "");
    expect(allowedEmail("a@school.test")).toBe(false);
    vi.stubEnv("SEWING_SCHOOL_DOMAINS", "school.test");
    expect(allowedEmail("a@school.test")).toBe(true);
    expect(allowedEmail("a@school.test.evil")).toBe(false);
    expect(allowedEmail("a@sub.school.test")).toBe(false);
  });
  it("separates customer read permission from staff management", () => {
    const o = { owner: "a", assigned: "m" } as Order;
    expect(canRead({ email: "a", role: "customer" }, o)).toBe(true);
    expect(canManage({ email: "a", role: "customer" }, o)).toBe(false);
    expect(canManage({ email: "m", role: "member" }, o)).toBe(true);
    expect(canRead({ email: "other", role: "member" }, o)).toBe(false);
  });
  it("requires group identity, positive quantities and a real date", () => {
    const valid = {
      kind: "group",
      product: "jersey",
      quantity: 1,
      date: "2026-11-20",
      name: "A",
      wechat: "W",
      group: "House",
      notes: "",
      fileIds: [],
    };
    expect(requestSchema.safeParse(valid).success).toBe(true);
    for (const patch of [
      { group: "" },
      { quantity: 0 },
      { date: "2026-02-30" },
    ])
      expect(requestSchema.safeParse({ ...valid, ...patch }).success).toBe(
        false,
      );
  });
  it("rejects active SVG and MIME spoofing; recognizes supported signatures", () => {
    expect(imageMime(Buffer.from('<svg onload="alert(1)">'))).toBeNull();
    expect(imageMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
      "image/png",
    );
    expect(imageMime(Buffer.from([255, 216, 255]))).toBe("image/jpeg");
    expect(imageMime(Buffer.from("RIFF1234WEBP"))).toBe("image/webp");
  });
  it("requires all four unique bilingual products and valid photo IDs / swatches", () => {
    expect(contentSchema.safeParse(defaultContent).success).toBe(true);
    expect(
      contentSchema.safeParse({
        ...defaultContent,
        products: Array(4).fill(defaultContent.products[0]),
      }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...defaultContent,
        gallery: [
          {
            id: "a",
            title: { zh: "中", en: "English" },
            caption: { zh: "", en: "" },
            kind: "design",
            photo: "https://evil.test",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
