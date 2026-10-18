"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ErrorMessage, Notice, Pending, useSewing } from "./shared";
import {
  names,
  paymentNames,
  statuses,
  statusNames,
  type FileRecord,
  type Identity,
  type Member,
  type Order,
  type Status,
} from "@/lib/sewing/types";
export default function Orders({
  user,
  id,
  manage = false,
}: {
  user: Identity | null;
  id?: string;
  manage?: boolean;
}) {
  const { t, lang } = useSewing();
  const [orders, setOrders] = useState<Order[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [member, setMember] = useState<{
    name: string;
    contact: string;
  } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [assigned, setAssigned] = useState("");
  const [status, setStatus] = useState<Status>("submitted");
  const [payment, setPayment] = useState("unpaid");
  const [note, setNote] = useState("");
  const [internal, setInternal] = useState(false);
  const [items, setItems] = useState([{ label: "", quantity: 1, unit: 0 }]);
  const [quoteNote, setQuoteNote] = useState("");
  const [delivery, setDelivery] = useState("");
  const [copy, setCopy] = useState("");
  const [memberDraft, setMemberDraft] = useState({
    email: "",
    name: "",
    contact: "",
  });
  const [notice, setNotice] = useState<{ zh: string; en: string } | null>(null);
  const message = (zh: string, en: string) => ({ zh, en });
  const manager =
    !!user &&
    !!order &&
    (user.role === "admin" ||
      (user.role === "member" && order.assigned === user.email));
  async function load() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (id) {
        const r = await api(`orders/${id}`);
        setOrder(r.order);
        setFiles(r.files);
        setMember(r.member);
        setStatus(r.order.status);
        setPayment(r.order.payment);
        setAssigned(r.order.assigned || "");
      } else {
        const r = await api(`orders?manage=${manage ? "1" : "0"}`);
        setOrders(r.orders);
      }
      if (user.role !== "customer") {
        const r = await api("members");
        setMembers(r.members);
      }
      if (user.role === "admin" && manage) {
        const r = await api("notifications");
        setNotice(
          r.mailConfigured
            ? message(
                `待邮件通知：${r.notifications.length} 笔。请打开需求点击发送；后台待处理提醒始终有效。`,
                `Pending email notifications: ${r.notifications.length}. Open a request to send. Dashboard reminders remain active.`,
              )
            : message(
                "邮件通知未配置，当前仅有后台提醒。需要配置双方通知邮箱、发件地址及邮件服务密钥。成员可复制中文摘要转发；尚未自动通知制作者。",
                "Email notifications are unconfigured. Dashboard reminders are active. Configure both recipients, sender and mail API key. Members can copy Chinese summaries; no maker notification has been sent.",
              ),
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load(); /* language changes reload labels only, not private data */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, manage]);
  async function action(data: Record<string, unknown>) {
    if (!order) return;
    setBusy(true);
    setError("");
    try {
      await api(`orders/${order.id}`, { version: order.version, ...data });
      setNote("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copySummary(o: Order) {
    const text = `定制需求编号：${o.id}\n产品：${names[o.data.product].zh}\n数量：${o.data.quantity}\n希望交期：${o.data.date}（待确认）\n姓名：${o.data.name}\n微信：${o.data.wechat}\n学校邮箱：${o.owner}\n团体：${o.data.group || "个人"}\n备注：${o.data.notes || "无"}\n提交仅为咨询，价格及交期需人工确认。`;
    setCopy(text);
    try {
      await navigator.clipboard.writeText(text);
      setNotice(
        message(
          "中文需求摘要已复制，可转发给制作者。",
          "Chinese summary copied. You can forward it to the maker.",
        ),
      );
    } catch {
      setNotice(
        message(
          "请长按下方摘要手动复制。",
          "Press and hold the summary below to copy manually.",
        ),
      );
    }
  }
  if (!user)
    return (
      <section>
        <h1>{t("我的需求与订单", "My requests & orders")}</h1>
        <Link href="/sewing/login" className="sw-button">
          {t("验证校内邮箱", "Verify school email")}
        </Link>
      </section>
    );
  if (loading) return <Pending />;
  const date = (s: string) =>
    new Date(s).toLocaleString(lang === "zh" ? "zh-CN" : "en-GB");
  return (
    <section>
      <div className="sw-row">
        <h1>
          {id
            ? t("需求详情与跟进", "Request & follow-up")
            : manage
              ? t("需求管理", "Request management")
              : t("我的需求与订单", "My requests & orders")}
        </h1>
        <button disabled={busy} onClick={load}>
          {t("刷新 / 重试", "Refresh / retry")}
        </button>
      </div>
      <ErrorMessage code={error} />
      {notice && (
        <p role="status" className="sw-notice">
          {notice[lang]}
        </p>
      )}
      {copy && (
        <label>
          {t(
            "中文转发摘要（包含联系方式，请仅转发给参与该单的人员）",
            "Chinese summary (contains contact details; share only with people handling this order)",
          )}
          <textarea readOnly value={copy} rows={9} />
        </label>
      )}
      {!id ? (
        <>
          <div className="sw-row">
            <label>
              {t("状态筛选", "Filter status")}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">{t("全部", "All")}</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusNames[s][lang]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("搜索编号 / 姓名 / 团体", "Search reference / name / group")}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {orders.length === 0 && (
            <p>
              {t("暂无需求。", "No requests yet.")}{" "}
              <Link href="/sewing/request">
                {t("开始定制", "Start a request")}
              </Link>
            </p>
          )}
          <div className="sw-grid two">
            {orders
              .filter(
                (o) =>
                  (!filter || o.status === filter) &&
                  `${o.id} ${o.data.name} ${o.data.group}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((o) => (
                <article className="sw-card" key={o.id}>
                  <span className="sw-tag">{statusNames[o.status][lang]}</span>
                  <h2>
                    {names[o.data.product][lang]} × {o.data.quantity}
                  </h2>
                  <p>
                    {o.data.name} · {o.data.group}
                  </p>
                  <p>
                    {t("希望交期", "Preferred delivery")}: {o.data.date}
                  </p>
                  <small>
                    {o.id}
                    <br />
                    {date(o.created_at)}
                  </small>
                  <p>
                    <Link
                      href={
                        manage && user.role === "admin"
                          ? `/admin/sewing?order=${o.id}`
                          : manage
                            ? `/sewing/manage/${o.id}`
                            : `/sewing/orders/${o.id}`
                      }
                    >
                      {t("查看与跟进 →", "View & follow up →")}
                    </Link>
                  </p>
                  {manage && (
                    <button onClick={() => copySummary(o)}>
                      {t("复制中文需求摘要", "Copy Chinese summary")}
                    </button>
                  )}
                </article>
              ))}
          </div>
          {manage && user.role === "admin" && (
            <div className="sw-card">
              <h2>{t("跟进成员", "Follow-up members")}</h2>
              <p>
                {t(
                  "成员使用校内邮箱验证码登录，只能管理分配给自己的需求。再次保存同一邮箱可更新姓名与联系方式。",
                  "Members sign in with school email codes and manage assigned requests. Saving the same email updates their name and contact.",
                )}
              </p>
              {members.map((m) => (
                <p key={m.email}>
                  {m.name} · {m.email} · {m.contact}
                </p>
              ))}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await api("members", memberDraft);
                    setMemberDraft({ email: "", name: "", contact: "" });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {(["email", "name", "contact"] as const).map((k, i) => (
                  <label key={k}>
                    {
                      [
                        t("学校邮箱", "School email"),
                        t("姓名", "Name"),
                        t("客户可见联系方式", "Customer-visible contact"),
                      ][i]
                    }
                    <input
                      type={k === "email" ? "email" : "text"}
                      required={k !== "contact"}
                      value={memberDraft[k]}
                      onChange={(e) =>
                        setMemberDraft({ ...memberDraft, [k]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <button disabled={busy} className="sw-primary">
                  {t("保存成员", "Save member")}
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        order && (
          <>
            <p>
              <Link
                href={
                  manage
                    ? user.role === "admin"
                      ? "/admin/sewing"
                      : "/sewing/manage"
                    : "/sewing/orders"
                }
              >
                ← {t("返回列表", "Back to list")}
              </Link>
            </p>
            <div className="sw-card">
              <span className="sw-tag">
                {statusNames[order.status][lang]} ·{" "}
                {paymentNames[order.payment][lang]}
              </span>
              <h2>
                {names[order.data.product][lang]} × {order.data.quantity}
              </h2>
              <small>
                {order.id} · {date(order.created_at)}
              </small>
              <dl>
                <dt>{t("需求类型 / 团体", "Request type / group")}</dt>
                <dd>
                  {order.data.kind === "group"
                    ? order.data.group
                    : t("个人", "Individual")}
                </dd>
                <dt>
                  {t("姓名 / 学校邮箱 / 微信", "Name / school email / WeChat")}
                </dt>
                <dd>
                  {order.data.name} · {order.owner} · {order.data.wechat}
                </dd>
                <dt>
                  {t(
                    "希望交付日期（待确认）",
                    "Preferred delivery (to confirm)",
                  )}
                </dt>
                <dd>{order.data.date}</dd>
                <dt>{t("补充说明", "Notes")}</dt>
                <dd>{order.data.notes || "—"}</dd>
                <dt>
                  {t("跟进成员 / 联系方式", "Follow-up member / contact")}
                </dt>
                <dd>
                  {member
                    ? `${member.name} · ${member.contact || t("待确认", "To be confirmed")}`
                    : t("待分配", "To be assigned")}
                </dd>
              </dl>
              <Notice />
              {manager && (
                <>
                  <button onClick={() => copySummary(order)}>
                    {t("一键复制中文需求摘要", "Copy Chinese request summary")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => action({ action: "notify" })}
                  >
                    {t(
                      "发送 / 重试邮件通知",
                      "Send / retry email notification",
                    )}
                  </button>
                </>
              )}
            </div>
            <div className="sw-card">
              <h2>{t("原始图案与效果预览", "Original artwork & previews")}</h2>
              {files.length === 0 ? (
                <p>{t("未附加文件。", "No files attached.")}</p>
              ) : (
                <div className="sw-grid two">
                  {files.map((f) => (
                    <a
                      key={f.id}
                      href={`/api/sewing/files/${f.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={`/api/sewing/files/${f.id}`}
                        alt={f.name}
                        className="sw-file"
                      />
                      <span>
                        {f.purpose === "preview"
                          ? t(
                              "效果预览 · 非真实成品",
                              "Preview · not a product photo",
                            )
                          : t("原始文件", "Original file")}{" "}
                        · {f.name}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="sw-card">
              <h2>{t("报价历史（人民币）", "Quote history (CNY)")}</h2>
              {order.quotes.length === 0 && (
                <p>
                  {t(
                    "尚无报价，价格与交期待确认。",
                    "No quote yet. Price and timing to be confirmed.",
                  )}
                </p>
              )}
              {[...order.quotes].reverse().map((q, index) => (
                <article key={q.id} className="sw-quote">
                  <h3>
                    {t("报价版本", "Quote version")}{" "}
                    {order.quotes.length - index} · {date(q.at)}
                  </h3>
                  <div className="sw-table">
                    <table>
                      <thead>
                        <tr>
                          {[
                            t("项目", "Item"),
                            t("数量", "Quantity"),
                            t("单价", "Unit price"),
                            t("小计", "Subtotal"),
                          ].map((s) => (
                            <th key={s}>{s}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.items.map((i, n) => (
                          <tr key={n}>
                            <td>{i.label}</td>
                            <td>{i.quantity}</td>
                            <td>¥{i.unit.toFixed(2)}</td>
                            <td>¥{(i.unit * i.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    <strong>
                      {t("合计", "Total")}: ¥{q.total.toFixed(2)}
                    </strong>{" "}
                    · {t("预计交付", "Estimated delivery")}: {q.delivery}
                  </p>
                  <p>{q.notes}</p>
                  {order.confirmation?.quoteId === q.id && (
                    <p className="sw-notice">
                      {t("客户已明确确认", "Customer confirmed")} ·{" "}
                      {date(order.confirmation.at)} · {order.confirmation.by}
                    </p>
                  )}
                  {index === 0 &&
                    order.status === "quoted" &&
                    order.owner === user.email && (
                      <button
                        disabled={busy}
                        className="sw-primary"
                        onClick={() =>
                          action({ action: "confirm", quoteId: q.id })
                        }
                      >
                        {t(
                          "确认此版本报价、数量、金额及交期",
                          "Confirm this quote, quantity, total & delivery date",
                        )}
                      </button>
                    )}
                </article>
              ))}
              <p>
                {t(
                  "通过微信直接付给制作者。本站不在线收款，不要求上传付款凭证。",
                  "Pay the maker directly via WeChat. No online payments or payment-proof uploads.",
                )}
              </p>
            </div>
            <div className="sw-card">
              <h2>{t("进度与记录", "Progress & history")}</h2>
              {order.updates.map((u, i) => (
                <article className="sw-timeline" key={i}>
                  <small>
                    {date(u.at)} · {u.by}{" "}
                    {u.internal && t("· 内部记录", "· Internal")}
                  </small>
                  {u.status && <strong>{statusNames[u.status][lang]}</strong>}
                  <p>{u.text}</p>
                </article>
              ))}
            </div>
            {manager && (
              <div className="sw-card">
                <h2>{t("成员操作", "Member actions")}</h2>
                {user.role === "admin" && (
                  <label>
                    {t("分配跟进成员", "Assign member")}
                    <div className="sw-row">
                      <select
                        value={assigned}
                        onChange={(e) => setAssigned(e.target.value)}
                      >
                        <option value="">
                          {t("请选择成员", "Select a member")}
                        </option>
                        {members.map((m) => (
                          <option value={m.email} key={m.email}>
                            {m.name} · {m.email}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={busy || !assigned}
                        onClick={() =>
                          action({ action: "assign", email: assigned })
                        }
                      >
                        {t("保存分配", "Save assignment")}
                      </button>
                    </div>
                  </label>
                )}
                <h3>{t("添加新报价版本", "Add a quote version")}</h3>
                <p>
                  {t(
                    "修改报价会保留旧版本并要求客户重新确认。报价说明请使用客户能理解的语言。",
                    "Changes preserve previous versions and require fresh customer confirmation. Write quote notes in the customer’s preferred language.",
                  )}
                </p>
                {items.map((i, n) => (
                  <div key={n} className="sw-grid three">
                    <label>
                      {t("项目", "Item")}
                      <input
                        value={i.label}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === n ? { ...x, label: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      {t("数量", "Quantity")}
                      <input
                        type="number"
                        min="1"
                        value={i.quantity}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === n
                                ? { ...x, quantity: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      {t("单价 ¥", "Unit price ¥")}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={i.unit}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === n
                                ? { ...x, unit: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      disabled={items.length === 1}
                      onClick={() => setItems(items.filter((_, j) => j !== n))}
                    >
                      {t("移除此项", "Remove item")}
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setItems([...items, { label: "", quantity: 1, unit: 0 }])
                  }
                >
                  {t("添加明细", "Add item")}
                </button>
                <label>
                  {t("报价备注", "Quote notes")}
                  <textarea
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                  />
                </label>
                <label>
                  {t("预计交付日期", "Estimated delivery date")}
                  <input
                    type="date"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                  />
                </label>
                <p>
                  {t("合计", "Total")}: ¥
                  {(
                    items.reduce(
                      (s, i) => s + Math.round(i.quantity * i.unit * 100),
                      0,
                    ) / 100
                  ).toFixed(2)}
                </p>
                <button
                  disabled={busy}
                  className="sw-primary"
                  onClick={() =>
                    action({
                      action: "quote",
                      quote: { items, notes: quoteNote, delivery },
                    })
                  }
                >
                  {t("发布新报价版本", "Publish new quote version")}
                </button>
                <h3>
                  {t(
                    "更新进度 / 付款 / 备注",
                    "Update progress / payment / notes",
                  )}
                </h3>
                <label>
                  {t("状态（需遵循流程）", "Status (workflow enforced)")}
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {statusNames[s][lang]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("付款状态", "Payment status")}
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  >
                    {Object.entries(paymentNames).map(([key, v]) => (
                      <option value={key} key={key}>
                        {v[lang]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t(
                    "更新说明（状态改变时必填）",
                    "Update note (required for status changes)",
                  )}
                  <textarea
                    value={note}
                    maxLength={3000}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <label className="sw-check">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => setInternal(e.target.checked)}
                  />
                  {t(
                    "仅内部备注（不用于客户可见状态变更）",
                    "Internal note only (no customer-visible status change)",
                  )}
                </label>
                <button
                  disabled={busy}
                  onClick={() =>
                    action({
                      action: "update",
                      status,
                      payment,
                      text: note,
                      internal,
                    })
                  }
                >
                  {t("保存进度与记录", "Save progress & history")}
                </button>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
