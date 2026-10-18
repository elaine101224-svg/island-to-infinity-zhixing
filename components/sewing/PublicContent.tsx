"use client";
import Link from "next/link";
import Garment from "./Garment";
import { Notice, useSewing } from "./shared";
import { names, type Content, type Gallery } from "@/lib/sewing/types";
export default function PublicContent({
  content,
  view = "home",
}: {
  content: Content;
  view?: string;
}) {
  const { t, lang } = useSewing();
  const unknown = t("待确认", "To be confirmed");
  const show = (name: string) => view === "home" || view === name;
  function gallery(items: Gallery[]) {
    return items.length ? (
      <div className="sw-grid two">
        {items.map((g) => (
          <figure key={g.id}>
            <img
              src={`/api/sewing-photo/${g.photo}`}
              alt={g.title[lang]}
              loading="lazy"
            />
            <figcaption>
              <span className="sw-tag">
                {g.kind === "design"
                  ? t("设计稿 / 效果预览", "Design / preview")
                  : g.kind === "team"
                    ? t("团队工作照片", "Team at work")
                    : t("真实作品照片", "Actual work photo")}
              </span>
              <h3>{g.title[lang]}</h3>
              <p>{g.caption[lang]}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    ) : (
      <div className="sw-placeholder">
        <span>＋</span>
        <p>
          {t(
            "真实照片与经确认的合作资料待补充",
            "Real photos & verified collaboration details to come",
          )}
        </p>
      </div>
    );
  }
  return (
    <>
      {view === "home" && (
        <section className="sw-hero">
          <div>
            <p className="sw-eyebrow">
              {t("手艺 · 校园 · 社区", "Craft · Campus · Community")}
            </p>
            <h1>
              {t("把共同的想法，", "Shared ideas,")}
              <br />
              <em>{t("一针一线做出来。", "stitched together.")}</em>
            </h1>
            <p>
              {t(
                "常熟爱心缝纫队 × Island to Infinity",
                "Changshu Sewing Team × Island to Infinity",
              )}
            </p>
            <p className="sw-lead">
              {t(
                "从一件属于自己的衣服，到一个 House 的共同记忆。连接 UWC 常熟校园的真实需求与社区制作者的手艺，让专业劳动得到尊重与回报。",
                "From a piece that feels like you to a shared House memory. Connecting UWC Changshu’s clothing needs with community makers, honoring their craft and paid work.",
              )}
            </p>
            <div className="sw-row">
              <Link className="sw-button sw-primary" href="/sewing/request">
                {t("开始定制 ↗", "Start a request ↗")}
              </Link>
              <Link className="sw-button" href="/sewing/products">
                {t("浏览产品", "Explore garments")}
              </Link>
              <Link href="/sewing/wechat">
                {t("微信咨询 →", "WeChat consultation →")}
              </Link>
            </div>
            <small>
              {t(
                "个人一两件 · House · 知行 · 社团 · 活动",
                "One or two pieces · House · Zhixing · Clubs · Events",
              )}
            </small>
          </div>
          <div className="sw-hero-art">
            {content.gallery.find((g) => g.kind === "team") ? (
              <img
                src={`/api/sewing-photo/${content.gallery.find((g) => g.kind === "team")!.photo}`}
                alt={t("缝纫队工作照片", "Sewing team at work")}
              />
            ) : (
              <>
                <div className="sw-stitch-ring">
                  <svg viewBox="0 0 500 500" aria-hidden="true">
                    <Garment kind="hoodie" color="#9aa897" side="front" />
                  </svg>
                </div>
                <span className="sw-tag">
                  {t(
                    "服装模板示意 · 团队真实照片待补充",
                    "Garment illustration · real team photos to come",
                  )}
                </span>
              </>
            )}
          </div>
        </section>
      )}
      {show("products") && (
        <section id="products">
          <p className="sw-eyebrow">
            {t("穿得久，也记得住", "Made to wear. Made to remember.")}
          </p>
          <h2>{t("找到适合你的款式", "Find your starting point")}</h2>
          <p>
            {t(
              "支持个人与团体咨询。所有参考价格、面料与交期均需最终确认。",
              "Individual and group inquiries welcome. Reference prices, fabrics and timing require final confirmation.",
            )}
          </p>
          <div className="sw-grid four">
            {content.products.map((p) => (
              <article className="sw-product" key={p.id}>
                {p.photos.length ? (
                  <div className="sw-product-photos">
                    {p.photos.map((photo) => (
                      <img
                        key={photo}
                        src={`/api/sewing-photo/${photo}`}
                        alt={names[p.id][lang]}
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="sw-product-art">
                    <svg viewBox="0 0 500 500" aria-hidden="true">
                      <Garment
                        kind={p.id}
                        color={
                          p.id === "hoodie"
                            ? "#a3ad9a"
                            : p.id === "zip"
                              ? "#cebba6"
                              : p.id === "tshirt"
                                ? "#e4d8c5"
                                : "#b0bbc3"
                        }
                        side="front"
                      />
                    </svg>
                    <small>
                      {t(
                        "模板示意 · 非成品照片",
                        "Template · not a product photo",
                      )}
                    </small>
                  </div>
                )}
                <h3>{names[p.id][lang]}</h3>
                <p>{p.description[lang]}</p>
                <dl>
                  <dt>{t("参考价格", "Reference price")}</dt>
                  <dd>{p.price[lang] || unknown}</dd>
                  <dt>{t("起订量", "Minimum quantity")}</dt>
                  <dd>{p.moq ?? unknown}</dd>
                  <dt>{t("制作时间", "Production time")}</dt>
                  <dd>{p.lead[lang] || unknown}</dd>
                  <dt>{t("面料与工艺", "Fabric & technique")}</dt>
                  <dd>{p.fabric[lang] || unknown}</dd>
                </dl>
                <div className="sw-swatches">
                  {p.colors.map((c) => (
                    <span key={c} style={{ background: c }} title={c} />
                  ))}
                </div>
                <Link href="/sewing/preview">
                  {t("试试模板预览 →", "Try the preview studio →")}
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
      {show("collaborations") && (
        <section id="collaborations">
          <p className="sw-eyebrow">
            {t("从设计到日常", "From design to everyday life")}
          </p>
          <h2>{t("作品与以往合作", "Work & collaborations")}</h2>
          <p>
            {t(
              "在这里并排展示设计稿与真实成品，记录每一次制作的细节。经核实的合作记录与 Ohana hoodie 素材待提供后发布。",
              "A place for side-by-side designs and finished garments, with details of the making process. Verified collaboration records and Ohana hoodie materials await publication.",
            )}
          </p>
          {gallery(content.gallery.filter((g) => g.kind !== "team"))}
        </section>
      )}
      {show("story") && (
        <section id="story" className="sw-story">
          <div>
            <p className="sw-eyebrow">
              {t("认识衣服背后的手艺", "Meet the craft behind the clothes")}
            </p>
            <h2>
              {t(
                "一起工作，彼此连接。",
                "Working together. Growing connections.",
              )}
            </h2>
            <p className="sw-lead">{content.story[lang]}</p>
            <p>
              {t(
                "妈妈通过微信提供产品资料，由 Island to Infinity 成员维护网站。制作者主要与客户沟通，每单跟进成员负责把确认的信息同步到这里。",
                "Makers provide product details through WeChat, while Island to Infinity members maintain the site. Makers lead customer communication, and a follow-up member keeps each order’s confirmed details updated here.",
              )}
            </p>
          </div>
          {gallery(content.gallery.filter((g) => g.kind === "team"))}
        </section>
      )}
      {show("faq") && (
        <section id="faq">
          <p className="sw-eyebrow">
            {t(
              "慢慢沟通，认真制作",
              "Thoughtful conversations. Careful making.",
            )}
          </p>
          <h2>{t("定制如何进行", "How it works")}</h2>
          <ol className="sw-steps">
            {[
              [
                t("提交想法", "Share your idea"),
                t(
                  "验证校内邮箱，提交个人或团体需求。无设计稿也可以。",
                  "Verify your school email and share your individual or group request. Artwork is optional.",
                ),
              ],
              [
                t("沟通与报价", "Discuss & quote"),
                t(
                  "成员跟进，制作者沟通款式、面料、数量、价格与交期。",
                  "Your follow-up member and maker discuss style, fabric, quantity, pricing and timing.",
                ),
              ],
              [
                t("明确确认", "Confirm together"),
                t(
                  "查看报价版本，确认明细与交期后才成为正式订单。",
                  "Review and explicitly confirm a quote and delivery date to create a formal order.",
                ),
              ],
              [
                t("制作与交付", "Make & deliver"),
                t(
                  "在个人订单中心查看进度，通过微信直接向制作者付款。",
                  "Track progress in your order center and pay the maker directly via WeChat.",
                ),
              ],
            ].map(([title, text], i) => (
              <li key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <Notice />
          {content.faq.map((f, i) => (
            <details key={i}>
              <summary>{f.question[lang]}</summary>
              <p>{f.answer[lang]}</p>
            </details>
          ))}
        </section>
      )}
      {show("wechat") && (
        <section id="wechat" className="sw-contact">
          <p className="sw-eyebrow">
            {t("先聊聊，也很好", "A conversation is a good beginning")}
          </p>
          <h2>{t("联系与咨询", "Contact & consultation")}</h2>
          <p>
            <strong>{t("微信", "WeChat")}</strong>
          </p>
          <p>
            {content.wechat ||
              t(
                "微信联系方式待确认。暂不展示未经确认的个人联系方式。",
                "WeChat contact to be confirmed. Unverified personal details are not displayed.",
              )}
          </p>
          {content.teams && (
            <p>
              <strong>Teams</strong>
              <br />
              {content.teams}
            </p>
          )}
          <Link className="sw-button sw-primary" href="/sewing/request">
            {t("或提交定制需求 →", "Or submit a request →")}
          </Link>
        </section>
      )}
    </>
  );
}
