"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Garment, { garmentPath } from "./Garment";
import { ErrorMessage, api, upload, useSewing } from "./shared";
import {
  names,
  productTypes,
  type Content,
  type Garment as Kind,
  type Identity,
} from "@/lib/sewing/types";
type Design = {
  src: string;
  file: File | null;
  x: number;
  y: number;
  scale: number;
  angle: number;
  ratio: number;
};
const blank = (): Design => ({
  src: "",
  file: null,
  x: 250,
  y: 250,
  scale: 120,
  angle: 0,
  ratio: 1,
});
export default function Preview({
  content,
  user,
}: {
  content: Content;
  user: Identity | null;
}) {
  const { lang, t } = useSewing();
  const [kind, setKind] = useState<Kind>("hoodie");
  const [side, setSide] = useState<"front" | "back">("front");
  const [color, setColor] = useState("#d4c8b8");
  const [designs, setDesigns] = useState({ front: blank(), back: blank() });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const d = designs[side];
  const colors = content.products.find((p) => p.id === kind)?.colors || [];
  const change = (patch: Partial<Design>) => {
    setSaved("");
    setDesigns((s) => ({ ...s, [side]: { ...s[side], ...patch } }));
  };
  async function load(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 5242880) throw new Error("size");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
        throw new Error("file");
      const src = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("file"));
        img.src = src;
      });
      if (img.width * img.height > 40000000) throw new Error("size");
      change({ ...blank(), src, file, ratio: img.width / img.height });
    } catch (e) {
      setError(e instanceof Error ? e.message : "file");
    }
  }
  async function render(which: "front" | "back") {
    const source = svg.current!.cloneNode(true) as SVGSVGElement;
    const group = source.querySelector("[data-design]")!;
    group.replaceChildren();
    const design = designs[which];
    const ns = "http://www.w3.org/2000/svg"; // Rebuild using current side's preserved original data, without resampling its content.
    const background = source.querySelector("[data-garment]")!;
    background.replaceChildren();
    const template = document.getElementById(`sw-export-${which}`)!;
    for (const child of Array.from(template.children))
      background.append(child.cloneNode(true));
    if (design.src) {
      const image = document.createElementNS(ns, "image");
      image.setAttribute("href", design.src);
      image.setAttribute("x", String(-design.scale / 2));
      image.setAttribute("y", String(-design.scale / design.ratio / 2));
      image.setAttribute("width", String(design.scale));
      image.setAttribute("height", String(design.scale / design.ratio));
      image.setAttribute(
        "transform",
        `translate(${design.x} ${design.y}) rotate(${design.angle})`,
      );
      image.setAttribute("preserveAspectRatio", "xMidYMid meet");
      group.append(image);
    }
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(source)], {
        type: "image/svg+xml",
      }),
    );
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = url;
      });
      const c = document.createElement("canvas");
      c.width = 1000;
      c.height = 1100;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#faf7f2";
      ctx.fillRect(0, 0, 1000, 1100);
      ctx.drawImage(image, 0, 0, 1000, 1100);
      ctx.fillStyle = "#6b5b4e";
      ctx.font = "18px sans-serif";
      ctx.fillText(
        `${names[kind][lang]} · ${which === "front" ? t("正面", "Front") : t("背面", "Back")} · ${color}`,
        40,
        1020,
      );
      ctx.fillText(
        t(
          "效果预览 · 以最终确认与打样为准",
          "PREVIEW · Subject to confirmation and sampling",
        ),
        40,
        1060,
      );
      return await new Promise<Blob>((resolve, reject) =>
        c.toBlob((b) => (b ? resolve(b) : reject()), "image/png"),
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  async function exportSide(which: "front" | "back") {
    setError("");
    try {
      const blob = await render(which);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-${which}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 20000);
    } catch {
      setError("file");
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const files = [];
      for (const which of ["front", "back"] as const) {
        if (designs[which].file)
          files.push(
            await upload(
              designs[which].file!,
              `${which}-${designs[which].file!.name}`,
              "original",
            ),
          );
        files.push(
          await upload(
            await render(which),
            `${kind}-${which}-preview.png`,
            "preview",
          ),
        );
      }
      const result = await api("previews", {
        id: crypto.randomUUID(),
        product: kind,
        color,
        fileIds: files.map((f) => f.id),
        transforms: {
          front: {
            x: designs.front.x,
            y: designs.front.y,
            scale: designs.front.scale,
            angle: designs.front.angle,
          },
          back: {
            x: designs.back.x,
            y: designs.back.y,
            scale: designs.back.scale,
            angle: designs.back.angle,
          },
        },
      });
      setSaved(result.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <p className="sw-eyebrow">
        {t("把想法穿在身上", "Make your idea wearable")}
      </p>
      <h1>{t("服装模板预览", "Garment preview studio")}</h1>
      <p>
        {t(
          "免费浏览器端工具。上传图案保持原始比例与内容；工具不会重绘文字或图案。",
          "A free browser tool. Uploaded artwork keeps its original proportions and content; no artwork or text is regenerated.",
        )}
      </p>
      <div className="sw-studio">
        <div className="sw-canvas">
          <svg
            ref={svg}
            viewBox="0 0 500 550"
            role="img"
            aria-label={t("可拖动服装效果预览", "Draggable garment preview")}
            onPointerDown={(e) => {
              if (!d.src) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = {
                x: d.x,
                y: d.y,
                startX: e.clientX,
                startY: e.clientY,
              };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              change({
                x: Math.max(
                  20,
                  Math.min(
                    480,
                    drag.current.x +
                      ((e.clientX - drag.current.startX) * 500) / rect.width,
                  ),
                ),
                y: Math.max(
                  30,
                  Math.min(
                    470,
                    drag.current.y +
                      ((e.clientY - drag.current.startY) * 550) / rect.height,
                  ),
                ),
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            style={{ touchAction: "none" }}
          >
            <defs>
              <clipPath id="sw-clip">
                <path d={garmentPath(kind)} />
              </clipPath>
            </defs>
            <g data-garment>
              <Garment kind={kind} color={color} side={side} />
            </g>
            <g data-design clipPath="url(#sw-clip)">
              {d.src && (
                <image
                  href={d.src}
                  x={-d.scale / 2}
                  y={-d.scale / d.ratio / 2}
                  width={d.scale}
                  height={d.scale / d.ratio}
                  transform={`translate(${d.x} ${d.y}) rotate(${d.angle})`}
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
            </g>
          </svg>
          <span className="sw-tag">
            {t(
              "模板效果预览 · 非真实成品照片",
              "TEMPLATE PREVIEW · NOT A PRODUCT PHOTO",
            )}
          </span>
          <svg width="0" height="0" aria-hidden="true">
            <g id="sw-export-front">
              <Garment kind={kind} color={color} side="front" />
            </g>
            <g id="sw-export-back">
              <Garment kind={kind} color={color} side="back" />
            </g>
          </svg>
        </div>
        <div className="sw-panel">
          <label>
            {t("款式", "Style")}
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as Kind);
                setSaved("");
              }}
            >
              {productTypes.map((p) => (
                <option key={p} value={p}>
                  {names[p][lang]}
                </option>
              ))}
            </select>
          </label>
          <div className="sw-row">
            {(["front", "back"] as const).map((s) => (
              <button
                className={side === s ? "active" : ""}
                key={s}
                onClick={() => setSide(s)}
              >
                {s === "front" ? t("正面", "Front") : t("背面", "Back")}
              </button>
            ))}
          </div>
          <label>
            {t("产品色卡", "Product swatches")}
            <div className="sw-swatches">
              {colors.length ? (
                colors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    style={{ background: c }}
                    onClick={() => {
                      setColor(c);
                      setSaved("");
                    }}
                    aria-label={c}
                  />
                ))
              ) : (
                <small>
                  {t("实际色卡待确认", "Actual swatches to be confirmed")}
                </small>
              )}
            </div>
          </label>
          <label>
            {t("自定义颜色 / HEX", "Custom color / HEX")}
            <div className="sw-row">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setSaved("");
                }}
              />
              <input
                aria-label="HEX"
                value={color}
                pattern="#[0-9a-fA-F]{6}"
                maxLength={7}
                onChange={(e) => {
                  setColor(e.target.value);
                  setSaved("");
                }}
              />
            </div>
          </label>
          {!colors.includes(color) && (
            <small>
              {t(
                "自定义颜色需确认实际面料供应。",
                "Custom colors require fabric availability confirmation.",
              )}
            </small>
          )}
          <label>
            {t(
              "上传当前面的图案（每张 ≤5 MB）",
              "Artwork for this side (≤5 MB each)",
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => load(e.target.files?.[0])}
            />
          </label>
          <p>
            <small>
              {t(
                "拖动图案，或用下方滑块精确调整；切换正反面会保留设计。",
                "Drag artwork or use the sliders below. Both sides retain their designs.",
              )}
            </small>
          </p>
          {(
            [
              {
                key: "x",
                zh: "水平位置",
                en: "Horizontal position",
                min: 20,
                max: 480,
              },
              {
                key: "y",
                zh: "垂直位置",
                en: "Vertical position",
                min: 30,
                max: 470,
              },
              {
                key: "scale",
                zh: "图案宽度",
                en: "Artwork width",
                min: 20,
                max: 350,
              },
              {
                key: "angle",
                zh: "旋转角度",
                en: "Rotation",
                min: -180,
                max: 180,
              },
            ] as const
          ).map((c) => (
            <label key={c.key}>
              {t(c.zh, c.en)} · {Math.round(d[c.key])}
              <input
                type="range"
                min={c.min}
                max={c.max}
                value={d[c.key]}
                onChange={(e) => change({ [c.key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <button onClick={() => change(blank())}>
            {t("重置当前面", "Reset this side")}
          </button>
          <div className="sw-row">
            <button onClick={() => exportSide("front")}>
              {t("导出正面", "Export front")}
            </button>
            <button onClick={() => exportSide("back")}>
              {t("导出背面", "Export back")}
            </button>
          </div>
          {user ? (
            <button
              className="sw-primary"
              disabled={busy || !/^#[0-9a-fA-F]{6}$/.test(color)}
              onClick={save}
            >
              {busy
                ? t("正在保存…", "Saving…")
                : t("保存预览与原图", "Save preview & originals")}
            </button>
          ) : (
            <Link className="sw-button" href="/sewing/login">
              {t("验证校内身份后保存", "Verify school email to save")}
            </Link>
          )}
          {saved && (
            <p role="status">
              {t("已保存至账号。", "Saved to your account.")}{" "}
              <Link href={`/sewing/request?preview=${saved}`}>
                {t("附加到定制需求 →", "Attach to a request →")}
              </Link>
            </p>
          )}
          <ErrorMessage code={error} />
        </div>
      </div>
      <p className="sw-notice">
        {t(
          "效果预览仅供沟通参考，颜色、比例及工艺以最终确认和打样为准。",
          "Previews are for communication only. Colors, scale and techniques are subject to final confirmation and sampling.",
        )}
      </p>
    </section>
  );
}
