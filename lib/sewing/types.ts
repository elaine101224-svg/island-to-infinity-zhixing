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
    zh: "常熟爱心缝纫队与 Island to Infinity 合作，将校园定制需求与社区制作者连接起来。团队为因照顾孩子而难以全职工作的女性提供灵活的兼职机会。我们希望通过持续、真实的订单建立长期互惠的合作，尊重制作者的专业劳动。",
    en: "Changshu Sewing Team and Island to Infinity connect campus customization needs with skilled local makers. The team offers flexible, part-time work for women whose childcare responsibilities make full-time work difficult. We hope to build a lasting, mutually beneficial partnership through genuine, ongoing orders.",
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
    lead: {
      zh: "参考约20天：设计确定后打样约1周，确认样衣后批量制作约10天；具体交期需沟通确认。",
      en: "Allow around 20 days overall: about one week for sampling once the design is agreed, then about 10 days for production after sample approval. Confirm the delivery date with the maker.",
    },
    fabric: { zh: "", en: "" },
    moq: null,
    colors: [],
    photos: [],
  })),
  gallery: [],
  faq: [
    {
      question: { zh: "需要提前多久确认设计？", en: "How far ahead should I confirm my design?" },
      answer: {
        zh: "设计需求确定后，制作样衣通常约1周；确认样衣后再批量制作，大约需要10天。整体建议预留20天左右，包含打样、确认与制作。这些是参考时间，具体交期以与制作者沟通确认为准。",
        en: "Once the design is agreed, sampling usually takes about one week. Batch production starts after sample approval and takes around 10 days. Allow around 20 days overall for sampling, confirmation and production. These are estimates; agree the actual delivery date with the maker.",
      },
    },
    {
      question: { zh: "打样包含什么？已有样板可以再做吗？", en: "What does sampling include? Can I reuse existing patterns?" },
      answer: {
        zh: "打样包括服装尺码版和印花图案样板，这一阶段通常约1周。尺码版、图案样板和样衣确认后再进入批量制作。已有确认的尺码版和图案样板时，可主要按制作所需时间沟通复单工期，仍需重新确认排期。",
        en: "Sampling includes the garment size pattern and print artwork sample, usually taking about one week. Approve the size pattern, print sample and sample garment before batch production. If approved patterns and artwork samples already exist, a repeat order can focus on production time; confirm the schedule again with the maker.",
      },
    },
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
        zh: "可以。描述想法即可，也可以上传你希望使用的原始图案，与制作者沟通确认。",
        en: "Yes. Describe your idea or upload original artwork, then confirm the details with the maker.",
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
  work?: unknown;
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
