"use client";
import { useState } from "react";
import { Plus, ArrowRight, Phone, MessageSquare } from "lucide-react";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  DataTable,
  Badge,
  SearchInput,
  Filters,
  Section,
  StatStrip,
  Empty,
  ActionRow,
} from "./ui";
import {
  customer,
  product,
  group,
  money,
  date,
  days,
  lastOrder,
  relative,
  ordersFor,
  sum,
  favorites,
  favoriteCategory,
  TODAY,
} from "@/lib/domain";
import { Navigate, OpenForm } from "./orders";
export function Customers({
  go,
  open,
  filter: initial = "",
}: {
  go: Navigate;
  open: OpenForm;
  filter?: string;
}) {
  const { s } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initial || "ทั้งหมด");
  const cs = s.customers.filter(
    (c) =>
      (filter === "ทั้งหมด" ||
        group(s, c) === filter ||
        (filter === "ซื้อสินค้าประเภทเดิม" && favoriteCategory(s, c.id))) &&
      [c.name, c.phone, c.area].join(" ").includes(search),
  );
  return (
    <>
      <PageHeader
        title="รายชื่อลูกค้า"
        description={`${s.customers.length} ราย · ดูประวัติการซื้อและบันทึกการติดต่อ`}
        actions={
          <Button primary onClick={() => open("customer")}>
            <Plus size={16} />
            เพิ่มลูกค้า
          </Button>
        }
      />
      <Filters
        value={filter}
        onChange={setFilter}
        items={[
          "ทั้งหมด",
          "ลูกค้าใหม่",
          "ลูกค้าประจำ",
          "ลูกค้าซื้อซ้ำ",
          "ไม่ได้ซื้อนาน",
        ].map((t) => ({
          label: t,
          value: t,
          count:
            t === "ทั้งหมด"
              ? s.customers.length
              : s.customers.filter((c) => group(s, c) === t).length,
        }))}
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ค้นหาชื่อร้าน / ชื่อลูกค้า / เบอร์โทร / จังหวัด"
        />
        <span className="result-count">{cs.length} ราย</span>
      </div>
      <DataTable
        rows={cs}
        onRow={(c) => go("crm", "", c.id)}
        empty={
          <Empty
            title="ไม่พบลูกค้า"
            action={
              <Button primary onClick={() => open("customer")}>
                เพิ่มลูกค้าใหม่
              </Button>
            }
          />
        }
        columns={[
          {
            label: "ลูกค้า / ติดต่อ",
            cell: (c) => (
              <>
                <button
                  className="text-link"
                  onClick={() => go("crm", "", c.id)}
                >
                  {c.name}
                </button>
                <small>{c.phone}</small>
              </>
            ),
          },
          {
            label: "ประเภท / จังหวัด",
            cell: (c) => (
              <>
                {c.type}
                <small>{c.area}</small>
              </>
            ),
            className: "secondary-column",
          },
          { label: "กลุ่มลูกค้า", cell: (c) => group(s, c) },
          {
            label: "ซื้อล่าสุด",
            cell: (c) => (
              <span title={date(lastOrder(s, c.id))}>
                {ordersFor(s, c.id).length
                  ? relative(lastOrder(s, c.id))
                  : "ยังไม่ได้ซื้อ"}
              </span>
            ),
          },
          {
            label: "ยอดซื้อรวม",
            align: "right",
            cell: (c) => (
              <>
                ฿{money(ordersFor(s, c.id).reduce((a, o) => a + sum(o), 0))}
                <small>{ordersFor(s, c.id).length} ครั้ง</small>
              </>
            ),
          },
          {
            label: "แต้ม",
            align: "right",
            cell: (c) => c.points,
            className: "secondary-column",
          },
          {
            label: "",
            cell: (c) => (
              <Button
                small
                onClick={(e) => {
                  e.stopPropagation();
                  go("crm", "", c.id);
                }}
              >
                ดูข้อมูล →
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}
export function CustomerDetail({
  id,
  go,
  open,
}: {
  id: string;
  go: Navigate;
  open: OpenForm;
}) {
  const { s } = useStore();
  const c = s.customers.find((c) => c.id === id);
  if (!c) return <Empty title="ไม่พบลูกค้า" />;
  const os = ordersFor(s, id),
    fav = favorites(s, id),
    inactive = group(s, c) === "ไม่ได้ซื้อนาน",
    category = favoriteCategory(s, id);
  return (
    <>
      <Button onClick={()=>go("line",id)}>ติดต่อทาง LINE</Button>
      <PageHeader
        title={c.name}
        description={`${c.phone} · ${c.type} · ${c.area}`}
        back={() => go("crm")}
        actions={
          <>
            <Button onClick={() => open("customer", id)}>แก้ไขข้อมูล</Button>
            <Button primary onClick={() => go("new-order", "", id)}>
              <Plus size={16} />
              สร้างคำสั่งซื้อ
            </Button>
          </>
        }
      />
      <div className="customer-tags">
        <span>{group(s, c)}</span>
        <span>{c.points} แต้มสะสม</span>
        {c.special > 0 && <span>ส่วนลดเฉพาะราย {c.special}%</span>}
      </div>
      <StatStrip
        items={[
          {
            label: "ยอดซื้อทั้งหมด",
            value: "฿" + money(os.reduce((a, o) => a + sum(o), 0)),
          },
          { label: "คำสั่งซื้อ", value: os.length + " ครั้ง" },
          {
            label: "ซื้อล่าสุด",
            value: os.length ? relative(lastOrder(s, id)) : "ยังไม่ได้ซื้อ",
          },
          { label: "ลูกค้าตั้งแต่", value: date(c.joined) },
        ]}
      />
      <Section title="สิ่งที่ควรรู้">
        <div className="customer-insights">
          {inactive ? (
            <ActionRow
              title={"ไม่ได้สั่งซื้อมานาน " + days(lastOrder(s, id)) + " วัน"}
              detail="ดูประวัติก่อนติดต่อและเสนอสินค้าที่ลูกค้าเคยซื้อ"
              severity="warning"
              action="สร้างโปรโมชั่นเรียกลูกค้ากลับมา"
              onClick={() => go("new-promotion", "winback", id)}
            />
          ) : category ? (
            <ActionRow
              title={"ซื้อสินค้าประเภท" + category + "เป็นประจำ"}
              detail={fav
                .slice(0, 3)
                .map((f) => f.product.name + " " + f.count + " ครั้ง")
                .join(" · ")}
              action={"สร้างโปรโมชั่นสินค้า" + category}
              onClick={() => go("new-promotion", category, id)}
            />
          ) : (
            <p>ยังไม่มีข้อมูลมากพอสำหรับแนะนำสินค้า ดูรายการซื้อด้านล่าง</p>
          )}
          {group(s, c) === "ลูกค้าประจำ" && (
            <ActionRow
              title="ลูกค้าประจำ"
              detail={"ปัจจุบันได้รับส่วนลด " + c.special + "%"}
              action="เสนอราคาพิเศษ"
              onClick={() => open("customer", id)}
            />
          )}
        </div>
      </Section>
      <div className="split-layout">
        <Section title="สินค้าที่ซื้อบ่อย">
          <DataTable
            rows={fav.map((f) => ({ ...f, id: f.product.id }))}
            columns={[
              { label: "สินค้า", cell: (f) => f.product.name },
              {
                label: "ความถี่",
                align: "right",
                cell: (f) => f.count + " ครั้ง",
              },
              {
                label: "รวมจำนวน",
                align: "right",
                cell: (f) => money(f.qty) + " " + f.product.unit,
              },
            ]}
          />
        </Section>
        <Section
          title="ข้อมูลติดต่อ"
          action={
            <Button small onClick={() => open("contact", id)}>
              บันทึกการติดต่อ
            </Button>
          }
        >
          <div className="contact-details">
            <div>
              <span>เบอร์โทร</span>
              <b>{c.phone}</b>
            </div>
            <div>
              <span>LINE</span>
              <b>{c.line || "ยังไม่ได้ระบุ"}</b>
            </div>
            <div>
              <span>ช่องทางประจำ</span>
              <b>{c.channel}</b>
            </div>
            <div>
              <span>หมายเหตุ</span>
              <p>{c.notes || "ไม่มีหมายเหตุ"}</p>
            </div>
          </div>
        </Section>
      </div>
      <Section title="ประวัติคำสั่งซื้อ">
        <DataTable
          rows={os}
          onRow={(o) => go("orders", "", o.id)}
          columns={[
            {
              label: "เลขที่",
              cell: (o) => (
                <button
                  className="text-link"
                  onClick={() => go("orders", "", o.id)}
                >
                  {o.id}
                </button>
              ),
            },
            {
              label: "วันที่ / ช่องทาง",
              cell: (o) => (
                <>
                  {date(o.date)}
                  <small>{o.channel}</small>
                </>
              ),
            },
            {
              label: "สินค้า",
              cell: (o) =>
                o.items.map((i) => product(s, i.pid).name).join(" · "),
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
        title="ประวัติการติดต่อ"
        action={
          <Button onClick={() => open("contact", id)}>บันทึกการติดต่อ</Button>
        }
      >
        {s.contacts.filter((x) => x.cid === id).length ? (
          s.contacts
            .filter((x) => x.cid === id)
            .map((n) => (
              <div key={n.id} className="contact-entry">
                <span>
                  {date(n.date)}
                  <small>
                    {n.channel} · {n.kind}
                  </small>
                </span>
                <p>{n.text}</p>
                <Badge>{n.resolved ? "ปิด" : "เปิด"}</Badge>
              </div>
            ))
        ) : (
          <Empty title="ยังไม่มีประวัติการติดต่อ" />
        )}
      </Section>
    </>
  );
}
export function Groups({ go }: { go: Navigate }) {
  const { s } = useStore();
  const groups = [
    "ลูกค้าใหม่",
    "ลูกค้าประจำ",
    "ลูกค้าซื้อซ้ำ",
    "ไม่ได้ซื้อนาน",
    "ซื้อสินค้าประเภทเดิม",
  ];
  const [selected, setSelected] = useState("ไม่ได้ซื้อนาน");
  const cs = s.customers.filter((c) =>
    selected === "ซื้อสินค้าประเภทเดิม"
      ? !!favoriteCategory(s, c.id)
      : group(s, c) === selected,
  );
  return (
    <>
      <PageHeader
        title="กลุ่มลูกค้า"
        description="จัดกลุ่มจากประวัติการซื้ออัตโนมัติ เพื่อเลือกคนที่จะติดต่อหรือส่งโปรโมชั่น"
        actions={
          <Button onClick={() => go("settings")}>ตั้งเกณฑ์กลุ่มลูกค้า</Button>
        }
      />
      <div className="groups-workspace">
        <div className="group-list">
          {groups.map((x) => (
            <button
              key={x}
              className={selected === x ? "selected" : ""}
              onClick={() => setSelected(x)}
            >
              <b>{x}</b>
              <span>
                {
                  s.customers.filter((c) =>
                    x === "ซื้อสินค้าประเภทเดิม"
                      ? !!favoriteCategory(s, c.id)
                      : group(s, c) === x,
                  ).length
                }{" "}
                ราย
              </span>
              <small>
                {x === "ลูกค้าใหม่"
                  ? "ซื้อไม่เกิน " + s.settings.newOrders + " ครั้ง"
                  : x === "ลูกค้าประจำ"
                    ? "ซื้ออย่างน้อย " +
                      s.settings.regularOrders +
                      " ครั้งใน 90 วัน"
                    : x === "ไม่ได้ซื้อนาน"
                      ? "ไม่ซื้อเกิน " + s.settings.inactiveDays + " วัน"
                      : x === "ซื้อสินค้าประเภทเดิม"
                        ? "ยอดซื้อส่วนใหญ่อยู่ในประเภทเดียวกัน"
                        : "กลับมาซื้อแต่ยังไม่ถึงเกณฑ์ลูกค้าประจำ"}
              </small>
            </button>
          ))}
        </div>
        <Section
          title={selected}
          action={
            <Button primary onClick={() => go("new-promotion", selected)}>
              สร้างโปรโมชั่นให้กลุ่มนี้
            </Button>
          }
        >
          <DataTable
            rows={cs}
            columns={[
              {
                label: "ลูกค้า",
                cell: (c) => (
                  <button
                    className="text-link"
                    onClick={() => go("crm", "", c.id)}
                  >
                    {c.name}
                  </button>
                ),
              },
              {
                label: "ซื้อล่าสุด",
                cell: (c) => relative(lastOrder(s, c.id)),
              },
              {
                label: "ซื้อบ่อย",
                cell: (c) => favoriteCategory(s, c.id) || "—",
              },
              {
                label: "ยอดซื้อ",
                align: "right",
                cell: (c) =>
                  "฿" +
                  money(ordersFor(s, c.id).reduce((a, o) => a + sum(o), 0)),
              },
            ]}
          />
        </Section>
      </div>
    </>
  );
}
