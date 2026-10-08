import type { TrainingData } from "./training";
import base from "./base-data.json";
export const TODAY = "2026-10-02";
export const STORAGE_KEY = "sasawat-operations-v2";
export type Role =
  "พนักงานขาย" | "พนักงานคลัง" | "ผู้ดูแลห้องเย็น" | "ผู้จัดการ";
export type OrderStatus =
  | "รอยืนยัน"
  | "กำลังจัดสินค้า"
  | "พร้อมส่ง"
  | "กำลังจัดส่ง"
  | "เสร็จสิ้น"
  | "ยกเลิก";
export type Channel = "LINE" | "โทรศัพท์" | "หน้าร้าน" | "ออนไลน์";
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  min: number;
  barcode: string;
  supplier: string;
  unit: string;
  sku: string;
};
export type Lot = {
  id: string;
  pid: string;
  code: string;
  qty: number;
  received: string;
  expiry: string;
  room: string;
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  type: string;
  area: string;
  channel: string;
  joined: string;
  points: number;
  referrer: string;
  special: number;
  line?: string;
  notes?: string;
};
export type Item = { pid: string; qty: number; price: number };
export type Allocation = { lot: string; qty: number; pid: string };
export type Order = {
  id: string;
  cid: string;
  channel: Channel;
  date: string;
  time: string;
  employee: string;
  items: Item[];
  discount: number;
  status: OrderStatus;
  accurate: boolean;
  pickedLots?: string[];
  receipt?: { number: string; issued: string; method: string; reference: string; cashier: string; amount: number };
  address: string;
  note: string;
  allocations: Allocation[];
  earned: number;
  reserved: boolean;
  timeline: { status: string; time: string }[];
};
export type Incident = {
  id: string;
  room: string;
  detected: string;
  notified: string;
  temp: number;
  status: "เปิด" | "รับทราบแล้ว" | "ปิด";
  note: string;
  acknowledged?: string;
  assigned?: string;
  closed?: string;
};
export type Room = {
  id: string;
  name: string;
  category: string;
  temp: number;
  min: number;
  max: number;
  history: number[];
  updated: string;
  sensor: boolean;
};
export type Campaign = {
  id: string;
  name: string;
  segment: string;
  discount: number;
  text: string;
  status: string;
  recipients: string[];
  category?: string;
  channel: string;
  start: string;
  end: string;
  customerId?: string;
};
export type State = {
  products: Product[];
  lots: Lot[];
  customers: Customer[];
  orders: Order[];
  rooms: Room[];
  incidents: Incident[];
  waste: {
    id: string;
    date: string;
    pid: string;
    lot?: string;
    qty: number;
    value: number;
    reason: string;
    incident: string;
  }[];
  counts: {
    id: string;
    date: string;
    lot: string;
    expected: number;
    actual: number;
    reason?: string;
  }[];
  movements: {
    id: string;
    date: string;
    lot: string;
    qty: number;
    kind: string;
    reason: string;
  }[];
  contacts: {
    id: string;
    cid: string;
    date: string;
    channel: string;
    text: string;
    kind: string;
    resolved: boolean;
  }[];
  campaigns: Campaign[];
  messages: {
    id: string;
    cid: string;
    campaign: string;
    date: string;
    channel: string;
    text: string;
  }[];
  deliveries: {
    id: string;
    oid: string;
    carrier: string;
    driver: string;
    tracking: string;
    status: string;
    address: string;
    eta: string;
    log: string[];
  }[];
  suppliers: { id: string; name: string; phone: string; lead: number }[];
  purchases: {
    id: string;
    date: string;
    pid: string;
    sid: string;
    qty: number;
    cost: number;
    eta: string;
    status: string;
  }[];
  lineMessages?: {id:string;key:string;cid:string;text:string;source:string;route:string;time:string;sender:string;direction?:"customer"|"store";receipt?:string}[];
  trainingData?: TrainingData;
  users: {
    id: string;
    name: string;
    role: string;
    active: boolean;
    last: string;
    training: string[];
  }[];
  logs: { id: string; date: string; text: string; user: string }[];
  settings: {
    picking: "FEFO" | "FIFO";
    inactiveDays: number;
    regularOrders: number;
    newOrders: number;
    loyaltyRate: number;
    referralPoints: number;
    connections: { LINE: boolean; IoT: boolean; Delivery: boolean };
  };
  kpi: {
    baselineWaste: number;
    baselineRetention: number;
    baselineDigital: number;
    totalCaptured: number;
    uptime: number;
    totalTime: number;
  };
  surveys: {
    id: string;
    cid: string;
    score: number;
    date: string;
    note: string;
  }[];
  readAlerts: string[];
};
export const uid = (prefix: string) =>
  prefix +
  "-" +
  Date.now().toString(36) +
  "-" +
  Math.random().toString(36).slice(2, 6);
export const money = (v: number) =>
  v.toLocaleString("th-TH", { maximumFractionDigits: 2 });
export const days = (d: string) =>
  Math.floor(
    (Date.parse(TODAY + "T12:00:00") -
      Date.parse(d.slice(0, 10) + "T12:00:00")) /
      86400000,
  );
export const date = (d: string) =>
  new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  }) +
  " " +
  d.slice(0, 4);
export const relative = (d: string) =>
  days(d) === 0
    ? "วันนี้"
    : days(d) === 1
      ? "เมื่อวาน"
      : days(d) < 0
        ? "อีก " + -days(d) + " วัน"
        : days(d) + " วันที่แล้ว";
export const expiryText = (d: string) =>
  d < TODAY
    ? "หมดอายุแล้ว"
    : d === TODAY
      ? "หมดอายุวันนี้"
      : "อีก " + -days(d) + " วัน";
export const product = (s: State, p: string) =>
  s.products.find((x) => x.id === p)!;
export const customer = (s: State, c: string) =>
  s.customers.find((x) => x.id === c)!;
export const stock = (s: State, p: string) =>
  s.lots
    .filter((l) => l.pid === p && l.expiry >= TODAY)
    .reduce((a, l) => a + l.qty, 0);
export const sum = (o: Pick<Order, "items" | "discount">) =>
  o.items.reduce((a, i) => a + i.qty * i.price, 0) * (1 - o.discount / 100);
export const ordersFor = (s: State, c: string) =>
  s.orders.filter(
    (o) => o.cid === c && o.status !== "ยกเลิก" && o.status !== "รอยืนยัน",
  );
export const lastOrder = (s: State, c: string) =>
  ordersFor(s, c)
    .map((o) => o.date)
    .sort()
    .at(-1) || customer(s, c).joined;
export function group(s: State, c: Customer) {
  if (!ordersFor(s, c.id).length) return "ลูกค้าใหม่";
  if (days(lastOrder(s, c.id)) > s.settings.inactiveDays)
    return "ไม่ได้ซื้อนาน";
  const recent = ordersFor(s, c.id).filter((o) => days(o.date) <= 90);
  if (recent.length >= s.settings.regularOrders) return "ลูกค้าประจำ";
  if (ordersFor(s, c.id).length <= s.settings.newOrders) return "ลูกค้าใหม่";
  return "ลูกค้าซื้อซ้ำ";
}
export function favorites(s: State, c: string) {
  const totals: Record<string, { count: number; qty: number }> = {};
  ordersFor(s, c).forEach((o) =>
    o.items.forEach((i) => {
      totals[i.pid] ??= { count: 0, qty: 0 };
      totals[i.pid].count++;
      totals[i.pid].qty += i.qty;
    }),
  );
  return Object.entries(totals)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([pid, v]) => ({ product: product(s, pid), ...v }));
}
export function favoriteCategory(s: State, c: string) {
  const values: Record<string, number> = {};
  ordersFor(s, c).forEach((o) =>
    o.items.forEach((i) => {
      const cat = product(s, i.pid).category;
      values[cat] = (values[cat] || 0) + i.qty * i.price;
    }),
  );
  const sorted = Object.entries(values).sort((a, b) => b[1] - a[1]);
  return sorted.length &&
    sorted[0][1] / Object.values(values).reduce((a, b) => a + b, 0) >= 0.5
    ? sorted[0][0]
    : "";
}
export function suggestedLots(s: State, pid: string) {
  return s.lots
    .filter((l) => l.pid === pid && l.qty > 0 && l.expiry >= TODAY)
    .sort((a, b) =>
      s.settings.picking === "FIFO"
        ? a.received.localeCompare(b.received)
        : a.expiry.localeCompare(b.expiry),
    );
}
export function allocate(s: State, items: Pick<Item, "pid" | "qty">[]) {
  if (!items.length) throw Error("เลือกสินค้าอย่างน้อย 1 รายการ");
  const demand: Record<string, number> = {};
  for (const i of items) {
    if (
      !product(s, i.pid) ||
      !Number.isFinite(i.qty) ||
      i.qty <= 0 ||
      Math.abs(i.qty * 100 - Math.round(i.qty * 100)) > 1e-6
    )
      throw Error("จำนวนต้องมากกว่า 0 และไม่เกิน 2 ตำแหน่งทศนิยม");
    demand[i.pid] = (demand[i.pid] || 0) + i.qty;
  }
  for (const [pid, q] of Object.entries(demand))
    if (q > stock(s, pid) + 1e-8)
      throw Error(
        product(s, pid).name +
          ": ต้องการ " +
          money(q) +
          " " +
          product(s, pid).unit +
          " · เหลือ " +
          money(stock(s, pid)),
      );
  const allocations: Allocation[] = [];
  for (const [pid, q] of Object.entries(demand)) {
    let left = q;
    for (const l of suggestedLots(s, pid)) {
      if (left < 1e-8) break;
      const take = Math.min(left, l.qty);
      allocations.push({ lot: l.id, pid, qty: take });
      left -= take;
    }
  }
  return allocations;
}
export function createOrder(
  s: State,
  f: {
    cid: string;
    channel: Channel;
    discount: number;
    address: string;
    note: string;
    items: Pick<Item, "pid" | "qty">[];
    employee: string;
    pending?: boolean;
  },
) {
  if (!customer(s, f.cid)) throw Error("เลือกลูกค้าก่อน");
  if (!["LINE", "โทรศัพท์", "หน้าร้าน", "ออนไลน์"].includes(f.channel))
    throw Error("เลือกช่องทางคำสั่งซื้อ");
  if (!Number.isFinite(f.discount) || f.discount < 0 || f.discount > 100)
    throw Error("ส่วนลดต้องอยู่ระหว่าง 0–100%");
  const allocations = allocate(s, f.items);
  const prefix = "SO-" + TODAY.replaceAll("-", "").slice(2) + "-";
  let n = 1;
  while (s.orders.some((o) => o.id === prefix + String(n).padStart(3, "0")))
    n++;
  const status: OrderStatus = f.pending ? "รอยืนยัน" : "กำลังจัดสินค้า";
  const o: Order = {
    ...f,
    id: prefix + String(n).padStart(3, "0"),
    date: TODAY,
    time: new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: f.items.map((i) => ({ ...i, price: product(s, i.pid).price })),
    status,
    accurate: false,
    allocations: f.pending ? [] : allocations,
    earned: 0,
    reserved: !f.pending,
    timeline: [
      { status: "รับคำสั่งซื้อ", time: new Date().toISOString() },
      ...(!f.pending
        ? [{ status: "ยืนยันและตัดสต๊อก", time: new Date().toISOString() }]
        : []),
    ],
  };
  if (!f.pending) {
    allocations.forEach((a) => {
      const l = s.lots.find((l) => l.id === a.lot)!;
      l.qty = Math.round((l.qty - a.qty) * 100) / 100;
    });
    o.earned = Math.floor(sum(o) / s.settings.loyaltyRate);
    customer(s, o.cid).points += o.earned;
  }
  s.orders.unshift(o);
  s.kpi.totalCaptured++;
  return o;
}
export function confirmOrder(s: State, o: Order) {
  if (o.status !== "รอยืนยัน") throw Error("คำสั่งซื้อนี้ยืนยันแล้ว");
  const allocations = allocate(s, o.items);
  allocations.forEach((a) => {
    const l = s.lots.find((l) => l.id === a.lot)!;
    l.qty = Math.round((l.qty - a.qty) * 100) / 100;
  });
  o.allocations = allocations;
  o.reserved = true;
  o.earned = Math.floor(sum(o) / s.settings.loyaltyRate);
  customer(s, o.cid).points += o.earned;
  o.status = "กำลังจัดสินค้า";
  o.timeline.push({
    status: "ยืนยันและตัดสต๊อก",
    time: new Date().toISOString(),
  });
}
export function advanceOrder(o: Order, next: OrderStatus) {
  const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
    กำลังจัดสินค้า: ["พร้อมส่ง"],
    พร้อมส่ง: ["กำลังจัดส่ง", "เสร็จสิ้น"],
    กำลังจัดส่ง: ["เสร็จสิ้น"],
  };
  if (!allowed[o.status]?.includes(next))
    throw Error("เปลี่ยนสถานะข้ามขั้นตอนนี้ไม่ได้");
  if (next === "พร้อมส่ง" && !o.accurate)
    throw Error("ตรวจสินค้าให้ถูกต้องและครบก่อน");
  if (next === "พร้อมส่ง" && o.pickedLots && o.allocations.some(a => !o.pickedLots!.includes(a.lot)))
    throw Error("ตรวจหยิบให้ครบทุกล็อตก่อนส่งต่อ");
  o.status = next;
  o.timeline.push({ status: next, time: new Date().toISOString() });
}
export function issueReceipt(o: Order, method: string, reference: string, cashier: string) {
  if (["รอยืนยัน", "ยกเลิก"].includes(o.status)) throw Error("ยืนยันคำสั่งซื้อก่อนออกใบเสร็จ");
  if (o.receipt) throw Error("คำสั่งซื้อนี้ออกใบเสร็จแล้ว");
  if (!["เงินสด", "โอนเงิน"].includes(method)) throw Error("เลือกวิธีชำระเงิน");
  if (method === "โอนเงิน" && !reference.trim()) throw Error("ระบุเลขอ้างอิงการโอน");
  o.receipt = { number: "RC-" + o.id, issued: new Date().toISOString(), method, reference: reference.trim(), cashier, amount: sum(o) };
  o.timeline.push({status: "ออกใบเสร็จ " + o.receipt.number + " · " + method + " · " + cashier, time: o.receipt.issued});
}
export function cancelOrder(s: State, o: Order, reason: string) {
  if (!reason.trim()) throw Error("ระบุเหตุผลที่ยกเลิก");
  if (o.receipt) throw Error("รายการนี้ออกใบเสร็จแล้ว ต้องจัดการคืนเงินก่อนยกเลิก");
  if (o.status === "ยกเลิก") return;
  if (["กำลังจัดส่ง", "เสร็จสิ้น"].includes(o.status))
    throw Error("คำสั่งซื้อที่ส่งแล้วไม่สามารถยกเลิกได้");
  if (o.reserved) {
    o.allocations.forEach((a) => {
      const l = s.lots.find((l) => l.id === a.lot)!;
      l.qty = Math.round((l.qty + a.qty) * 100) / 100;
    });
    customer(s, o.cid).points = Math.max(
      0,
      customer(s, o.cid).points - o.earned,
    );
  }
  o.reserved = false;
  o.status = "ยกเลิก";
  o.timeline.push({
    status: "ยกเลิก: " + reason,
    time: new Date().toISOString(),
  });
  s.deliveries = s.deliveries.filter((d) => d.oid !== o.id);
}
export function recordTemperature(
  s: State,
  r: Room,
  temp: number,
  latency = 35,
) {
  if (!s.settings.connections.IoT)
    throw Error("เปิดการจำลองเครื่องวัดอุณหภูมิในตั้งค่าก่อน");
  if (!Number.isFinite(latency) || latency < 0 || latency > 3600)
    throw Error("เวลาแจ้งเตือนต้องอยู่ระหว่าง 0–3600 วินาที");
  if (!Number.isFinite(temp) || temp < -60 || temp > 40)
    throw Error("ค่าอุณหภูมิไม่ถูกต้อง");
  r.temp = temp;
  r.updated = new Date().toISOString();
  r.history = [...r.history.slice(-11), temp];
  if (
    (temp < r.min || temp > r.max) &&
    !s.incidents.some((i) => i.room === r.id && i.status !== "ปิด")
  ) {
    const detected = new Date(
      Date.parse(r.updated) - latency * 1000,
    ).toISOString();
    s.incidents.unshift({
      id: uid("I"),
      room: r.id,
      detected,
      notified: r.updated,
      temp,
      status: "เปิด",
      note: "",
    });
  }
}
export function acknowledge(i: Incident, staff: string) {
  if (i.status !== "เปิด") return;
  i.status = "รับทราบแล้ว";
  i.acknowledged = new Date().toISOString();
  i.assigned = staff;
}
export function closeIncident(s: State, i: Incident, note: string) {
  if (i.status === "เปิด") throw Error("รับทราบเหตุการณ์ก่อนบันทึกผล");
  const r = s.rooms.find((r) => r.id === i.room)!;
  if (r.temp < r.min || r.temp > r.max)
    throw Error("อุณหภูมิยังผิดปกติ กรุณาตรวจสอบและบันทึกค่าปกติก่อน");
  if (!note.trim()) throw Error("ระบุผลการตรวจสอบ");
  i.status = "ปิด";
  i.closed = new Date().toISOString();
  i.note = note;
}
export function campaignRecipients(s: State, c: Campaign) {
  if (c.customerId) return s.customers.filter((x) => x.id === c.customerId);
  return s.customers.filter(
    (x) =>
      c.segment === "ทุกกลุ่ม" ||
      (c.segment === "ซื้อสินค้าประเภทเดิม"
        ? favoriteCategory(s, x.id) === c.category
        : c.segment === "แนะนำลูกค้าใหม่"
          ? !!x.referrer
          : group(s, x) === c.segment),
  );
}
export function sendCampaign(s: State, c: Campaign) {
  if (c.status === "ส่งแล้ว") throw Error("โปรโมชั่นนี้ส่งแล้ว");
  if (c.channel === "LINE" && !s.settings.connections.LINE)
    throw Error("เปิดการจำลอง LINE ในตั้งค่าก่อน");
  if (c.start > TODAY || c.end < TODAY)
    throw Error("โปรโมชั่นอยู่นอกช่วงวันที่ใช้งาน");
  const recipients = campaignRecipients(s, c);
  if (!recipients.length) throw Error("ยังไม่มีลูกค้าในกลุ่มนี้");
  c.recipients = recipients.map((x) => x.id);
  c.status = "ส่งแล้ว";
  recipients.forEach((x) =>
    s.messages.unshift({
      id: uid("MSG"),
      cid: x.id,
      campaign: c.id,
      date: TODAY,
      channel: c.channel,
      text: c.text,
    }),
  );
}
export type Alert = {
  id: string;
  title: string;
  detail: string;
  route: string;
  filter?: string;
  entity?: string;
  severity: "danger" | "warning" | "info";
  time: string;
  action: string;
};
export function alerts(s: State): Alert[] {
  return [
    ...s.incidents
      .filter((i) => i.status !== "ปิด")
      .map((i) => ({
        id: i.id,
        title: s.rooms.find((r) => r.id === i.room)!.name + " อุณหภูมิผิดปกติ",
        detail:
          i.temp +
          "°C · " +
          (i.status === "เปิด"
            ? "ยังไม่มีผู้รับทราบ"
            : "รับทราบโดย " + i.assigned),
        route: "coldroom",
        entity: i.id,
        severity: "danger" as const,
        time: i.detected,
        action: "ตรวจสอบเหตุการณ์",
      })),
    ...s.products
      .filter((p) => stock(s, p.id) < p.min)
      .map((p) => ({
        id: "low-" + p.id,
        title: p.name + " ใกล้หมด",
        detail:
          "เหลือ " +
          money(stock(s, p.id)) +
          " " +
          p.unit +
          " · ขั้นต่ำ " +
          p.min,
        route: "inventory",
        filter: "ใกล้หมด",
        severity: "warning" as const,
        time: TODAY,
        action: "ดูสินค้า",
      })),
    ...s.lots
      .filter((l) => l.qty > 0 && days(l.expiry) >= -14)
      .map((l) => ({
        id: "expiry-" + l.id,
        title: product(s, l.pid).name + " " + expiryText(l.expiry),
        detail: l.code + " · เหลือ " + l.qty + " " + product(s, l.pid).unit,
        route: "inventory",
        filter: l.expiry < TODAY ? "หมดอายุ" : "ใกล้หมดอายุ",
        severity: l.expiry < TODAY ? ("danger" as const) : ("warning" as const),
        time: TODAY,
        action: "ตรวจล็อตสินค้า",
      })),
    ...s.orders
      .filter((o) => o.status === "รอยืนยัน")
      .map((o) => ({
        id: "new-" + o.id,
        title: "คำสั่งซื้อ " + o.id + " รอยืนยัน",
        detail: customer(s, o.cid).name + " · " + o.channel,
        route: "orders",
        entity: o.id,
        severity: "info" as const,
        time: o.date,
        action: "ตรวจคำสั่งซื้อ",
      })),
    ...s.customers
      .filter((c) => group(s, c) === "ไม่ได้ซื้อนาน")
      .map((c) => ({
        id: "follow-" + c.id,
        title: c.name + " ควรติดต่อกลับ",
        detail: "ไม่ได้ซื้อ " + days(lastOrder(s, c.id)) + " วัน",
        route: "crm",
        entity: c.id,
        severity: "info" as const,
        time: lastOrder(s, c.id),
        action: "ดูประวัติลูกค้า",
      })),
  ];
}
export function createSeed(): State {
  const s = structuredClone(base) as unknown as State;
  s.movements = [];
  s.readAlerts = [];
  s.settings.regularOrders = 5;
  s.settings.newOrders = 2;
  s.products.forEach((p) => {
    p.cost = Math.round(p.price * 0.75);
    p.unit = "กก.";
    p.sku = p.id;
    p.barcode = "8850012345" + p.id.slice(1);
  });
  s.rooms.forEach((r) => {
    r.updated = "2026-10-02T10:42:00+07:00";
    r.sensor = true;
  });
  s.incidents.forEach((i) => {
    i.assigned = "";
  });
  const names = [
    "ร้านสมบูรณ์โภชนา",
    "ร้านเจริญฟู้ด",
    "ร้านครัวอีสาน",
    "ร้านป้าศรีหมูกระทะ",
    "ร้านเอ็มเคมินิมาร์ท",
    "ร้านแซ่บริมโขง",
    "ร้านส้มตำคุณน้อย",
    "ร้านทะเลเผาสุขใจ",
    "ร้านก๋วยเตี๋ยวลุงชัย",
    "ร้านบัวขาวหมูกระทะ",
    "คุณสมพร",
    "ร้านครัวแม่จันทร์",
    "ร้านอิ่มดี",
    "ร้านอาหารบ้านสวน",
  ];
  names.forEach((name, n) =>
    s.customers.push({
      id: "C" + (n + 7),
      name,
      phone: "08" + String(n + 70000001).padStart(8, "0"),
      type: n === 10 ? "ค้าปลีก" : "ร้านอาหาร",
      area: n % 4 === 0 ? "นครพนม" : "มุกดาหาร",
      channel: n % 3 ? "LINE" : "โทรศัพท์",
      joined: "2026-04-15",
      points: 80 + n * 15,
      referrer: n === 3 ? "C7" : "",
      special: n < 3 ? 5 : 0,
    }),
  );
  const products: [string, string, number, string][] = [
    ["หมูสามชั้นแช่แข็ง", "หมู", 145, "กก."],
    ["หมูบด", "หมู", 120, "กก."],
    ["ซี่โครงหมู", "หมู", 135, "กก."],
    ["น่องไก่", "ไก่", 78, "กก."],
    ["ไก่ทั้งตัว", "ไก่", 85, "กก."],
    ["เนื้อปลาดอรี่", "ปลา", 95, "กก."],
    ["ปลาทับทิม", "ปลา", 110, "กก."],
    ["ปลากะพง", "ปลา", 185, "กก."],
    ["กุ้งแก้ว", "อาหารทะเล", 240, "กก."],
    ["ปลาหมึกหั่น", "อาหารทะเล", 175, "กก."],
    ["ลูกชิ้นหมู", "อาหารแช่แข็ง", 65, "แพ็ก"],
    ["ไส้กรอกไก่", "อาหารแช่แข็ง", 85, "แพ็ก"],
    ["เฟรนช์ฟรายส์", "อาหารแช่แข็ง", 120, "แพ็ก"],
    ["นักเก็ตไก่", "อาหารแช่แข็ง", 95, "กล่อง"],
  ];
  products.forEach(([name, category, price, unit], n) => {
    const pid = "P" + String(n + 7).padStart(3, "0"),
      room = category === "ไก่" ? "R1" : category === "หมู" ? "R2" : "R3";
    s.products.push({
      id: pid,
      name,
      category,
      price,
      cost: Math.round(price * 0.75),
      min: 40,
      barcode: "8850012345" + String(n + 7).padStart(3, "0"),
      supplier: category === "หมู" ? "S2" : category === "ไก่" ? "S1" : "S3",
      unit,
      sku:
        (category === "หมู" ? "PORK" : category === "ไก่" ? "CHK" : "FRZ") +
        "-" +
        String(n + 7).padStart(3, "0"),
    });
    s.lots.push({
      id: "L" + String(n + 9).padStart(3, "0"),
      pid,
      code: "LOT-A" + String(n === 0 ? 12 : n + 32).padStart(3, "0"),
      qty: n === 0 ? 30 : n === 5 ? 12 : 70 + n * 5,
      received: "2026-09-20",
      expiry: n === 0 ? "2026-10-09" : n === 2 ? "2026-10-05" : "2026-12-15",
      room,
    });
    if (n === 0)
      s.lots.push({
        id: "L030",
        pid,
        code: "LOT-A019",
        qty: 70,
        received: "2026-09-25",
        expiry: "2026-11-16",
        room,
      });
  });
  s.orders.forEach((o, n) => {
    const old = o.status as string;
    o.status =
      old === "รอจัดสินค้า"
        ? "กำลังจัดสินค้า"
        : old === "จัดสินค้าแล้ว"
          ? "พร้อมส่ง"
          : (old as OrderStatus);
    o.time = "10:" + String(42 - n * 2).padStart(2, "0");
    o.employee = "คุณนิด";
    o.note = "";
    o.reserved = true;
    o.earned = 0;
    o.timeline = [
      { status: "รับคำสั่งซื้อ", time: o.date + "T09:00:00+07:00" },
      { status: "ยืนยันและตัดสต๊อก", time: o.date + "T09:05:00+07:00" },
    ];
    o.allocations = o.items.map((i) => ({
      pid: i.pid,
      qty: i.qty,
      lot: s.lots.find((l) => l.pid === i.pid && l.expiry >= o.date)!.id,
    }));
  });
  for (let n = 0; n < 26; n++) {
    const cid = n < 15 ? "C" + (7 + (n % 3)) : "C" + (10 + (n % 10)),
      pid = n % 3 === 0 ? "P007" : n % 3 === 1 ? "P001" : "P003",
      day = n < 6 ? TODAY : "2026-09-" + String(30 - (n % 20)).padStart(2, "0"),
      status: OrderStatus =
        n < 2
          ? "รอยืนยัน"
          : n === 2
            ? "กำลังจัดสินค้า"
            : n === 3
              ? "พร้อมส่ง"
              : "เสร็จสิ้น",
      q = 5 + (n % 7);
    const o: Order = {
      id: "ORD-" + (1000 - n),
      cid,
      channel: n % 3 === 0 ? "โทรศัพท์" : n % 3 === 1 ? "LINE" : "หน้าร้าน",
      date: day,
      time: "09:" + String(10 + n).padStart(2, "0"),
      employee: "คุณนิด",
      items: [{ pid, qty: q, price: product(s, pid).price }],
      discount: customer(s, cid).special,
      status,
      accurate: n > 2,
      address: n % 3 ? "อ.เมือง มุกดาหาร" : "",
      note: "",
      allocations:
        status === "รอยืนยัน"
          ? []
          : [
              {
                pid,
                lot: s.lots.find((l) => l.pid === pid && l.expiry >= day)!.id,
                qty: q,
              },
            ],
      earned: 0,
      reserved: status !== "รอยืนยัน",
      timeline: [{ status: "รับคำสั่งซื้อ", time: day + "T09:00:00+07:00" }],
    };
    s.orders.push(o);
  }
  s.orders.sort(
    (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
  );
  s.kpi.totalCaptured = s.orders.length;
  for (let n = 0; n < 4; n++)
    s.incidents.push({
      id: "I" + (n + 2),
      room: "R" + ((n % 3) + 1),
      detected: "2026-09-" + (26 + n) + "T09:41:00+07:00",
      notified: "2026-09-" + (26 + n) + "T09:41:35+07:00",
      temp: -12.5,
      status: "ปิด",
      acknowledged: "2026-09-" + (26 + n) + "T09:43:00+07:00",
      assigned: "คุณเอก",
      note: "ตรวจประตูห้องเย็นและปิดให้สนิท อุณหภูมิกลับสู่ช่วงปกติ",
    });
  s.campaigns.forEach((c) => {
    c.segment = c.segment === "หายไปนาน" ? "ไม่ได้ซื้อนาน" : c.segment;
    c.channel = "LINE";
    c.start = TODAY;
    c.end = "2026-10-31";
  });
  s.campaigns.push(
    {
      id: "M3",
      name: "ราคาพิเศษลูกค้าประจำ",
      segment: "ลูกค้าประจำ",
      discount: 5,
      text: "รับส่วนลด 5% สำหรับสินค้ารอบนี้ สั่งผ่าน LINE ได้เลยค่ะ",
      status: "ร่าง",
      recipients: [],
      channel: "LINE",
      start: TODAY,
      end: "2026-10-31",
    },
    {
      id: "M4",
      name: "หมูสามชั้นสำหรับร้านหมูกระทะ",
      segment: "ซื้อสินค้าประเภทเดิม",
      category: "หมู",
      discount: 7,
      text: "หมูสามชั้นเข้าใหม่ รับส่วนลด 7% ถึงสิ้นเดือนนี้ค่ะ",
      status: "ร่าง",
      recipients: [],
      channel: "LINE",
      start: TODAY,
      end: "2026-10-31",
    },
    {
      id: "M5",
      name: "ขอบคุณที่แนะนำร้านเรา",
      segment: "แนะนำลูกค้าใหม่",
      discount: 5,
      text: "ขอบคุณที่แนะนำลูกค้าใหม่ รับส่วนลด 5% และแต้มสะสมตามเงื่อนไขร้านค่ะ",
      status: "ร่าง",
      recipients: [],
      channel: "SMS",
      start: TODAY,
      end: "2026-10-31",
    },
  );
  return s;
}
export function validateState(v: unknown): v is State {
  try {
    if (!v || typeof v !== "object") return false;
    const s = v as State;
    const keys = [
      "products",
      "lots",
      "customers",
      "orders",
      "rooms",
      "incidents",
      "waste",
      "counts",
      "movements",
      "contacts",
      "campaigns",
      "messages",
      "deliveries",
      "suppliers",
      "purchases",
      "users",
      "logs",
      "surveys",
      "readAlerts",
    ] as const;
    if (keys.some((k) => !Array.isArray(s[k])) || !s.settings || !s.kpi)
      return false;
    const ids = (xs: { id: string }[]) =>
      new Set(xs.map((x) => x.id)).size === xs.length &&
      xs.every((x) => typeof x.id === "string");
    if (
      keys
        .filter((k) => k !== "readAlerts")
        .some((k) => !ids(s[k] as { id: string }[]))
    )
      return false;
    if (
      !s.products.every(
        (p) =>
          p.name &&
          p.unit &&
          Number.isFinite(p.price) &&
          p.price > 0 &&
          Number.isFinite(p.min) &&
          p.min >= 0,
      )
    )
      return false;
    if (
      !s.customers.every(
        (c) =>
          typeof c.name === "string" &&
          typeof c.phone === "string" &&
          Number.isFinite(c.points) &&
          c.points >= 0,
      )
    )
      return false;
    if (
      !s.lots.every(
        (l) =>
          Number.isFinite(l.qty) &&
          l.qty >= 0 &&
          s.products.some((p) => p.id === l.pid) &&
          s.rooms.some((r) => r.id === l.room) &&
          /^\d{4}-\d{2}-\d{2}$/.test(l.expiry),
      )
    )
      return false;
    if (
      !s.orders.every(
        (o) =>
          s.customers.some((c) => c.id === o.cid) &&
          Array.isArray(o.items) &&
          Array.isArray(o.allocations) &&
          Array.isArray(o.timeline) &&
          o.items.every(
            (i) =>
              s.products.some((p) => p.id === i.pid) &&
              i.qty > 0 &&
              i.price > 0,
          ) &&
          o.allocations.every(
            (a) =>
              s.lots.some((l) => l.id === a.lot && l.pid === a.pid) &&
              a.qty > 0,
          ) &&
          [
            "รอยืนยัน",
            "กำลังจัดสินค้า",
            "พร้อมส่ง",
            "กำลังจัดส่ง",
            "เสร็จสิ้น",
            "ยกเลิก",
          ].includes(o.status),
      )
    )
      return false;
    const finite = (v: unknown) => typeof v === "number" && Number.isFinite(v),
      text = (v: unknown) => typeof v === "string",
      validDate = (v: unknown) =>
        text(v) && Number.isFinite(Date.parse(v as string)),
      pid = (id: string) => s.products.some((p) => p.id === id),
      cid = (id: string) => s.customers.some((c) => c.id === id),
      lid = (id: string) => s.lots.some((l) => l.id === id),
      rid = (id: string) => s.rooms.some((r) => r.id === id);
    if (
      !s.products.every(
        (p) =>
          text(p.sku) &&
          text(p.barcode) &&
          finite(p.cost) &&
          p.cost >= 0 &&
          s.suppliers.some((x) => x.id === p.supplier),
      )
    )
      return false;
    if (
      !s.customers.every(
        (c) =>
          validDate(c.joined) &&
          text(c.channel) &&
          finite(c.special) &&
          c.special >= 0 &&
          c.special <= 100 &&
          (!c.referrer || (cid(c.referrer) && c.referrer !== c.id)),
      )
    )
      return false;
    if (
      !s.lots.every(
        (l) =>
          validDate(l.expiry) &&
          validDate(l.received) &&
          l.expiry >= l.received &&
          text(l.code),
      )
    )
      return false;
    if (
      !s.rooms.every(
        (r) =>
          text(r.name) &&
          finite(r.temp) &&
          finite(r.min) &&
          finite(r.max) &&
          r.min < r.max &&
          Array.isArray(r.history) &&
          r.history.every(finite) &&
          validDate(r.updated) &&
          typeof r.sensor === "boolean",
      )
    )
      return false;
    if (
      !s.orders.every(
        (o) =>
          validDate(o.date) &&
          text(o.time) &&
          text(o.employee) &&
          text(o.address) &&
          text(o.note) &&
          finite(o.discount) &&
          o.discount >= 0 &&
          o.discount <= 100 &&
          finite(o.earned) &&
          o.earned >= 0 &&
          typeof o.reserved === "boolean" &&
          typeof o.accurate === "boolean" &&
          ["LINE", "โทรศัพท์", "หน้าร้าน", "ออนไลน์"].includes(o.channel) &&
          o.timeline.every((t) => text(t.status) && validDate(t.time)),
      )
    )
      return false;
    if (
      !s.incidents.every(
        (i) =>
          rid(i.room) &&
          finite(i.temp) &&
          validDate(i.detected) &&
          validDate(i.notified) &&
          Date.parse(i.notified) >= Date.parse(i.detected) &&
          ["เปิด", "รับทราบแล้ว", "ปิด"].includes(i.status) &&
          text(i.note),
      )
    )
      return false;
    if (
      !s.waste.every(
        (w) =>
          pid(w.pid) &&
          (!w.lot || lid(w.lot)) &&
          finite(w.qty) &&
          w.qty > 0 &&
          finite(w.value) &&
          w.value >= 0 &&
          validDate(w.date) &&
          text(w.reason),
      )
    )
      return false;
    if (
      !s.counts.every(
        (c) =>
          lid(c.lot) &&
          finite(c.expected) &&
          finite(c.actual) &&
          c.actual >= 0 &&
          c.expected >= 0 &&
          validDate(c.date),
      )
    )
      return false;
    if (
      !s.movements.every(
        (m) =>
          lid(m.lot) &&
          finite(m.qty) &&
          text(m.kind) &&
          text(m.reason) &&
          validDate(m.date),
      )
    )
      return false;
    if (
      !s.contacts.every(
        (c) =>
          cid(c.cid) &&
          validDate(c.date) &&
          text(c.text) &&
          text(c.channel) &&
          text(c.kind) &&
          typeof c.resolved === "boolean",
      )
    )
      return false;
    if (
      !s.campaigns.every(
        (c) =>
          text(c.name) &&
          text(c.segment) &&
          text(c.text) &&
          finite(c.discount) &&
          c.discount >= 0 &&
          c.discount <= 100 &&
          validDate(c.start) &&
          validDate(c.end) &&
          c.end >= c.start &&
          ["LINE", "SMS", "การแจ้งเตือน"].includes(c.channel) &&
          ["ร่าง", "ส่งแล้ว"].includes(c.status) &&
          Array.isArray(c.recipients) &&
          c.recipients.every(cid) &&
          (!c.customerId || cid(c.customerId)),
      )
    )
      return false;
    if (
      !s.messages.every(
        (m) =>
          cid(m.cid) &&
          s.campaigns.some((c) => c.id === m.campaign) &&
          text(m.text) &&
          text(m.channel) &&
          validDate(m.date),
      )
    )
      return false;
    if (
      !s.deliveries.every(
        (d) =>
          s.orders.some((o) => o.id === d.oid) &&
          text(d.driver) &&
          text(d.address) &&
          text(d.tracking) &&
          validDate(d.eta) &&
          Array.isArray(d.log) &&
          d.log.every(text) &&
          ["รอรับสินค้า", "กำลังจัดส่ง", "จัดส่งสำเร็จ"].includes(d.status),
      )
    )
      return false;
    if (
      !s.suppliers.every(
        (x) => text(x.name) && text(x.phone) && finite(x.lead) && x.lead >= 1,
      )
    )
      return false;
    if (
      !s.purchases.every(
        (p) =>
          pid(p.pid) &&
          s.suppliers.some((x) => x.id === p.sid) &&
          finite(p.qty) &&
          p.qty > 0 &&
          finite(p.cost) &&
          p.cost > 0 &&
          validDate(p.date) &&
          validDate(p.eta) &&
          ["รอรับสินค้า", "รับสินค้าแล้ว"].includes(p.status),
      )
    )
      return false;
    if (
      !s.users.every(
        (u) =>
          text(u.name) &&
          text(u.role) &&
          typeof u.active === "boolean" &&
          Array.isArray(u.training) &&
          u.training.every(text),
      )
    )
      return false;
    if (!s.logs.every((l) => text(l.text) && text(l.user) && validDate(l.date)))
      return false;
    if (
      !s.surveys.every(
        (v) =>
          cid(v.cid) &&
          finite(v.score) &&
          v.score >= 1 &&
          v.score <= 5 &&
          text(v.note) &&
          validDate(v.date),
      )
    )
      return false;
    if (
      !s.readAlerts.every(text) ||
      !["FEFO", "FIFO"].includes(s.settings.picking) ||
      !s.settings.connections ||
      !Object.values(s.settings.connections).every(
        (v) => typeof v === "boolean",
      ) ||
      !finite(s.settings.regularOrders) ||
      !finite(s.settings.newOrders) ||
      s.settings.newOrders < 0 ||
      s.settings.regularOrders <= s.settings.newOrders ||
      !finite(s.settings.referralPoints) ||
      s.settings.referralPoints < 0
    )
      return false;
    if (
      !Object.values(s.kpi).every(finite) ||
      s.kpi.baselineWaste < 0 ||
      s.kpi.baselineRetention < 0 ||
      s.kpi.baselineRetention > 100 ||
      s.kpi.baselineDigital < 0 ||
      s.kpi.totalCaptured < s.orders.length ||
      s.kpi.uptime < 0
    )
      return false;
    return (
      Number.isFinite(s.settings.loyaltyRate) &&
      s.settings.loyaltyRate > 0 &&
      Number.isFinite(s.settings.inactiveDays) &&
      s.settings.inactiveDays > 0 &&
      s.kpi.totalTime > 0 &&
      s.kpi.uptime <= s.kpi.totalTime
    );
  } catch {
    return false;
  }
}
