"use client";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
} from "@/lib/sewing/types";
import PublicContent from "./PublicContent";
import dynamic from "next/dynamic";
const RequestForm = dynamic(() => import("./RequestForm"), {
  loading: () => <Pending />,
});
const RequestsInbox = dynamic(() => import("./RequestsInbox"), { loading: () => <Pending /> });
const ContentEditor = dynamic(() => import("./ContentEditor"), {
  loading: () => <Pending />,
});
import "./sewing.css";
function Main({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const { t } = useSewing();
  const [content, setContent] = useState<Content>(defaultContent);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.allSettled([api("content"), admin?api("session"):Promise.resolve({user:null})]).then(([c, s]) => {
      if (!active) return;
      if (c.status === "fulfilled") {
        setContent(c.value.content);
        setConfigured(c.value.configured);
      } else setError(c.reason.message);
      if (s.status === "rejected"&&admin) setError(s.reason.message);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [admin]);
  const parts = pathname.replace(/^\/sewing\/?/, "").split("/");
  const view = parts[0] || "home";
  const links = [
    ["products", t("产品", "Garments")],
    ["collaborations", t("以往合作", "Collaborations")],
    ["story", t("团队故事", "Our story")],
    ["faq", t("流程与 FAQ", "Process & FAQ")],
    ["request", t("提交需求", "Submit a request")],
    ["manage", t("订单管理", "Order management")],
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

      </nav>
      <ErrorMessage code={error} />
      {!configured && (
        <p className="sw-setup" role="status">
          {t(
            "需求表单暂时不可用。你可以浏览产品，并通过页面的团队联系方式咨询。",
            "The request form is temporarily unavailable. Browse products or use the team contacts on this page to ask about a request.",
          )}
        </p>
      )}
      <div className="sw-main">
        {admin ? (
          <>
            <div className="sw-row"><Link href="/sewing/manage">订单管理／业务账号</Link>
              <button onClick={() => setEditor(false)}>
                {t("需求列表", "Requests")}
              </button>
              <button onClick={() => setEditor(true)}>
                {t("产品、照片与内容", "Products, photos & content")}
              </button>
            </div>
            {editor ? (
              <ContentEditor initial={content} />
            ) : (
              <RequestsInbox />
            )}
          </>
        ) : view === "request" ? (
          <RequestForm />
        ) : view === "login" ? (
          <RequestForm />
        ) : view === "orders" || view === "manage" ? (
          <RequestForm />
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
            "填写的联系方式仅供团队跟进这份需求，不会公开展示。参考图可在后续微信沟通时发送。",
            "Your contact details are used by the team to follow up on this request and are not displayed publicly. Share reference images later on WeChat.",
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
