export type Lang = "zh" | "en";
export type Text = { zh: string; en: string };
export const productTypes = ["hoodie", "zip", "tshirt", "jersey"] as const;
export type Garment = (typeof productTypes)[number];
export const names: Record<Garment, Text> = {
  hoodie: { zh: "套头连帽卫衣", en: "Pullover hoodie" },
  zip: { zh: "拉链连帽卫衣", en: "Zip hoodie" },
  tshirt: { zh: "T-shirt", en: "T-shirt" },
  jersey: { zh: "Jersey 球衣", en: "Jersey" },
};
export const statuses = [
  "submitted",
  "communicating",
  "quoted",
  "confirmed",
  "production",
  "delivery",
  "completed",
  "declined",
  "cancelled",
] as const;
export type Status = (typeof statuses)[number];
export const statusNames: Record<Status, Text> = {
  submitted: { zh: "需求已提交", en: "Submitted" },
  communicating: { zh: "沟通中", en: "In discussion" },
  quoted: { zh: "待确认报价", en: "Quote awaiting confirmation" },
  confirmed: { zh: "已确认", en: "Confirmed" },
  production: { zh: "生产中", en: "In production" },
  delivery: { zh: "待交付", en: "Ready for delivery" },
  completed: { zh: "已完成", en: "Completed" },
  declined: { zh: "无法承接", en: "Unable to accept" },
  cancelled: { zh: "已取消", en: "Cancelled" },
};
export const paymentNames = {
  unpaid: { zh: "未付", en: "Unpaid" },
  deposit: { zh: "订金已付", en: "Deposit paid" },
  paid: { zh: "已付清", en: "Paid in full" },
};
export type Product = {
  id: Garment;
  description: Text;
  price: Text;
  lead: Text;
  fabric: Text;
  moq: number | null;
  colors: string[];
  photos: string[];
};
export type Gallery = {
  id: string;
  title: Text;
  caption: Text;
  kind: "work" | "team" | "design" | "finished";
  photo: string;
};
export type Content = {
  story: Text;
  wechat: string;
  teams: string;
  products: Product[];
  gallery: Gallery[];
  faq: { question: Text; answer: Text }[];
};
export const defaultContent: Content = {
  story: {
    zh: "以手艺连接校园与社区。常熟爱心缝纫队与 Island to Infinity 合作，让校内真实的服装需求与制作者的专业劳动相遇。每一次合作，都从认真了解需求开始。",
    en: "Connecting campus and community through craft. Changshu Sewing Team and Island to Infinity bring real clothing needs together with skilled work. Every collaboration starts with listening.",
  },
  wechat: "elaine_10x / jasmine",
  teams: "Yiling(Elaine) Xie / Jasmine Angela Pangilinan",
  products: productTypes.map((id) => ({
    id,
    description: {
      zh: "支持个人小单与团体定制，具体款式与工艺经沟通确认。",
      en: "Individual and group customization. Styles and techniques are confirmed together.",
    },
    price: { zh: "", en: "" },
    lead: { zh: "", en: "" },
    fabric: { zh: "", en: "" },
    moq: null,
    colors: [],
    photos: [],
  })),
  gallery: [],
  faq: [
    {
      question: {
        zh: "可以只做一两件吗？",
        en: "Can I order just one or two?",
      },
      answer: {
        zh: "可以咨询一两件的个人小单。具体款式、价格与交期需人工确认。",
        en: "Yes, individual requests for one or two pieces are welcome. Style, pricing and timing require confirmation.",
      },
    },
    {
      question: {
        zh: "没有设计稿也可以提交吗？",
        en: "Can I submit without a design?",
      },
      answer: {
        zh: "可以。描述想法即可，模板预览是选填工具。",
        en: "Yes. Describe your idea; the preview tool is optional.",
      },
    },
    {
      question: { zh: "如何付款？", en: "How do I pay?" },
      answer: {
        zh: "确认后通过微信直接付给制作者。网站仅记录付款状态，不在线收款。",
        en: "After confirmation, pay the maker directly via WeChat. This site only records payment status.",
      },
    },
  ],
};
export type RequestData = {
  kind: "personal" | "group";
  product: Garment;
  quantity: number;
  date: string;
  name: string;
  wechat: string;
  group: string;
  notes: string;
  fileIds: string[];
};
export type Quote = {
  id: string;
  at: string;
  by: string;
  items: { label: string; quantity: number; unit: number }[];
  total: number;
  notes: string;
  delivery: string;
};
export type Update = {
  at: string;
  by: string;
  text: string;
  internal: boolean;
  status?: Status;
};
export type Order = {
  id: string;
  owner: string;
  assigned: string | null;
  status: Status;
  payment: keyof typeof paymentNames;
  data: RequestData;
  quotes: Quote[];
  updates: Update[];
  confirmation: { quoteId: string; at: string; by: string } | null;
  version: number;
  created_at: string;
};
export type Identity = { email: string; role: "customer" | "member" | "admin" };
export type Member = { email: string; name: string; contact: string };
export type FileRecord = {
  id: string;
  name: string;
  mime: string;
  purpose: "original" | "preview" | "public";
};
