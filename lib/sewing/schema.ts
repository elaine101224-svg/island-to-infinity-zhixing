import { z } from "zod";
import { productTypes } from "./types";
const text = z.object({ zh: z.string().max(5000), en: z.string().max(5000) });
const photo = z.string().uuid();
export const contentSchema = z.object({
  story: text,
  wechat: z.string().max(200),
  teams: z.string().max(300).default(""),
  products: z
    .array(
      z.object({
        id: z.enum(productTypes),
        description: text,
        price: text,
        lead: text,
        fabric: text,
        moq: z.number().int().min(1).max(100000).nullable(),
        colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(50),
        photos: z.array(photo).max(20),
      }),
    )
    .length(4)
    .refine((p) => new Set(p.map((x) => x.id)).size === 4),
  gallery: z
    .array(
      z.object({
        id: z.string().max(100),
        title: text,
        caption: text,
        kind: z.enum(["work", "team", "design", "finished"]),
        photo,
      }),
    )
    .max(100),
  faq: z.array(z.object({ question: text, answer: text })).max(40),
});
export const requestSchema = z
  .object({
    kind: z.enum(["personal", "group"]),
    product: z.enum(productTypes),
    quantity: z.number().int().min(1).max(100000),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine(
        (x) =>
          !isNaN(Date.parse(x)) && new Date(x).toISOString().slice(0, 10) === x,
      ),
    name: z.string().trim().min(1).max(100),
    wechat: z.string().trim().min(1).max(200),
    group: z.string().trim().max(200),
    notes: z.string().max(5000),
    fileIds: z.array(z.string().uuid()).max(12),
  })
  .refine((x) => x.kind !== "group" || x.group.length > 0);
export const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(300),
        quantity: z.number().int().min(1).max(100000),
        unit: z
          .number()
          .min(0)
          .max(1000000)
          .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.00001),
      }),
    )
    .min(1)
    .max(50),
  notes: z.string().max(3000),
  delivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export function imageMime(b: Buffer) {
  if (
    b.length >= 8 &&
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (
    b.subarray(0, 4).toString() === "RIFF" &&
    b.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
