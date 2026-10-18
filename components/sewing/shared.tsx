"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/sewing/types";
let memoryLanguage: Lang = "zh";
const subscribeLanguage = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("sewing-language", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sewing-language", callback);
  };
};
const readLanguage = (): Lang => {
  try {
    const stored = localStorage.getItem("sewing-language");
    return stored === "en" ? "en" : stored === "zh" ? "zh" : memoryLanguage;
  } catch {
    return memoryLanguage;
  }
};
export const Language = createContext<{
  lang: Lang;
  t: (zh: string, en: string) => string;
}>({ lang: "zh", t: (zh) => zh });
export const useSewing = () => useContext(Language);
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeLanguage,
    readLanguage,
    (): Lang => "zh",
  );
  const t = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <Language.Provider value={{ lang, t }}>
      <div className="sewing">
        <div className="sw-top">
          <Link href="/sewing">
            {t("常熟爱心缝纫队", "Changshu Sewing Team")}{" "}
            <span>× Island to Infinity</span>
          </Link>
          <button
            onClick={() => {
              const next = lang === "zh" ? "en" : "zh";
              memoryLanguage = next;
              try {
                localStorage.setItem("sewing-language", next);
              } catch {}
              window.dispatchEvent(new Event("sewing-language"));
            }}
            aria-label="Switch language"
          >
            中文 / English · {lang.toUpperCase()}
          </button>
        </div>
        {children}
      </div>
    </Language.Provider>
  );
}
export const errors: Record<string, [string, string]> = {
  setup: [
    "服务尚未配置，请联系项目成员。",
    "Service is not configured. Please contact the project team.",
  ],
  storage: [
    "数据服务暂不可用，请重试；内容已保留。",
    "Data service unavailable. Please retry; your input is preserved.",
  ],
  login: ["请先验证校内邮箱。", "Please verify your school email first."],
  school: [
    "请使用已确认白名单内的学校邮箱。",
    "Use a school email from the confirmed allowlist.",
  ],
  mailSetup: [
    "邮件服务尚未配置，暂无法发送。",
    "Email delivery has not been configured.",
  ],
  mailFailed: [
    "邮件发送失败，请稍后重试。",
    "Email delivery failed. Please retry later.",
  ],
  code: [
    "验证码无效、过期或尝试次数已达上限，请重新获取。",
    "Code invalid, expired, or attempt limit reached. Request a new code.",
  ],
  rate: [
    "操作太频繁，请稍后重试（验证码至少间隔60秒）。",
    "Too many attempts. Please retry later (at least 60 seconds between codes).",
  ],
  invalid: [
    "请检查必填信息及输入格式。",
    "Check required fields and input formats.",
  ],
  file: [
    "附件类型或访问权限不正确。仅支持 PNG、JPG、WebP。",
    "Invalid file or access. PNG, JPG and WebP only.",
  ],
  size: ["图片不能超过 5 MB。", "Images must be no larger than 5 MB."],
  missing: [
    "未找到该内容或没有访问权限。",
    "Content not found or access denied.",
  ],
  forbidden: [
    "没有执行此操作的权限。",
    "You do not have permission for this action.",
  ],
  conflict: [
    "内容已更新，请刷新后再操作。",
    "This record changed. Refresh before trying again.",
  ],
  transition: [
    "请先完成沟通、报价和客户确认，再更新到下一阶段。",
    "Complete discussion, quote and customer confirmation before the next stage.",
  ],
  network: ["网络连接失败，请重试。", "Connection failed. Please retry."],
};
export async function api(path: string, data?: unknown) {
  let r: Response;
  try {
    r = await fetch(
      `/api/sewing/${path}`,
      data === undefined
        ? { cache: "no-store" }
        : {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-sewing-request": "1",
            },
            body: JSON.stringify(data),
          },
    );
  } catch {
    throw new Error("network");
  }
  const result = await r.json();
  if (!r.ok) throw new Error(result.error || "storage");
  return result;
}
export async function upload(
  file: File | Blob,
  name: string,
  purpose: "original" | "preview" | "public",
) {
  if (file.size > 5242880) throw new Error("size");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("file");
  const r = await fetch("/api/sewing/files", {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      "x-sewing-request": "1",
      "x-file-name": encodeURIComponent(name),
      "x-file-purpose": purpose,
    },
    body: file,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data.file;
}
export function ErrorMessage({ code }: { code: string }) {
  const { t } = useSewing();
  return code ? (
    <p role="alert" className="sw-error">
      {t(...(errors[code] || errors.storage))}
    </p>
  ) : null;
}
export function Pending() {
  const { t } = useSewing();
  return <p role="status">{t("正在加载…", "Loading…")}</p>;
}
export function Notice() {
  const { t } = useSewing();
  return (
    <p className="sw-notice">
      {t(
        "提交需求不代表已接单。价格、交期及制作细节需人工沟通、报价及确认。",
        "A request is not an accepted order. Pricing, timing and production details require discussion, a quote and confirmation.",
      )}
    </p>
  );
}
