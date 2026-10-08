"use client";
import { useState } from "react";
import {
  Plus,
  ScanLine,
  ClipboardCheck,
  PackageMinus,
  ArrowDownToLine,
  Check,
  TriangleAlert,
} from "lucide-react";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  DataTable,
  Badge,
  SearchInput,
  Filters,
  Section,
  Empty,
  Field,
} from "./ui";
import {
  stock,
  product,
  money,
  date,
  days,
  TODAY,
  expiryText,
  suggestedLots,
} from "@/lib/domain";
import { Navigate, OpenForm } from "./orders";
export function Inventory({
  go,
  open,
  filter: initial = "",
}: {
  go: Navigate;
  open: OpenForm;
  filter?: string;
}) {
  const { s, role } = useStore();
  const canManage = role === "ผู้จัดการ" || role === "พนักงานคลัง";
  const [room, setRoom] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initial || "ทั้งหมด");
  const lots = s.lots
    .filter(
      (l) =>
        (!room || l.room === room) &&
        [
          product(s, l.pid).name,
          product(s, l.pid).sku,
          product(s, l.pid).barcode,
          l.code,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (filter === "ทั้งหมด" ||
          (filter === "ใกล้หมด" && stock(s, l.pid) < product(s, l.pid).min) ||
          (filter === "ใกล้หมดอายุ" &&
            l.expiry >= TODAY &&
            days(l.expiry) >= -14 &&
            l.qty > 0) ||
          (filter === "หมดอายุ" && l.expiry < TODAY && l.qty > 0)),
    )
    .sort(
      (a, b) => a.pid.localeCompare(b.pid) || a.expiry.localeCompare(b.expiry),
    );
  const low = s.products.filter((p) => stock(s, p.id) < p.min);
  const count = (f: string) =>
    f === "ทั้งหมด"
      ? s.products.length
      : f === "ใกล้หมด"
        ? low.length
        : s.lots.filter(
            (l) =>
              l.qty > 0 &&
              (f === "หมดอายุ"
                ? l.expiry < TODAY
                : l.expiry >= TODAY && days(l.expiry) >= -14),
          ).length;
  return (
    <>
      <PageHeader
        title="สินค้าและสต๊อก"
        description={`${s.products.length} ชนิดสินค้า · ${s.lots.length} ล็อต · ไม่รวมสินค้าหมดอายุในจำนวนพร้อมขาย`}
        actions={canManage &&
          <>
            <Button onClick={() => open("count")}>
              <ClipboardCheck size={16} />
              ตรวจนับ
            </Button>
            <Button primary onClick={() => open("receive")}>
              <Plus size={16} />
              รับสินค้าเข้า
            </Button>
          </>
        }
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ค้นหาสินค้า / รหัสสินค้า / บาร์โค้ด / ล็อต"
        />
        <Button onClick={() => open("barcode")}>
          <ScanLine size={16} />
          สแกนบาร์โค้ด
        </Button>
        {role === "ผู้จัดการ" && <Button onClick={() => open("product")}>เพิ่มสินค้า</Button>}
        <select aria-label="กรองห้องเก็บ" value={room} onChange={e => setRoom(e.target.value)}><option value="">ทุกห้องเก็บ</option>{s.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
      </div>
      <Filters
        value={filter}
        onChange={setFilter}
        items={["ทั้งหมด", "ใกล้หมด", "ใกล้หมดอายุ", "หมดอายุ"].map((x) => ({
          value: x,
          label: x,
          count: count(x),
        }))}
      />
      {filter === "หมดอายุ" && (
        <div className="notice warning">
          สินค้าหมดอายุถูกกันออกจากรายการพร้อมขายแล้ว
          บันทึกสินค้าเสียเพื่อตัดยอดออกจากคลัง
        </div>
      )}
      <DataTable
        rows={lots}
        onRow={(l) => open("lot", l.id)}
        columns={[
          {
            label: "สินค้า / รหัส",
            cell: (l) => {
              const p = product(s, l.pid),
                first =
                  lots.findIndex((x) => x.pid === l.pid) === lots.indexOf(l);
              return (
                <div className={first ? "" : "repeated-product"}>
                  <b>{p.name}</b>
                  <small>
                    {p.sku} · พร้อมขาย {money(stock(s, p.id))} {p.unit}
                  </small>
                </div>
              );
            },
          },
          {
            label: "ล็อต",
            cell: (l) => (
              <>
                <b>{l.code}</b>
                {suggestedLots(s, l.pid)[0]?.id === l.id && (
                  <small className="recommended">แนะนำให้หยิบก่อน</small>
                )}
              </>
            ),
          },
          {
            label: "คงเหลือ",
            align: "right",
            cell: (l) => (
              <strong>
                {money(l.qty)}{" "}
                <small className="inline-unit">{product(s, l.pid).unit}</small>
              </strong>
            ),
          },
          {
            label: "หมดอายุ",
            cell: (l) => (
              <>
                <span
                  className={
                    l.expiry < TODAY || days(l.expiry) >= -3
                      ? "danger-text"
                      : days(l.expiry) >= -14
                        ? "warning-text"
                        : ""
                  }
                >
                  {expiryText(l.expiry)}
                </span>
                <small>{date(l.expiry)}</small>
              </>
            ),
          },
          {
            label: "ห้องเย็น",
            cell: (l) => s.rooms.find((r) => r.id === l.room)?.name,
            className: "secondary-column",
          },
          {
            label: "สถานะ",
            cell: (l) =>
              l.qty === 0 ? (
                <span className="muted">ไม่มีคงเหลือ</span>
              ) : l.expiry < TODAY ? (
                <Badge tone="danger">หมดอายุแล้ว</Badge>
              ) : days(l.expiry) >= -14 ? (
                <Badge tone="warning">ใกล้หมดอายุ</Badge>
              ) : (
                <span className="quiet-status">
                  <span className="status-dot" />
                  ปกติ
                </span>
              ),
          },
          {
            label: "",
            cell: (l) => (
              <Button
                small
                onClick={(e) => {
                  e.stopPropagation();
                  open("lot", l.id);
                }}
              >
                ดูล็อต →
              </Button>
            ),
          },
        ]}
      />
      {low
        .filter((p) => !s.lots.some((l) => l.pid === p.id))
        .map((p) => (
          <div className="list-row" key={p.id}>
            <b>{p.name}</b>
            <span>ยังไม่มีสินค้าในคลัง</span>
            {canManage && <Button onClick={() => open("receive", p.id)}>รับสินค้าเข้า</Button>}
          </div>
        ))}
      <details className="stock-history">
        <summary>ประวัติสินค้าและการตรวจนับ</summary>
        <div className="split-layout">
          <Section title="การเคลื่อนไหวล่าสุด">
            <DataTable
              rows={s.movements.slice(0, 20)}
              empty={<Empty title="ยังไม่มีการรับหรือเบิกสินค้าในรอบนี้" />}
              columns={[
                {
                  label: "วันที่ / ล็อต",
                  cell: (m) => (
                    <>
                      {date(m.date)}
                      <small>{s.lots.find((l) => l.id === m.lot)?.code}</small>
                    </>
                  ),
                },
                { label: "รายการ", cell: (m) => m.kind },
                {
                  label: "จำนวน",
                  align: "right",
                  cell: (m) => (m.qty > 0 ? "+" : "") + money(m.qty),
                },
                { label: "เหตุผล", cell: (m) => m.reason },
              ]}
            />
          </Section>
          <Section title="ผลตรวจนับ">
            <DataTable
              rows={s.counts}
              columns={[
                {
                  label: "วันที่ / ล็อต",
                  cell: (c) => (
                    <>
                      {date(c.date)}
                      <small>{s.lots.find((l) => l.id === c.lot)?.code}</small>
                    </>
                  ),
                },
                { label: "ในระบบ", align: "right", cell: (c) => c.expected },
                { label: "นับจริง", align: "right", cell: (c) => c.actual },
                {
                  label: "ผลต่าง",
                  cell: (c) => (
                    <span
                      className={c.actual !== c.expected ? "warning-text" : ""}
                    >
                      {c.actual === c.expected
                        ? "ตรงกัน"
                        : money(c.actual - c.expected)}
                    </span>
                  ),
                },
              ]}
            />
          </Section>
        </div>
        <Section title="สินค้าเสียและหมดอายุ">
          <DataTable
            rows={s.waste}
            columns={[
              {
                label: "สินค้า",
                cell: (w) => (
                  <>
                    {product(s, w.pid).name}
                    <small>{date(w.date)}</small>
                  </>
                ),
              },
              {
                label: "จำนวน",
                align: "right",
                cell: (w) => w.qty + " " + product(s, w.pid).unit,
              },
              {
                label: "มูลค่า",
                align: "right",
                cell: (w) => "฿" + money(w.value),
              },
              { label: "สาเหตุ", cell: (w) => w.reason },
            ]}
          />
        </Section>
      </details>
    </>
  );
}
