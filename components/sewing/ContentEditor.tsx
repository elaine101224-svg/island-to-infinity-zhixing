"use client";
import { useState } from "react";
import { api, ErrorMessage, upload, useSewing } from "./shared";
import {
  names,
  type Content,
  type Gallery,
  type Text,
} from "@/lib/sewing/types";
function Bilingual({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Text;
  onChange: (value: Text) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      {(["zh", "en"] as const).map((lang) => (
        <label key={lang}>
          {lang === "zh" ? "中文" : "English"}
          <textarea
            value={value[lang]}
            maxLength={5000}
            onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
          />
        </label>
      ))}
    </fieldset>
  );
}
export default function ContentEditor({ initial }: { initial: Content }) {
  const { t, lang } = useSewing();
  const [content, setContent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  function update(next: Content) {
    setContent(next);
    setSaved(false);
  }
  async function photo(file: File | undefined, product?: number) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const f = await upload(file, file.name, "public");
      setContent((c) =>
        product !== undefined
          ? {
              ...c,
              products: c.products.map((p, i) =>
                i === product ? { ...p, photos: [...p.photos, f.id] } : p,
              ),
            }
          : {
              ...c,
              gallery: [
                ...c.gallery,
                {
                  id: crypto.randomUUID(),
                  title: { zh: "", en: "" },
                  caption: { zh: "", en: "" },
                  kind: "work",
                  photo: f.id,
                },
              ],
            },
      );
      setSaved(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function gallery(i: number, patch: Partial<Gallery>) {
    update({
      ...content,
      gallery: content.gallery.map((g, n) =>
        i === n ? { ...g, ...patch } : g,
      ),
    });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await api("content", content);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h1>{t("公开内容管理", "Public content management")}</h1>
      <p className="sw-notice">
        {t(
          "只上传已获同意公开的照片。请勿包含儿童或家庭敏感信息。效果图请标记为“设计稿 / 效果预览”，真实成品请选择“真实成品”。留空的信息会显示待确认。",
          "Only upload photos approved for publication. Exclude sensitive child or family information. Label mockups as designs/previews, and real products as finished work. Empty details display as to be confirmed.",
        )}
      </p>
      <Bilingual
        label={t("团队介绍与合作故事", "Team introduction & collaboration")}
        value={content.story}
        onChange={(story) => update({ ...content, story })}
      />
      <label>
        {t("微信联系方式（客户可公开访问）", "WeChat contact (public)")}
        <input
          value={content.wechat}
          maxLength={200}
          onChange={(e) => update({ ...content, wechat: e.target.value })}
        />
      </label>
      <label>
        {t(
          "Teams 联系人（公开显示名称）",
          "Teams contacts (public display names)",
        )}
        <input
          value={content.teams}
          maxLength={300}
          onChange={(e) => update({ ...content, teams: e.target.value })}
        />
      </label>
      <h2>{t("产品资料", "Product information")}</h2>
      {content.products.map((p, i) => (
        <div className="sw-card" key={p.id}>
          <h3>{names[p.id][lang]}</h3>
          {(["description", "price", "lead", "fabric"] as const).map(
            (key, n) => (
              <Bilingual
                key={key}
                label={
                  [
                    t("款式说明", "Description"),
                    t(
                      "参考价格区间（非最终报价）",
                      "Reference price range (not a final quote)",
                    ),
                    t("预计制作时间", "Estimated production time"),
                    t("面料与工艺", "Fabric & techniques"),
                  ][n]
                }
                value={p[key]}
                onChange={(value) =>
                  update({
                    ...content,
                    products: content.products.map((x, j) =>
                      j === i ? { ...x, [key]: value } : x,
                    ),
                  })
                }
              />
            ),
          )}
          <label>
            {t(
              "起订量（未知请留空）",
              "Minimum quantity (leave blank if unknown)",
            )}
            <input
              type="number"
              min="1"
              value={p.moq ?? ""}
              onChange={(e) =>
                update({
                  ...content,
                  products: content.products.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          moq: e.target.value ? Number(e.target.value) : null,
                        }
                      : x,
                  ),
                })
              }
            />
          </label>
          <label>
            {t(
              "实际色卡（HEX，以逗号分隔）",
              "Actual swatches (comma-separated HEX)",
            )}
            <input
              defaultValue={p.colors.join(", ")}
              onBlur={(e) =>
                update({
                  ...content,
                  products: content.products.map((x, j) =>
                    j === i
                      ? {
                          ...x,
                          colors: e.target.value
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean),
                        }
                      : x,
                  ),
                })
              }
            />
          </label>
          <div className="sw-grid three">
            {p.photos.map((id, n) => (
              <div key={id}>
                <img
                  className="sw-file"
                  src={`/api/sewing-photo/${id}`}
                  alt={names[p.id][lang]}
                />
                <button
                  disabled={n === 0}
                  onClick={() => {
                    const photos = [...p.photos];
                    [photos[n - 1], photos[n]] = [photos[n], photos[n - 1]];
                    update({
                      ...content,
                      products: content.products.map((x, j) =>
                        j === i ? { ...x, photos } : x,
                      ),
                    });
                  }}
                >
                  {t("前移", "Move earlier")}
                </button>
                <button
                  onClick={() =>
                    update({
                      ...content,
                      products: content.products.map((x, j) =>
                        j === i
                          ? { ...x, photos: x.photos.filter((f) => f !== id) }
                          : x,
                      ),
                    })
                  }
                >
                  {t("移除", "Remove")}
                </button>
                <label>
                  {t("替换照片", "Replace photo")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setBusy(true);
                      try {
                        const uploaded = await upload(f, f.name, "public");
                        setContent((c) => ({
                          ...c,
                          products: c.products.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  photos: x.photos.map((v, k) =>
                                    k === n ? uploaded.id : v,
                                  ),
                                }
                              : x,
                          ),
                        }));
                        setSaved(false);
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
          <label>
            {t("上传产品真实照片", "Upload real product photo")}
            <input
              disabled={busy}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => photo(e.target.files?.[0], i)}
            />
          </label>
        </div>
      ))}
      <h2>
        {t(
          "作品、设计稿与团队照片（按列表顺序展示）",
          "Work, designs & team photos (displayed in list order)",
        )}
      </h2>
      {content.gallery.map((g, i) => (
        <div className="sw-card" key={g.id}>
          <img
            className="sw-file"
            src={`/api/sewing-photo/${g.photo}`}
            alt={g.title[lang]}
          />
          <label>
            {t("图片类型", "Image category")}
            <select
              value={g.kind}
              onChange={(e) =>
                gallery(i, { kind: e.target.value as Gallery["kind"] })
              }
            >
              <option value="work">{t("合作作品", "Collaboration")}</option>
              <option value="team">{t("团队工作照片", "Team at work")}</option>
              <option value="design">
                {t("设计稿 / 效果预览", "Design / preview")}
              </option>
              <option value="finished">
                {t("真实成品", "Actual finished product")}
              </option>
            </select>
          </label>
          <Bilingual
            label={t(
              "标题（如已核实的合作名称）",
              "Title (verified collaboration name)",
            )}
            value={g.title}
            onChange={(title) => gallery(i, { title })}
          />
          <Bilingual
            label={t("说明", "Caption")}
            value={g.caption}
            onChange={(caption) => gallery(i, { caption })}
          />
          <button
            disabled={i === 0}
            onClick={() => {
              const list = [...content.gallery];
              [list[i - 1], list[i]] = [list[i], list[i - 1]];
              update({ ...content, gallery: list });
            }}
          >
            {t("前移", "Move earlier")}
          </button>
          <button
            onClick={() =>
              update({
                ...content,
                gallery: content.gallery.filter((_, n) => n !== i),
              })
            }
          >
            {t("移除", "Remove")}
          </button>
          <label>
            {t("替换照片", "Replace photo")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                try {
                  const result = await upload(f, f.name, "public");
                  gallery(i, { photo: result.id });
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        </div>
      ))}
      <label>
        {t("添加照片（≤5 MB）", "Add photo (≤5 MB)")}
        <input
          disabled={busy}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => photo(e.target.files?.[0])}
        />
      </label>
      <h2>FAQ</h2>
      {content.faq.map((f, i) => (
        <div className="sw-card" key={i}>
          <Bilingual
            label={t("问题", "Question")}
            value={f.question}
            onChange={(question) =>
              update({
                ...content,
                faq: content.faq.map((x, j) =>
                  j === i ? { ...x, question } : x,
                ),
              })
            }
          />
          <Bilingual
            label={t("回答", "Answer")}
            value={f.answer}
            onChange={(answer) =>
              update({
                ...content,
                faq: content.faq.map((x, j) =>
                  j === i ? { ...x, answer } : x,
                ),
              })
            }
          />
          <button
            onClick={() =>
              update({ ...content, faq: content.faq.filter((_, n) => n !== i) })
            }
          >
            {t("移除", "Remove")}
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          update({
            ...content,
            faq: [
              ...content.faq,
              { question: { zh: "", en: "" }, answer: { zh: "", en: "" } },
            ],
          })
        }
      >
        {t("添加常见问题", "Add FAQ")}
      </button>
      <div className="sw-save">
        <button disabled={busy} className="sw-primary" onClick={save}>
          {busy
            ? t("正在保存…", "Saving…")
            : t("保存并发布全部内容", "Save & publish all content")}
        </button>
        {saved && <span role="status">{t("已保存", "Saved")}</span>}
        <ErrorMessage code={error} />
      </div>
    </section>
  );
}
