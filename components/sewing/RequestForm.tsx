"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ErrorMessage, Notice, upload, useSewing } from "./shared";
import {
  names,
  productTypes,
  type FileRecord,
  type Identity,
  type RequestData,
} from "@/lib/sewing/types";
type SavedPreview = {
  id: string;
  data: { product: keyof typeof names; color: string; fileIds: string[] };
  created_at: string;
};
export default function RequestForm({ user }: { user: Identity | null }) {
  const { t, lang } = useSewing();
  const params = useSearchParams();
  const [data, setData] = useState<RequestData>({
    kind: "personal",
    product: "hoodie",
    quantity: 1,
    date: "",
    name: "",
    wechat: "",
    group: "",
    notes: "",
    fileIds: [],
  });
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [previews, setPreviews] = useState<SavedPreview[]>([]);
  const [selected, setSelected] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const id = useRef("");
  useEffect(() => {
    if (!user) return;
    api("previews")
      .then((r) => {
        setPreviews(r.previews);
        const p = r.previews.find(
          (p: SavedPreview) => p.id === params.get("preview"),
        );
        if (p) {
          setSelected(p.id);
          setData((d) => ({ ...d, product: p.data.product }));
        }
      })
      .catch((e) => setError(e.message));
  }, [user, params]);
  const preview = previews.find((p) => p.id === selected);
  const allIds = [...files.map((f) => f.id), ...(preview?.data.fileIds || [])];
  const change = (key: keyof RequestData, value: string | number) => {
    setData((d) => ({ ...d, [key]: value }));
    setReview(false);
  };
  async function addFiles(list: FileList | null) {
    if (!list) return;
    setBusy(true);
    setError("");
    try {
      if (files.length + list.length > 8) throw new Error("invalid");
      for (const file of Array.from(list)) {
        const f = await upload(file, file.name, "original");
        setFiles((fs) => [...fs, f]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!id.current) id.current = crypto.randomUUID();
      const r = await api("orders", {
        id: id.current,
        data: { ...data, fileIds: [...new Set(allIds)] },
      });
      setSuccess(r.order.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!user)
    return (
      <section>
        <h1>{t("开始定制", "Start a request")}</h1>
        <Notice />
        <p>
          {t(
            "请验证校内邮箱后提交。没有设计稿也可以。",
            "Verify your school email to submit. Artwork is optional.",
          )}
        </p>
        <Link className="sw-button" href="/sewing/login">
          {t("验证校内身份", "Verify school email")}
        </Link>
      </section>
    );
  if (success)
    return (
      <section role="status">
        <p className="sw-eyebrow">{t("需求已保存", "Request saved")}</p>
        <h1>
          {t("谢谢，期待一起制作。", "Thank you. Let’s make it together.")}
        </h1>
        <p>
          {t("唯一编号", "Reference")}: {success}
        </p>
        <Notice />
        <p>
          {t(
            "需求已进入后台待处理列表。此提示不表示已向制作者发送通知。",
            "Your request is in the dashboard queue. This does not mean a notification has been sent to the maker.",
          )}
        </p>
        <Link className="sw-button" href={`/sewing/orders/${success}`}>
          {t("查看需求与后续进度", "View request and follow-up")}
        </Link>
      </section>
    );
  return (
    <section className="sw-narrow">
      <p className="sw-eyebrow">
        {t("从一个想法开始", "It starts with an idea")}
      </p>
      <h1>{t("定制需求", "Customization request")}</h1>
      <Notice />
      <p>
        {t("学校邮箱", "School email")}: {user.email}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setReview(true);
          setError("");
        }}
      >
        <div className="sw-grid two">
          <label>
            {t("需求类型", "Request type")}
            <select
              value={data.kind}
              onChange={(e) => change("kind", e.target.value)}
            >
              <option value="personal">
                {t("个人（支持一两件）", "Individual (one or two welcome)")}
              </option>
              <option value="group">{t("团体", "Group")}</option>
            </select>
          </label>
          <label>
            {t("产品类型", "Product")}
            <select
              value={data.product}
              onChange={(e) => change("product", e.target.value)}
            >
              {productTypes.map((p) => (
                <option key={p} value={p}>
                  {names[p][lang]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("预计数量", "Estimated quantity")}
            <input
              required
              type="number"
              min="1"
              max="100000"
              value={data.quantity}
              onChange={(e) => change("quantity", Number(e.target.value))}
            />
          </label>
          <label>
            {t(
              "希望交付日期（需确认）",
              "Preferred delivery date (to confirm)",
            )}
            <input
              required
              type="date"
              value={data.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </label>
          <label>
            {t("姓名", "Name")}
            <input
              required
              maxLength={100}
              autoComplete="name"
              value={data.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </label>
          <label>
            {t("微信联系方式", "WeChat contact")}
            <input
              required
              maxLength={200}
              value={data.wechat}
              onChange={(e) => change("wechat", e.target.value)}
            />
          </label>
        </div>
        {data.kind === "group" && (
          <label>
            {t("团体名称 / House / 知行", "Group / House / Zhixing")}
            <input
              required
              maxLength={200}
              value={data.group}
              onChange={(e) => change("group", e.target.value)}
            />
          </label>
        )}
        <label>
          {t("补充说明（选填）", "Additional notes (optional)")}
          <textarea
            maxLength={5000}
            value={data.notes}
            onChange={(e) => change("notes", e.target.value)}
          />
        </label>
        <label>
          {t(
            "设计稿或参考图（选填，最多8张，每张 ≤5 MB）",
            "Artwork or references (optional, up to 8, ≤5 MB each)",
          )}
          <input
            disabled={busy}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {files.map((f) => (
          <div key={f.id} className="sw-row">
            <span>{f.name}</span>
            <button
              type="button"
              onClick={() => {
                setFiles((fs) => fs.filter((x) => x.id !== f.id));
                setReview(false);
              }}
            >
              {t("移除", "Remove")}
            </button>
          </div>
        ))}
        <label>
          {t(
            "附加已保存的预览（选填，包含原始图案）",
            "Attach a saved preview (optional, includes originals)",
          )}
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setReview(false);
            }}
          >
            <option value="">{t("不附加", "None")}</option>
            {previews.map((p) => (
              <option value={p.id} key={p.id}>
                {names[p.data.product][lang]} · {p.data.color} ·{" "}
                {new Date(p.created_at).toLocaleString(
                  lang === "zh" ? "zh-CN" : "en-GB",
                )}
              </option>
            ))}
          </select>
        </label>
        <Link href="/sewing/preview" target="_blank">
          {t(
            "在新窗口制作预览（非必需） ↗",
            "Open preview studio (optional) ↗",
          )}
        </Link>
        <p>
          <button disabled={busy} className="sw-primary" type="submit">
            {t("检查提交摘要", "Review request")}
          </button>{" "}
          <button
            disabled={busy}
            type="button"
            onClick={() =>
              api("previews")
                .then((r) => setPreviews(r.previews))
                .catch((e) => setError(e.message))
            }
          >
            {t("刷新已保存预览", "Refresh saved previews")}
          </button>
        </p>
      </form>
      {review && (
        <div className="sw-card" aria-live="polite">
          <h2>{t("提交前确认", "Review before submitting")}</h2>
          <dl>
            <dt>{t("产品 / 数量", "Product / quantity")}</dt>
            <dd>
              {names[data.product][lang]} × {data.quantity}
            </dd>
            <dt>{t("需求类型 / 团体", "Request type / group")}</dt>
            <dd>
              {data.kind === "group" ? data.group : t("个人", "Individual")}
            </dd>
            <dt>{t("希望交付日期", "Preferred delivery")}</dt>
            <dd>{data.date}</dd>
            <dt>{t("姓名 / 微信 / 邮箱", "Name / WeChat / email")}</dt>
            <dd>
              {data.name} · {data.wechat} · {user.email}
            </dd>
            <dt>{t("补充说明", "Notes")}</dt>
            <dd>{data.notes || "—"}</dd>
            <dt>
              {t(
                "附件数量（原图与预览）",
                "Attachments (originals & previews)",
              )}
            </dt>
            <dd>{allIds.length}</dd>
          </dl>
          <Notice />
          <button className="sw-primary" disabled={busy} onClick={submit}>
            {busy
              ? t("正在保存…", "Saving…")
              : t("确认提交需求", "Submit request")}
          </button>
        </div>
      )}
      <ErrorMessage code={error} />
    </section>
  );
}
