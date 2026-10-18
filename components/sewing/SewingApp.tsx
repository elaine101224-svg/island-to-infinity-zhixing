"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LanguageProvider,
  useSewing,
  api,
  ErrorMessage,
  Pending,
} from "./shared";
import {
  defaultContent,
  type Content,
  type Identity,
} from "@/lib/sewing/types";
import PublicContent from "./PublicContent";
import dynamic from "next/dynamic";
const Preview = dynamic(() => import("./Preview"), {
  loading: () => <Pending />,
});
const RequestForm = dynamic(() => import("./RequestForm"), {
  loading: () => <Pending />,
});
const Login = dynamic(() => import("./Login"), { loading: () => <Pending /> });
const Orders = dynamic(() => import("./Orders"), {
  loading: () => <Pending />,
});
const ContentEditor = dynamic(() => import("./ContentEditor"), {
  loading: () => <Pending />,
});
import "./sewing.css";
function Main({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { t } = useSewing();
  const [content, setContent] = useState<Content>(defaultContent);
  const [user, setUser] = useState<Identity | null>(null);
  const [configured, setConfigured] = useState(false);
  const [loginConfigured, setLoginConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.allSettled([api("content"), api("session")]).then(([c, s]) => {
      if (!active) return;
      if (c.status === "fulfilled") {
        setContent(c.value.content);
        setConfigured(c.value.configured);
        setLoginConfigured(c.value.loginConfigured);
      } else setError(c.reason.message);
      if (s.status === "fulfilled") setUser(s.value.user);
      else setError(s.reason.message);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const parts = pathname.replace(/^\/sewing\/?/, "").split("/");
  const view = parts[0] || "home";
  const links = [
    ["products", t("产品", "Garments")],
    ["collaborations", t("以往合作", "Collaborations")],
    ["story", t("团队故事", "Our story")],
    ["faq", t("流程与 FAQ", "Process & FAQ")],
    ["preview", t("模板预览", "Preview studio")],
    ["orders", t("我的订单", "My orders")],
  ];
  if (loading) return <Pending />;
  return (
    <>
      <nav
        className="sw-nav"
        aria-label={t("服装定制导航", "Sewing navigation")}
      >
        {links.map(([path, label]) => (
          <Link
            key={path}
            href={`/sewing/${path}`}
            aria-current={view === path ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        {user?.role === "member" && (
          <Link href="/sewing/manage">
            {t("成员工作台", "Member workspace")}
          </Link>
        )}
        {user ? (
          <button
            onClick={async () => {
              try {
                await api("auth/logout", {});
                location.assign("/sewing");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {t("退出校内账号", "Sign out of school account")}
          </button>
        ) : (
          <Link href="/sewing/login">
            {t("校内邮箱登录", "School sign-in")}
          </Link>
        )}
      </nav>
      <ErrorMessage code={error} />
      {!configured && (
        <p className="sw-setup" role="status">
          {t(
            "配置待完成：公开介绍与本地预览可用；线上保存、登录和订单需先配置数据库与邮件服务。这里不会生成演示订单。",
            "Setup pending: public pages and local previews work. Sign-in, saving and orders require database and email configuration. No demo orders are generated.",
          )}
        </p>
      )}
      <div className="sw-main">
        {admin ? (
          <>
            <div className="sw-row">
              <button onClick={() => setEditor(false)}>
                {t("需求与成员", "Requests & members")}
              </button>
              <button onClick={() => setEditor(true)}>
                {t("产品、照片与内容", "Products, photos & content")}
              </button>
            </div>
            {editor ? (
              <ContentEditor initial={content} />
            ) : (
              <Orders
                user={user}
                manage
                id={params.get("order") || undefined}
              />
            )}
          </>
        ) : view === "preview" ? (
          <Preview content={content} user={user} />
        ) : view === "request" ? (
          <RequestForm user={user} />
        ) : view === "login" ? (
          <Login configured={loginConfigured} />
        ) : view === "orders" || view === "manage" ? (
          <Orders user={user} id={parts[1]} manage={view === "manage"} />
        ) : [
            "home",
            "products",
            "collaborations",
            "story",
            "faq",
            "wechat",
          ].includes(view) ? (
          <PublicContent content={content} view={view} />
        ) : (
          <section>
            <h1>{t("未找到页面", "Page not found")}</h1>
            <Link href="/sewing">
              {t("返回服装定制首页", "Back to sewing")}
            </Link>
          </section>
        )}
      </div>
      <footer className="sw-footer">
        {t(
          "常熟爱心缝纫队 × Island to Infinity · 用手艺连接社区",
          "Changshu Sewing Team × Island to Infinity · Connecting through craft",
        )}
        <br />
        <small>
          {t(
            "联系信息仅用于定制沟通。设计文件仅本人、对应跟进成员与管理员可访问。请勿上传无权使用的设计或他人的敏感信息。",
            "Contact details are used for customization. Design files are accessible only to you, your assigned member and administrators. Only upload designs you may use; exclude others’ sensitive information.",
          )}
        </small>
      </footer>
    </>
  );
}
export default function SewingApp({ admin = false }: { admin?: boolean }) {
  return (
    <LanguageProvider>
      <Suspense fallback={<Pending />}>
        <Main admin={admin} />
      </Suspense>
    </LanguageProvider>
  );
}
