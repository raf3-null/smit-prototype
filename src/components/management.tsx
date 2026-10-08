"use client";
import { useState } from "react";
import {
  Plus,
  Download,
  Check,
  ArrowUpRight,
  TriangleAlert,
  Send,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  Section,
  DataTable,
  Badge,
  Field,
  StatStrip,
  Empty,
  Modal,
  SimpleForm,
  SearchInput,
  Filters,
  ActionRow,
} from "./ui";
import {
  State,
  Role,
  TODAY,
  uid,
  stock,
  product,
  customer,
  group,
  sum,
  money,
  date,
  days,
  lastOrder,
  relative,
  expiryText,
  createSeed,
} from "@/lib/domain";
import { metrics, Metric } from "@/lib/metrics";
import { Navigate, OpenForm } from "./orders";
export function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function Home({ go, open }: { go: Navigate; open: OpenForm }) {
  const { s, role } = useStore();
  const pending = s.orders.filter((o) => o.status === "รอยืนยัน"),
    packing = s.orders.filter((o) => o.status === "กำลังจัดสินค้า"),
    low = s.products.filter((p) => stock(s, p.id) < p.min),
    near = s.lots.filter(
      (l) => l.qty > 0 && l.expiry >= TODAY && days(l.expiry) >= -14,
    ),
    bad = s.rooms.filter((r) => r.temp < r.min || r.temp > r.max),
    today = s.orders.filter(
      (o) => o.date === TODAY && !["รอยืนยัน", "ยกเลิก"].includes(o.status),
    );
  const tasks = [
    {
      key: "confirm",
      title: "คำสั่งซื้อรอยืนยัน",
      detail: "ตรวจลูกค้า สินค้า และจำนวนก่อนตัดสต๊อก",
      count: pending.length,
      route: "orders",
      filter: "รอยืนยัน",
      severity: "neutral",
      action: "ดูคำสั่งซื้อ",
    },
    {
      key: "packing",
      title: "สินค้ารอจัด",
      detail: "จัดตามล็อตที่แนะนำและตรวจความครบถ้วน",
      count: packing.length,
      route: "orders",
      filter: "กำลังจัดสินค้า",
      severity: "neutral",
      action: "เริ่มจัดสินค้า",
    },
    {
      key: "low",
      title: "สินค้าใกล้หมด",
      detail: "ตรวจจำนวนคงเหลือและวางแผนเติมสินค้า",
      count: low.length,
      route: "inventory",
      filter: "ใกล้หมด",
      severity: "warning",
      action: "ดูสินค้า",
    },
    {
      key: "expiry",
      title: "สินค้าใกล้หมดอายุ",
      detail: "ใช้ล็อตที่หมดอายุก่อนและกันสินค้าเสีย",
      count: near.length,
      route: "inventory",
      filter: "ใกล้หมดอายุ",
      severity: "warning",
      action: "ตรวจล็อตสินค้า",
    },
    {
      key: "cold",
      title: "ห้องเย็นต้องตรวจสอบ",
      detail:
        bad.map((r) => r.name + " " + r.temp + "°C").join(" · ") ||
        "ทุกห้องอยู่ในช่วงที่กำหนด",
      count: bad.length,
      route: "coldroom",
      filter: "",
      severity: bad.length ? "danger" : "neutral",
      action: "ตรวจสอบห้องเย็น",
    },
  ];
  const priorities: Record<Role, string[]> = {
    พนักงานส่งของ: [],
    พนักงานขาย: ["confirm", "packing", "low"],
    พนักงานคลัง: ["packing", "low", "expiry"],
    ผู้ดูแลห้องเย็น: ["cold", "expiry"],
    ผู้จัดการ: ["cold", "confirm", "low", "expiry"],
  };
  const label =
    role === "ผู้จัดการ"
      ? "ภาพรวมวันนี้"
      : role === "พนักงานขาย"
        ? "งานขายวันนี้"
        : role === "พนักงานคลัง"
          ? "งานคลังวันนี้"
          : "สถานะห้องเย็นวันนี้";
  return (
    <>
      <PageHeader
        title={label}
        description={`${date(TODAY)} · สาขามุกดาหาร · มุมมอง${role}`}
        actions={
          role === "พนักงานคลัง" ? (
            <Button primary onClick={() => open("receive")}>
              <Plus size={16} />
              รับสินค้าเข้า
            </Button>
          ) : role === "ผู้ดูแลห้องเย็น" ? (
            <Button primary onClick={() => go("coldroom")}>
              ตรวจสอบห้องเย็น
            </Button>
          ) : (
            <Button primary onClick={() => go("new-order")}>
              <Plus size={16} />
              สร้างคำสั่งซื้อ
            </Button>
          )
        }
      />
      <Section
        title="งานที่ต้องจัดการ"
        className="action-center"
        action={
          <Button small onClick={() => go("alerts")}>
            ดูการแจ้งเตือนทั้งหมด
          </Button>
        }
      >
        {priorities[role].map((key) => {
          const t = tasks.find((t) => t.key === key)!;
          return (
            <ActionRow
              key={key}
              title={t.title}
              detail={t.detail}
              count={t.count}
              severity={t.severity}
              action={t.action}
              onClick={() => go(t.route, t.filter)}
            />
          );
        })}
      </Section>
      {role === "ผู้ดูแลห้องเย็น" ? (
        <Section title="สถานะทุกห้อง">
          {s.rooms.map((r) => (
            <ActionRow
              key={r.id}
              title={r.name + " · " + r.temp + "°C"}
              detail={`ช่วงที่กำหนด ${r.min} ถึง ${r.max}°C`}
              action={
                r.temp > r.max || r.temp < r.min
                  ? "ตรวจสอบเหตุการณ์"
                  : "ดูประวัติอุณหภูมิ"
              }
              severity={r.temp > r.max || r.temp < r.min ? "danger" : "neutral"}
              onClick={() => go("coldroom")}
            />
          ))}
        </Section>
      ) : (
        <>
          <StatStrip
            items={
              role === "พนักงานคลัง"
                ? [
                    { label: "ชนิดสินค้า", value: s.products.length + " ชนิด" },
                    { label: "ล็อตในคลัง", value: s.lots.length + " ล็อต" },
                    {
                      label: "รอจัดสินค้า",
                      value: packing.length + " คำสั่งซื้อ",
                    },
                  ]
                : [
                    {
                      label: "ยอดขายวันนี้",
                      value: "฿" + money(today.reduce((a, o) => a + sum(o), 0)),
                    },
                    {
                      label: "คำสั่งซื้อวันนี้",
                      value: today.length + " รายการ",
                    },
                    {
                      label: "ลูกค้าที่ซื้อวันนี้",
                      value: new Set(today.map((o) => o.cid)).size + " ราย",
                    },
                  ]
            }
          />
          <div className="home-columns">
            <Section
              title={
                role === "พนักงานคลัง" ? "คำสั่งซื้อรอจัด" : "คำสั่งซื้อล่าสุด"
              }
              action={
                <Button small onClick={() => go("orders")}>
                  ดูทั้งหมด →
                </Button>
              }
            >
              <DataTable
                rows={(role === "พนักงานคลัง" ? packing : s.orders).slice(0, 7)}
                columns={[
                  {
                    label: "เลขที่ / ลูกค้า",
                    cell: (o) => (
                      <>
                        <button
                          className="text-link"
                          onClick={() => go("orders", "", o.id)}
                        >
                          {o.id}
                        </button>
                        <small>{customer(s, o.cid).name}</small>
                      </>
                    ),
                  },
                  {
                    label: "ช่องทาง",
                    cell: (o) => o.channel,
                    className: "secondary-column",
                  },
                  {
                    label: "ยอดรวม",
                    align: "right",
                    cell: (o) => "฿" + money(sum(o)),
                  },
                  { label: "สถานะ", cell: (o) => <Badge>{o.status}</Badge> },
                ]}
              />
            </Section>
            <Section
              title={
                role === "พนักงานคลัง"
                  ? "สินค้าที่ควรหยิบก่อน"
                  : "ลูกค้าที่ควรติดต่อ"
              }
            >
              {role === "พนักงานคลัง"
                ? near
                    .slice(0, 5)
                    .map((l) => (
                      <ActionRow
                        key={l.id}
                        title={product(s, l.pid).name}
                        detail={l.code + " · " + expiryText(l.expiry)}
                        action="ดูล็อต"
                        severity="warning"
                        onClick={() => open("lot", l.id)}
                      />
                    ))
                : s.customers
                    .filter((c) => group(s, c) === "ไม่ได้ซื้อนาน")
                    .slice(0, 5)
                    .map((c) => (
                      <ActionRow
                        key={c.id}
                        title={c.name}
                        detail={
                          "ไม่ได้ซื้อ " + days(lastOrder(s, c.id)) + " วัน"
                        }
                        action="ดูประวัติ"
                        onClick={() => go("crm", "", c.id)}
                      />
                    ))}
            </Section>
          </div>
        </>
      )}
      {role === "ผู้จัดการ" && (
        <div className="split-layout">
          <Section
            title="ยอดขาย 7 วันที่ผ่านมา"
            action={
              <Button small onClick={() => go("analytics")}>
                ดูรายงาน →
              </Button>
            }
          >
            <SalesChart />
          </Section>
          <Section title="สินค้าที่ขายมากที่สุด">
            <DataTable
              rows={s.products
                .map((p) => ({
                  ...p,
                  sold: s.orders
                    .filter((o) => !["รอยืนยัน", "ยกเลิก"].includes(o.status))
                    .reduce(
                      (a, o) =>
                        a +
                        o.items
                          .filter((i) => i.pid === p.id)
                          .reduce((b, i) => b + i.qty, 0),
                      0,
                    ),
                }))
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 5)}
              columns={[
                { label: "สินค้า", cell: (p) => p.name },
                {
                  label: "จำนวนขาย",
                  align: "right",
                  cell: (p) => money(p.sold) + " " + p.unit,
                },
              ]}
            />
          </Section>
        </div>
      )}
    </>
  );
}
function SalesChart() {
  const { s } = useStore();
  const data = Array.from({ length: 7 }, (_, n) => {
    const d = new Date(TODAY + "T12:00:00");
    d.setDate(d.getDate() - 6 + n);
    const ds = d.toISOString().slice(0, 10);
    return {
      day: ds.slice(8) + "/" + ds.slice(5, 7),
      sales: s.orders
        .filter(
          (o) => o.date === ds && !["รอยืนยัน", "ยกเลิก"].includes(o.status),
        )
        .reduce((a, o) => a + sum(o), 0),
    };
  });
  return (
    <div className="sales-chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ left: 0, right: 0, top: 12, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#e3e8ef" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => (v >= 1000 ? v / 1000 + "k" : String(v))}
          />
          <Tooltip
            formatter={(v) => ["฿" + money(Number(v)), "ยอดขาย"]}
            cursor={{ fill: "#f2f5f8" }}
          />
          <Bar
            dataKey="sales"
            fill="#27628d"
            maxBarSize={36}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Performance({ go, open }: { go: Navigate; open: OpenForm }) {
  const { s } = useStore();
  const [period, setPeriod] = useState("2026-10");
  const [kind, setKind] = useState("ทั้งหมด");
  const [detail, setDetail] = useState<Metric | null>(null);
  const ms = metrics(s, period),
    good = ms.filter(
      (m) =>
        m.value !== null &&
        (m.lower ? m.value <= m.target : m.value >= m.target),
    ),
    poor = ms.filter(
      (m) =>
        m.value !== null && (m.lower ? m.value > m.target : m.value < m.target),
    );
  return (
    <>
      <PageHeader
        title="ผลการดำเนินงาน"
        description="ติดตามเป้าหมายธุรกิจและรายการที่ต้องปรับปรุง"
        actions={
          <>
            <Button
              onClick={() => download("ผลการดำเนินงาน-" + period + ".json", ms)}
            >
              <Download size={16} />
              ส่งออกรายงาน
            </Button>
            <Button onClick={() => open("baseline")}>ข้อมูลเปรียบเทียบ</Button>
          </>
        }
      />
      <div className="toolbar">
        <Field label="ช่วงเวลา">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="2026-10">ตุลาคม 2026</option>
            <option value="2026-09">กันยายน 2026</option>
            <option value="all">ข้อมูลทั้งหมด</option>
          </select>
        </Field>
        <Field label="ประเภท">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option>ทั้งหมด</option>
            <option>ธุรกิจ</option>
            <option>ระบบ</option>
          </select>
        </Field>
      </div>
      <div className="score-summary">
        <span>
          <Check size={16} />
          {good.length} ตัวชี้วัดอยู่ในเป้าหมาย
        </span>
        <span className="warning-text">
          <TriangleAlert size={16} />
          {poor.length} ตัวควรติดตาม
        </span>
        <small>
          {ms.filter((m) => m.value === null).length} ตัวยังไม่มีข้อมูล
        </small>
      </div>
      <div className="scorecard">
        {ms
          .filter((m) => kind === "ทั้งหมด" || m.kind === kind)
          .map((m) => {
            const passed =
              m.value !== null &&
              (m.lower ? m.value <= m.target : m.value >= m.target);
            return (
              <section className="score-row" key={m.key}>
                <div className="score-title">
                  <h2>{m.label}</h2>
                  <small>{m.kind}</small>
                </div>
                <div className="score-value">
                  <strong>
                    {m.value === null ? "—" : money(m.value) + m.unit}
                  </strong>
                  <span>
                    เป้าหมาย {m.lower ? "≤" : "≥"} {m.target}
                    {m.unit}
                  </span>
                </div>
                <div className="score-progress">
                  <div className="progress">
                    <span
                      style={{
                        width:
                          Math.min(
                            100,
                            Math.max(
                              0,
                              m.value === null
                                ? 0
                                : m.lower
                                  ? m.value <= m.target
                                    ? 100
                                    : (m.target / m.value) * 100
                                  : (m.value / m.target) * 100,
                            ),
                          ) + "%",
                        background: passed
                          ? "var(--success)"
                          : "var(--warning)",
                      }}
                    />
                  </div>
                  <small
                    className={
                      m.value === null
                        ? "muted"
                        : passed
                          ? "success-text"
                          : "warning-text"
                    }
                  >
                    {m.value === null
                      ? "ยังไม่มีข้อมูล"
                      : passed
                        ? "✓ อยู่ในเป้าหมาย"
                        : "ควรติดตาม"}
                  </small>
                </div>
                <div className="score-trend">
                  {m.trend !== null ? (
                    <span>
                      {m.trend > 0 ? "+" : ""}
                      {money(m.trend)} จุดเปอร์เซ็นต์จากเดือนก่อน
                    </span>
                  ) : (
                    <span>ยังไม่มีข้อมูลเปรียบเทียบเดือนก่อน</span>
                  )}
                </div>
                <div className="actions">
                  <Button small onClick={() => setDetail(m)}>
                    ดูรายละเอียด
                  </Button>
                  {m.value !== null && !passed && (
                    <Button small onClick={() => go(m.route)}>
                      ดูรายการที่เกี่ยวข้อง →
                    </Button>
                  )}
                </div>
              </section>
            );
          })}
      </div>
      {detail && (
        <Modal title={detail.label} onClose={() => setDetail(null)}>
          <StatStrip
            items={[
              {
                label: "ผลปัจจุบัน",
                value:
                  detail.value === null
                    ? "ยังไม่มีข้อมูล"
                    : money(detail.value) + detail.unit,
              },
              {
                label: "เป้าหมาย",
                value:
                  (detail.lower ? "≤ " : "≥ ") + detail.target + detail.unit,
              },
            ]}
          />
          <Section title="รายการที่ใช้วัด">
            <p>{detail.basis}</p>
          </Section>
          <Section title="วิธีคำนวณ">
            <p>{detail.formula}</p>
          </Section>
          <p>
            ค่าเปรียบเทียบเป็นข้อมูลตัวอย่าง เปลี่ยนได้ที่ “ข้อมูลเปรียบเทียบ”
          </p>
          <div className="form-footer">
            <Button
              primary
              onClick={() => {
                setDetail(null);
                go(detail.route);
              }}
            >
              ดูข้อมูลที่เกี่ยวข้อง
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Analytics({ go, open }: { go: Navigate; open: OpenForm }) {
  const { s } = useStore();
  const os = s.orders.filter((o) => !["รอยืนยัน", "ยกเลิก"].includes(o.status));
  const total = os.reduce((a, o) => a + sum(o), 0);
  return (
    <>
      <PageHeader
        title="ยอดขายและแผนเติมสินค้า"
        description="ดูช่องทางที่ขายได้ และสินค้าที่ควรสั่งเพิ่ม"
      />
      <StatStrip
        items={[
          { label: "ยอดขายทั้งหมด", value: "฿" + money(total) },
          {
            label: "เฉลี่ยต่อคำสั่งซื้อ",
            value: "฿" + money(total / Math.max(1, os.length)),
          },
          {
            label: "ลูกค้าต่างจังหวัด",
            value:
              s.customers.filter((c) => c.area !== "มุกดาหาร").length + " ราย",
          },
        ]}
      />
      <div className="split-layout">
        <Section title="ยอดขาย 7 วันที่ผ่านมา">
          <SalesChart />
        </Section>
        <Section title="ยอดขายตามช่องทาง">
          {["LINE", "โทรศัพท์", "หน้าร้าน", "ออนไลน์"].map((c) => {
            const v = os
              .filter((o) => o.channel === c)
              .reduce((a, o) => a + sum(o), 0);
            return (
              <div key={c} className="channel-row">
                <span>{c}</span>
                <div className="progress">
                  <span
                    style={{ width: (total ? (v / total) * 100 : 0) + "%" }}
                  />
                </div>
                <strong>฿{money(v)}</strong>
              </div>
            );
          })}
          <p className="chart-caption">
            คำนวณจากคำสั่งซื้อที่ยืนยันแล้วและไม่ถูกยกเลิก
          </p>
        </Section>
      </div>
      <Section
        title="แผนเติมสินค้า 7 วัน"
        action={<Button onClick={() => go("suppliers")}>ดูใบสั่งซื้อ</Button>}
      >
        <p>คำนวณจากยอดขาย 30 วัน จำนวนขั้นต่ำ และระยะเวลานำส่งของผู้ขาย</p>
        <DataTable
          rows={s.products.map((p) => {
            const sold = os
                .filter((o) => days(o.date) < 30)
                .reduce(
                  (a, o) =>
                    a +
                    o.items
                      .filter((i) => i.pid === p.id)
                      .reduce((b, i) => b + i.qty, 0),
                  0,
                ),
              lead = s.suppliers.find((x) => x.id === p.supplier)?.lead || 3;
            return {
              ...p,
              sold,
              forecast: Math.ceil((sold / 30) * 7),
              recommend: Math.max(
                0,
                Math.ceil(p.min + (sold / 30) * lead - stock(s, p.id)),
              ),
            };
          })}
          columns={[
            { label: "สินค้า", cell: (p) => p.name },
            {
              label: "ขาย 30 วัน",
              align: "right",
              cell: (p) => p.sold + " " + p.unit,
              className: "secondary-column",
            },
            {
              label: "คาดว่าจะขาย 7 วัน",
              align: "right",
              cell: (p) => p.forecast + " " + p.unit,
            },
            {
              label: "พร้อมขาย",
              align: "right",
              cell: (p) => stock(s, p.id) + " " + p.unit,
            },
            {
              label: "แนะนำให้สั่งเพิ่ม",
              align: "right",
              cell: (p) => (
                <b className={p.recommend ? "warning-text" : ""}>
                  {p.recommend + " " + p.unit}
                </b>
              ),
            },
            {
              label: "",
              cell: (p) => (
                <Button small onClick={() => open("purchase", p.id)}>
                  สั่งเพิ่ม
                </Button>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
export function Delivery({ open }: { open: OpenForm }) {
  const { s } = useStore();
  return (
    <>
      <PageHeader
        title="การจัดส่ง"
        description={`${s.deliveries.filter((d) => d.status !== "จัดส่งสำเร็จ").length} งานยังไม่ส่งมอบ`}
        actions={
          <Button primary onClick={() => open("delivery")}>
            <Plus size={16} />
            จัดงานส่ง
          </Button>
        }
      />
      <DataTable
        rows={s.deliveries}
        onRow={(d) => open("delivery-detail", d.id)}
        empty={
          <Empty
            title="ยังไม่มีงานจัดส่ง"
            description="จัดสินค้าให้พร้อมส่งก่อนสร้างงานส่ง"
            action={
              <Button primary onClick={() => open("delivery")}>
                จัดงานส่ง
              </Button>
            }
          />
        }
        columns={[
          {
            label: "งานส่ง / คำสั่งซื้อ",
            cell: (d) => (
              <>
                <b>{d.id}</b>
                <small>{d.oid}</small>
              </>
            ),
          },
          {
            label: "ลูกค้า / ปลายทาง",
            cell: (d) => (
              <>
                {customer(s, s.orders.find((o) => o.id === d.oid)!.cid).name}
                <small>{d.address}</small>
              </>
            ),
          },
          {
            label: "ผู้ส่ง / ขนส่ง",
            cell: (d) => (
              <>
                {d.driver}
                <small>{d.carrier}</small>
              </>
            ),
            className: "secondary-column",
          },
          {
            label: "เลขติดตาม / กำหนดส่ง",
            cell: (d) => (
              <>
                {d.tracking}
                <small>{date(d.eta)}</small>
              </>
            ),
          },
          { label: "สถานะ", cell: (d) => <Badge>{d.status}</Badge> },
          {
            label: "",
            cell: (d) => (
              <Button
                small
                onClick={(e) => {
                  e.stopPropagation();
                  open("delivery-detail", d.id);
                }}
              >
                ติดตาม →
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
export function Suppliers({ open }: { open: OpenForm }) {
  const { s } = useStore();
  return (
    <>
      <PageHeader
        title="สั่งซื้อและผู้ขายสินค้า"
        description="สร้างใบสั่งซื้อและรับสินค้าตามใบสั่งเข้าคลัง"
        actions={
          <>
            <Button onClick={() => open("supplier")}>เพิ่มผู้ขาย</Button>
            <Button primary onClick={() => open("purchase")}>
              <Plus size={16} />
              สร้างใบสั่งซื้อ
            </Button>
          </>
        }
      />
      <Section title="ใบสั่งซื้อ">
        <DataTable
          rows={s.purchases}
          empty={
            <Empty
              title="ยังไม่มีใบสั่งซื้อ"
              action={
                <Button onClick={() => open("purchase")}>
                  สร้างใบสั่งซื้อ
                </Button>
              }
            />
          }
          columns={[
            {
              label: "เลขที่ / วันที่",
              cell: (p) => (
                <>
                  <b>{p.id}</b>
                  <small>{date(p.date)}</small>
                </>
              ),
            },
            {
              label: "ผู้ขาย / สินค้า",
              cell: (p) => (
                <>
                  {s.suppliers.find((x) => x.id === p.sid)?.name}
                  <small>{product(s, p.pid).name}</small>
                </>
              ),
            },
            {
              label: "จำนวน",
              align: "right",
              cell: (p) => p.qty + " " + product(s, p.pid).unit,
            },
            {
              label: "มูลค่า",
              align: "right",
              cell: (p) => "฿" + money(p.qty * p.cost),
            },
            { label: "สถานะ", cell: (p) => <Badge>{p.status}</Badge> },
            {
              label: "",
              cell: (p) =>
                p.status === "รอรับสินค้า" ? (
                  <Button small onClick={() => open("receive", p.id)}>
                    รับสินค้าเข้าคลัง
                  </Button>
                ) : null,
            },
          ]}
        />
      </Section>
      <Section title="ผู้ขายสินค้าให้ร้าน">
        <DataTable
          rows={s.suppliers}
          columns={[
            { label: "ผู้ขาย", cell: (x) => <b>{x.name}</b> },
            { label: "เบอร์โทร", cell: (x) => x.phone },
            { label: "ระยะเวลานำส่ง", cell: (x) => x.lead + " วัน" },
            {
              label: "",
              cell: (x) => (
                <Button small onClick={() => open("supplier", x.id)}>
                  แก้ไข
                </Button>
              ),
            },
          ]}
        />
      </Section>
    </>
  );
}
export function Service({ go, open }: { go: Navigate; open: OpenForm }) {
  const { s, change } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ยังไม่ปิด");
  return (
    <>
      <PageHeader
        title="ติดตามและบริการลูกค้า"
        description="ดูปัญหาที่ลูกค้าแจ้งและบันทึกผลการติดต่อ"
        actions={
          <>
            <Button onClick={() => open("survey")}>บันทึกความพึงพอใจ</Button>
            <Button primary onClick={() => open("contact")}>
              <Plus size={16} />
              บันทึกการติดต่อ
            </Button>
          </>
        }
      />
      <Section
        title="ลูกค้าที่ควรติดต่อกลับ"
        action={
          <Button small onClick={() => go("groups")}>
            ดูกลุ่มลูกค้า →
          </Button>
        }
      >
        {s.customers
          .filter((c) => group(s, c) === "ไม่ได้ซื้อนาน")
          .slice(0, 4)
          .map((c) => (
            <ActionRow
              key={c.id}
              title={c.name}
              detail={"ไม่ได้ซื้อ " + days(lastOrder(s, c.id)) + " วัน"}
              action="ดูประวัติและติดต่อ"
              onClick={() => go("crm", "", c.id)}
            />
          ))}
      </Section>
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ค้นหาลูกค้า / รายละเอียดการติดต่อ"
        />
        <Filters
          value={filter}
          onChange={setFilter}
          items={[
            { value: "ยังไม่ปิด", label: "ยังไม่ปิด" },
            { value: "ทั้งหมด", label: "ทั้งหมด" },
          ]}
        />
      </div>
      <DataTable
        rows={s.contacts.filter(
          (c) =>
            (filter === "ทั้งหมด" || !c.resolved) &&
            [customer(s, c.cid).name, c.text].join(" ").includes(search),
        )}
        columns={[
          {
            label: "ลูกค้า / วันที่",
            cell: (c) => (
              <>
                <button
                  className="text-link"
                  onClick={() => go("crm", "", c.cid)}
                >
                  {customer(s, c.cid).name}
                </button>
                <small>{date(c.date)}</small>
              </>
            ),
          },
          {
            label: "ช่องทาง",
            cell: (c) => c.channel,
            className: "secondary-column",
          },
          {
            label: "รายละเอียด",
            cell: (c) => (
              <>
                {c.text}
                <small>{c.kind}</small>
              </>
            ),
          },
          {
            label: "สถานะ",
            cell: (c) => <Badge>{c.resolved ? "ปิด" : "เปิด"}</Badge>,
          },
          {
            label: "",
            cell: (c) =>
              !c.resolved && (
                <Button
                  small
                  onClick={() =>
                    change("ปิดรายการติดตามแล้ว", (s) => {
                      s.contacts.find((x) => x.id === c.id)!.resolved = true;
                    })
                  }
                >
                  ติดตามเสร็จแล้ว
                </Button>
              ),
          },
        ]}
      />
      <Section title="ความคิดเห็นลูกค้า">
        <DataTable
          rows={s.surveys}
          columns={[
            {
              label: "ลูกค้า / วันที่",
              cell: (c) => (
                <>
                  {customer(s, c.cid).name}
                  <small>{date(c.date)}</small>
                </>
              ),
            },
            { label: "คะแนน", cell: (c) => c.score + " / 5" },
            { label: "ความคิดเห็น", cell: (c) => c.note },
          ]}
        />
      </Section>
    </>
  );
}
export function Team({ open }: { open: OpenForm }) {
  const { s } = useStore();
  return (
    <>
      <PageHeader
        title="พนักงานและการอบรม"
        description="กำหนดหน้าที่และตรวจประวัติการอบรม"
        actions={
          <Button primary onClick={() => open("user")}>
            <Plus size={16} />
            เพิ่มพนักงาน
          </Button>
        }
      />
      <DataTable
        rows={s.users}
        columns={[
          { label: "พนักงาน", cell: (u) => <b>{u.name}</b> },
          {
            label: "หน้าที่",
            cell: (u) => (u.role === "IT" ? "ผู้ดูแลระบบ" : u.role),
          },
          {
            label: "ใช้งานล่าสุด",
            cell: (u) => (u.last ? relative(u.last) : "ยังไม่มีประวัติ"),
          },
          {
            label: "สถานะ",
            cell: (u) => (
              <Badge>{u.active ? "พร้อมใช้งาน" : "พักการใช้งาน"}</Badge>
            ),
          },
          {
            label: "ผ่านการอบรม",
            cell: (u) =>
              u.training
                .map((t) => (t === "CRM" ? "ข้อมูลลูกค้า" : t))
                .join(" · ") || "ยังไม่ได้อบรม",
          },
          {
            label: "",
            cell: (u) => (
              <Button small onClick={() => open("user", u.id)}>
                แก้ไข
              </Button>
            ),
          },
        ]}
      />
      <div className="split-layout training-sections">
        <Section title="งานคลังสินค้า">
          <ol>
            <li>รับสินค้าและระบุวันหมดอายุ</li>
            <li>หยิบล็อตที่หมดอายุก่อนและยังขายได้</li>
            <li>ตรวจจำนวนจริงและบันทึกเมื่อไม่ตรงกับระบบ</li>
          </ol>
          <Button primary onClick={() => open("training", "stock")}>
            ทำแบบทดสอบ
          </Button>
        </Section>
        <Section title="การดูแลลูกค้า">
          <ol>
            <li>รับคำสั่งซื้อจากทุกช่องทางเข้าระบบ</li>
            <li>ตรวจประวัติซื้อและสิทธิส่วนลด</li>
            <li>บันทึกปัญหาและติดตามลูกค้าที่ไม่ได้ซื้อนาน</li>
          </ol>
          <Button primary onClick={() => open("training", "customer")}>
            ทำแบบทดสอบ
          </Button>
        </Section>
      </div>
      <details className="record-log">
        <summary>ประวัติการทำงาน</summary>
        {s.logs.slice(0, 30).map((l) => (
          <div key={l.id}>
            <small>
              {new Date(l.date).toLocaleString("th-TH-u-ca-gregory")}
            </small>
            <span>
              {l.user} · {l.text}
            </span>
          </div>
        ))}
      </details>
    </>
  );
}
export function Settings({ open, go }: { open: OpenForm; go: Navigate }) {
  const { s, change, replace, notify } = useStore();
  const [reset, setReset] = useState(false);
  return (
    <>
      <PageHeader
        title="ตั้งค่า"
        description="กำหนดการจัดสินค้า กลุ่มลูกค้า และแต้มสะสม"
      />
      <div className="notice">
        เวอร์ชันต้นแบบ · ข้อมูลเก็บเฉพาะเบราว์เซอร์นี้ ·
        ยังไม่มีการเข้าสู่ระบบหรือฐานข้อมูลกลาง
      </div>
      <div className="split-layout">
        <Section title="นโยบายการทำงาน">
          <SimpleForm
            label="บันทึกตั้งค่า"
            onSubmit={(f) => {
              if (+f.regularOrders <= +f.newOrders)
                throw Error("จำนวนครั้งลูกค้าประจำต้องมากกว่าเกณฑ์ลูกค้าใหม่");
              change("บันทึกตั้งค่าแล้ว", (s) => {
                s.settings.picking = f.picking as "FEFO" | "FIFO";
                for (const k of [
                  "inactiveDays",
                  "newOrders",
                  "regularOrders",
                  "loyaltyRate",
                  "referralPoints",
                ] as const)
                  s.settings[k] = Number(f[k]);
              });
            }}
          >
            <Field label="ลำดับการหยิบสินค้า">
              <select name="picking" defaultValue={s.settings.picking}>
                <option value="FEFO">ล็อตที่หมดอายุก่อน</option>
                <option value="FIFO">ล็อตที่รับเข้าก่อน</option>
              </select>
            </Field>
            <div className="form-grid">
              <Field label="ถือว่าไม่ได้ซื้อนานเมื่อเกิน (วัน)">
                <input
                  name="inactiveDays"
                  type="number"
                  min="1"
                  defaultValue={s.settings.inactiveDays}
                  required
                />
              </Field>
              <Field label="ลูกค้าใหม่ซื้อไม่เกิน (ครั้ง)">
                <input
                  name="newOrders"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={s.settings.newOrders}
                  required
                />
              </Field>
              <Field label="ลูกค้าประจำซื้อใน 90 วัน อย่างน้อย (ครั้ง)">
                <input
                  name="regularOrders"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={s.settings.regularOrders}
                  required
                />
              </Field>
              <Field label="ยอดซื้อกี่บาทต่อ 1 แต้ม">
                <input
                  name="loyaltyRate"
                  type="number"
                  min="1"
                  defaultValue={s.settings.loyaltyRate}
                  required
                />
              </Field>
              <Field label="แต้มสำหรับผู้แนะนำลูกค้า">
                <input
                  name="referralPoints"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={s.settings.referralPoints}
                  required
                />
              </Field>
            </div>
          </SimpleForm>
        </Section>
        <div>
          <Section title="การเชื่อมต่อจำลอง">
            <p>ไม่มีข้อมูลส่งไปยังบริการภายนอกจริง</p>
            {(["LINE", "IoT", "Delivery"] as const).map((k) => (
              <div key={k} className="connection-row">
                <div>
                  <b>
                    {k === "IoT"
                      ? "เครื่องวัดอุณหภูมิ"
                      : k === "Delivery"
                        ? "บริการขนส่ง"
                        : "LINE"}
                  </b>
                  <small>
                    {s.settings.connections[k]
                      ? "เปิดการจำลองอยู่"
                      : "หยุดการจำลอง"}
                  </small>
                </div>
                <Button
                  small
                  onClick={() =>
                    change("อัปเดตการเชื่อมต่อจำลองแล้ว", (s) => {
                      s.settings.connections[k] = !s.settings.connections[k];
                    })
                  }
                >
                  {s.settings.connections[k] ? "หยุดจำลอง" : "เปิดจำลอง"}
                </Button>
                <Button
                  small
                  onClick={() => k === "LINE" ? open("line-preview") :
                    notify(
                      s.settings.connections[k]
                        ? "ทดสอบสำเร็จในโหมดจำลอง"
                        : "เปิดการจำลองก่อนทดสอบ",
                    )
                  }
                >
                  ทดสอบ
                </Button>
              </div>
            ))}
            <div className="actions">
              <Button onClick={() => open("line-preview")}>ตัวอย่างแชต LINE</Button>
              <Button onClick={() => open("temperature")}>
                ส่งค่าอุณหภูมิจำลอง
              </Button>
              <Button onClick={() => go("online-order")}>
                ตัวอย่างคำสั่งซื้อออนไลน์
              </Button>
            </div>
          </Section>
          <Section title="ข้อมูลและการสำรอง">
            <p>
              แต่ละอุปกรณ์มีข้อมูลแยกกัน
              ส่งไฟล์สำรองเพื่อคัดลอกข้อมูลไปยังเครื่องอื่นได้
            </p>
            <div className="actions">
              <Button onClick={() => download("ศาศวัต-ข้อมูลสำรอง.json", s)}>
                <Download size={16} />
                ดาวน์โหลดข้อมูลสำรอง
              </Button>
              <Button onClick={() => open("import")}>นำเข้าข้อมูลสำรอง</Button>
              <Button danger onClick={() => setReset(true)}>
                รีเซ็ตข้อมูลตัวอย่าง
              </Button>
            </div>
            <p className="muted">
              การเลือกบทบาทเป็นการดูตัวอย่างหน้าจอ
              ไม่ใช่ระบบกำหนดสิทธิ์สำหรับใช้งานจริง
            </p>
          </Section>
        </div>
      </div>
      {reset && (
        <Modal title="รีเซ็ตข้อมูลตัวอย่าง?" onClose={() => setReset(false)}>
          <p>
            ข้อมูลที่ทดลองในเวอร์ชันนี้จะถูกแทนที่
            ดาวน์โหลดข้อมูลสำรองก่อนหากต้องการเก็บไว้
          </p>
          <div className="form-footer">
            <Button onClick={() => setReset(false)}>ยกเลิก</Button>
            <Button
              danger
              onClick={() => {
                replace(createSeed());
                notify("รีเซ็ตข้อมูลตัวอย่างแล้ว");
                setReset(false);
              }}
            >
              ยืนยันรีเซ็ตข้อมูล
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
