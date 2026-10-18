"use client";
import { useState } from "react";
import { api, ErrorMessage, useSewing } from "./shared";
export default function Login({ configured }: { configured: boolean }) {
  const { t } = useSewing();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [until, setUntil] = useState(0);
  async function act(verify: boolean) {
    setBusy(true);
    setError("");
    try {
      await api(verify ? "auth/verify" : "auth/send", { email, code });
      if (verify) location.assign("/sewing/orders");
      else {
        setSent(true);
        setUntil(Date.now() + 60000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="sw-narrow">
      <p className="sw-eyebrow">
        {t("仅需学校邮箱，无需密码", "Your school email. No password.")}
      </p>
      <h1>{t("验证校内身份", "Verify your school identity")}</h1>
      <p>
        {t(
          "用于提交需求、保存设计预览及查看自己的订单。验证码10分钟有效，最多尝试5次，每60秒可重发一次。",
          "Required to submit requests, save previews and view your orders. Codes expire in 10 minutes, allow 5 attempts, and can be resent after 60 seconds.",
        )}
      </p>
      {!configured && (
        <p className="sw-notice">
          {t(
            "验证码登录尚未启用：需完成数据库与验证码邮件服务配置。公开浏览与本地模板导出可用。",
            "Code sign-in is not enabled yet: database access and verification email delivery must be configured. Public browsing and local preview export are available.",
          )}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          act(sent);
        }}
      >
        <label>
          {t("学校邮箱", "School email")}
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
          />
        </label>
        {sent && (
          <label>
            {t("六位验证码", "Six-digit code")}
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
        )}
        <button className="sw-primary" disabled={busy || !configured}>
          {busy
            ? t("处理中…", "Working…")
            : sent
              ? t("验证并登录", "Verify and sign in")
              : t("发送验证码", "Send code")}
        </button>
        {sent && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (Date.now() < until) {
                setError("rate");
                return;
              }
              act(false);
            }}
          >
            {t("重新发送", "Resend code")}
          </button>
        )}
      </form>
      {sent && (
        <p role="status">
          {t(
            "验证码已发送，请检查学校邮箱。",
            "Code sent. Check your school inbox.",
          )}
        </p>
      )}
      <ErrorMessage code={error} />
    </section>
  );
}
