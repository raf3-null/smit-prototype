import { State, TODAY, days, group, sum, customer } from "./domain";
export type Metric = {
  key: string;
  label: string;
  value: number | null;
  target: number;
  unit: string;
  lower?: boolean;
  basis: string;
  formula: string;
  route: string;
  trend: number | null;
  kind: string;
};
export function metrics(s: State, period = "2026-10"): Metric[] {
  const inRange = (d: string) => period === "all" || d.startsWith(period);
  const orders = s.orders.filter(
      (o) => inRange(o.date) && !["ยกเลิก", "รอยืนยัน"].includes(o.status),
    ),
    counts = s.counts.filter((c) => inRange(c.date)),
    waste = s.waste
      .filter((w) => inRange(w.date))
      .reduce((a, w) => a + w.value, 0),
    checked = orders.filter((o) =>
      ["พร้อมส่ง", "กำลังจัดส่ง", "เสร็จสิ้น"].includes(o.status),
    ),
    old = s.customers.filter(
      (c) => c.joined < (period === "all" ? "2026-10" : period) + "-01",
    ),
    returned = old.filter((c) => orders.some((o) => o.cid === c.id)),
    digital = orders
      .filter(
        (o) =>
          ["LINE", "ออนไลน์"].includes(o.channel) ||
          customer(s, o.cid).area !== "มุกดาหาร",
      )
      .reduce((a, o) => a + sum(o), 0),
    incidents = s.incidents.filter((i) => inRange(i.detected)),
    pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
  const retention = pct(returned.length, old.length),
    priorOrders = s.orders.filter(
      (o) =>
        o.date.startsWith("2026-09") &&
        !["ยกเลิก", "รอยืนยัน"].includes(o.status),
    ),
    priorChecked = priorOrders.filter((o) =>
      ["พร้อมส่ง", "กำลังจัดส่ง", "เสร็จสิ้น"].includes(o.status),
    ),
    priorAccuracy = pct(
      priorChecked.filter((o) => o.accurate).length,
      priorChecked.length,
    ),
    accuracy = pct(checked.filter((o) => o.accurate).length, checked.length);
  return [
    {
      key: "stock",
      label: "ความถูกต้องของสต๊อก",
      value: pct(
        counts.filter((c) => c.expected === c.actual).length,
        counts.length,
      ),
      target: 98,
      unit: "%",
      basis:
        counts.filter((c) => c.expected === c.actual).length +
        " / " +
        counts.length +
        " ล็อตที่ตรวจนับ",
      formula: "ล็อตที่นับตรงกับระบบ ÷ ล็อตที่ตรวจทั้งหมด × 100",
      route: "inventory",
      trend: null,
      kind: "ธุรกิจ",
    },
    {
      key: "waste",
      label: "การลดสินค้าเสียและหมดอายุ",
      value: s.kpi.baselineWaste
        ? ((s.kpi.baselineWaste - waste) / s.kpi.baselineWaste) * 100
        : null,
      target: 30,
      unit: "%",
      basis:
        "เสีย " +
        waste +
        " บาท · ข้อมูลเปรียบเทียบ " +
        s.kpi.baselineWaste +
        " บาท",
      formula: "(มูลค่าสินค้าเสียเดิม − ปัจจุบัน) ÷ มูลค่าเดิม × 100",
      route: "inventory",
      trend: null,
      kind: "ธุรกิจ",
    },
    {
      key: "order",
      label: "ความถูกต้องของออร์เดอร์",
      value: accuracy,
      target: 98,
      unit: "%",
      basis:
        checked.filter((o) => o.accurate).length +
        " / " +
        checked.length +
        " คำสั่งซื้อที่จัดแล้ว",
      formula: "คำสั่งซื้อที่จัดถูกต้อง ÷ คำสั่งซื้อที่จัดแล้วทั้งหมด × 100",
      route: "orders",
      trend:
        period === "2026-10" && accuracy !== null && priorAccuracy !== null
          ? accuracy - priorAccuracy
          : null,
      kind: "ธุรกิจ",
    },
    {
      key: "retention",
      label: "ลูกค้าเดิมกลับมาซื้อซ้ำ",
      value:
        retention === null || !s.kpi.baselineRetention
          ? null
          : ((retention - s.kpi.baselineRetention) / s.kpi.baselineRetention) *
            100,
      target: 15,
      unit: "%",
      basis:
        returned.length +
        " / " +
        old.length +
        " ลูกค้าเดิม · อัตราเดิม " +
        s.kpi.baselineRetention +
        "%",
      formula:
        "อัตราซื้อซ้ำ = ลูกค้าเดิมที่กลับมาซื้อ ÷ ลูกค้าเดิมทั้งหมด × 100; ผลเพิ่ม = (อัตราปัจจุบัน − อัตราเดิม) ÷ อัตราเดิม × 100",
      route: "groups",
      trend: null,
      kind: "ธุรกิจ",
    },
    {
      key: "digital",
      label: "ยอดขายออนไลน์และลูกค้าต่างจังหวัดเพิ่มขึ้น",
      value: s.kpi.baselineDigital
        ? ((digital - s.kpi.baselineDigital) / s.kpi.baselineDigital) * 100
        : null,
      target: 20,
      unit: "%",
      basis:
        "ยอดขาย " +
        digital +
        " บาท · ยอดเดิม " +
        s.kpi.baselineDigital +
        " บาท",
      formula: "(ยอดขายปัจจุบัน − ยอดเดิม) ÷ ยอดเดิม × 100",
      route: "analytics",
      trend: null,
      kind: "ธุรกิจ",
    },
    {
      key: "uptime",
      label: "ความพร้อมใช้งานของระบบ",
      value: period === "all" ? pct(s.kpi.uptime, s.kpi.totalTime) : null,
      target: 99.5,
      unit: "%",
      basis:
        period === "all"
          ? s.kpi.uptime + " / " + s.kpi.totalTime + " นาที (ข้อมูลตัวอย่าง)"
          : "ยังไม่มีเวลาระบบแยกตามเดือน",
      formula: "เวลาที่ใช้งานได้ ÷ เวลาทั้งหมด × 100",
      route: "settings",
      trend: null,
      kind: "ระบบ",
    },
    {
      key: "latency",
      label: "เวลาในการแจ้งเตือนอุณหภูมิ",
      value: incidents.length
        ? Math.max(
            ...incidents.map(
              (i) => (Date.parse(i.notified) - Date.parse(i.detected)) / 1000,
            ),
          )
        : null,
      target: 60,
      unit: " วินาที",
      lower: true,
      basis: incidents.length + " เหตุการณ์ · แสดงเวลาที่นานที่สุด",
      formula: "เวลาที่แจ้งเตือน − เวลาที่ตรวจพบ",
      route: "coldroom",
      trend: null,
      kind: "ระบบ",
    },
    {
      key: "capture",
      label: "ออร์เดอร์ที่บันทึกเข้าระบบ",
      value:
        period === "all" ? pct(s.orders.length, s.kpi.totalCaptured) : null,
      target: 99,
      unit: "%",
      basis:
        period === "all"
          ? s.orders.length +
            " / " +
            s.kpi.totalCaptured +
            " ออร์เดอร์ทุกช่องทาง"
          : "ยังไม่มีจำนวนที่ได้รับทั้งหมดแยกตามเดือน",
      formula: "ออร์เดอร์ในระบบ ÷ ออร์เดอร์ที่ได้รับทั้งหมด × 100",
      route: "orders",
      trend: null,
      kind: "ระบบ",
    },
    {
      key: "adoption",
      label: "พนักงานที่ใช้งานระบบ",
      value: pct(
        s.users.filter((u) => u.active && inRange(u.last)).length,
        s.users.length,
      ),
      target: 90,
      unit: "%",
      basis: "ประวัติใช้งานของพนักงาน " + s.users.length + " คน",
      formula: "พนักงานที่ใช้งาน ÷ พนักงานทั้งหมด × 100",
      route: "team",
      trend: null,
      kind: "ระบบ",
    },
  ];
}
