"use client";
import { useState } from "react";
import { Check, Printer, ArrowUpRight, ScanLine } from "lucide-react";
import { useStore } from "./store";
import {
  Button,
  Field,
  Modal,
  Drawer,
  SimpleForm,
  DataTable,
  Badge,
  Section,
  Empty,
  StatStrip,
} from "./ui";
import {
  State,
  Customer,
  Product,
  TODAY,
  uid,
  product,
  customer,
  stock,
  money,
  date,
  days,
  expiryText,
  relative,
  ordersFor,
  sum,
  group,
  recordTemperature,
  acknowledge,
  closeIncident,
  advanceOrder,
  validateState,
} from "@/lib/domain";
import { Navigate, OpenForm } from "./orders";
const opts = (xs: { id: string; name: string }[]) =>
  xs.map((x) => (
    <option key={x.id} value={x.id}>
      {x.name}
    </option>
  ));
const number = (v: string, min = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min) throw Error("จำนวนไม่ถูกต้อง");
  return n;
};
export function Forms({
  kind,
  id = "",
  close,
  open,
  go,
  onCreatedCustomer,
}: {
  kind: string;
  id?: string;
  close: () => void;
  open: OpenForm;
  go: Navigate;
  onCreatedCustomer?: (id: string) => void;
}) {
  const { s, change, role, notify, replace } = useStore();
  const [choice, setChoice] = useState(id);
  const [barcode, setBarcode] = useState("");
  const [importError, setImportError] = useState("");
  const [importData, setImportData] = useState<State | null>(null);
  const commit = (text: string, fn: (s: State) => void) => {
    if (change(text, fn)) close();
  };
  let title = "",
    body: React.ReactNode = null;
  let drawer = false;
  if (kind === "customer") {
    const c = s.customers.find((x) => x.id === id);
    title = c ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้า";
    body = (
      <SimpleForm
        onCancel={close}
        label="บันทึกลูกค้า"
        onSubmit={(f) => {
          const phone = f.phone.replace(/\D/g, "");
          if (!/^0\d{8,9}$/.test(phone))
            throw Error("ระบุเบอร์โทรที่ขึ้นต้นด้วย 0 จำนวน 9–10 หลัก");
          if (
            s.customers.some(
              (x) => x.phone.replace(/\D/g, "") === phone && x.id !== id,
            )
          )
            throw Error("เบอร์โทรนี้มีในระบบแล้ว");
          const special = number(f.special);
          if (special > 100) throw Error("ส่วนลดต้องไม่เกิน 100%");
          commit("บันทึกข้อมูลลูกค้าแล้ว", (s) => {
            const values = {
              name: f.name.trim(),
              phone,
              type: f.type,
              area: f.area,
              channel: f.channel,
              line: f.line,
              notes: f.notes,
              special,
              referrer: f.referrer,
            };
            if (c)
              Object.assign(
                s.customers.find((x) => x.id === id)!,
                values,
              );
            else {
              const cid = uid("C");
              s.customers.push({
                ...values,
                id: cid,
                joined: TODAY,
                points: 0,
              });
              onCreatedCustomer?.(cid);
              if (f.referrer)
                customer(s, f.referrer).points += s.settings.referralPoints;
            }
          });
        }}
      >
        <div className="form-grid">
          <Field label="ชื่อ / ชื่อร้าน" required>
            <input
              name="name"
              defaultValue={c?.name}
              required
              autoFocus
              maxLength={100}
            />
          </Field>
          <Field label="เบอร์โทรศัพท์" required>
            <input
              name="phone"
              type="tel"
              defaultValue={c?.phone}
              required
              inputMode="tel"
            />
          </Field>
          <Field label="ประเภทลูกค้า">
            <select name="type" defaultValue={c?.type || "ร้านอาหาร"}>
              <option>ร้านอาหาร</option>
              <option>ค้าส่ง</option>
              <option>ค้าปลีก</option>
            </select>
          </Field>
          <Field label="จังหวัด" required>
            <input name="area" defaultValue={c?.area || "มุกดาหาร"} required />
          </Field>
          <Field label="ช่องทางประจำ">
            <select name="channel" defaultValue={c?.channel || "LINE"}>
              <option>LINE</option>
              <option>โทรศัพท์</option>
              <option>หน้าร้าน</option>
              <option>ออนไลน์</option>
            </select>
          </Field>
          <Field label="LINE">
            <input name="line" defaultValue={c?.line} />
          </Field>
          <Field label="ส่วนลดเฉพาะราย (%)">
            <input
              name="special"
              type="number"
              min="0"
              max="100"
              defaultValue={c?.special || 0}
              required
            />
          </Field>
          <Field label="ผู้แนะนำลูกค้า">
            <select name="referrer" defaultValue={c?.referrer || ""}>
              <option value="">ไม่มี</option>
              {opts(s.customers.filter((x) => x.id !== id))}
            </select>
          </Field>
        </div>
        <Field label="หมายเหตุ">
          <textarea name="notes" defaultValue={c?.notes} />
        </Field>
      </SimpleForm>
    );
  }
  if (kind === "product") {
    const p = s.products.find((x) => x.id === id);
    title = p ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) => {
          if (
            s.products.some(
              (x) =>
                (x.barcode === f.barcode || x.sku === f.sku) && x.id !== id,
            )
          )
            throw Error("รหัสสินค้าหรือบาร์โค้ดซ้ำ");
          commit("บันทึกสินค้าแล้ว", (s) => {
            const values = {
              name: f.name,
              sku: f.sku,
              barcode: f.barcode,
              category: f.category,
              unit: f.unit,
              price: number(f.price, 0.01),
              cost: number(f.cost),
              min: number(f.min),
              supplier: f.supplier,
            };
            if (p) Object.assign(product(s, id), values);
            else s.products.push({ ...values, id: uid("P") });
          });
        }}
      >
        <div className="form-grid">
          <Field label="ชื่อสินค้า" required>
            <input name="name" defaultValue={p?.name} required />
          </Field>
          <Field label="รหัสสินค้า" required>
            <input name="sku" defaultValue={p?.sku} required />
          </Field>
          <Field label="บาร์โค้ด" required>
            <input name="barcode" defaultValue={p?.barcode} required />
          </Field>
          <Field label="ประเภทสินค้า">
            <select name="category" defaultValue={p?.category || "ไก่"}>
              {["ไก่", "หมู", "ปลา", "อาหารทะเล", "อาหารแช่แข็ง"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="หน่วย">
            <select name="unit" defaultValue={p?.unit || "กก."}>
              <option>กก.</option>
              <option>แพ็ก</option>
              <option>กล่อง</option>
            </select>
          </Field>
          <Field label="ราคาขายต่อหน่วย" required>
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={p?.price}
              required
            />
          </Field>
          <Field label="ต้นทุนต่อหน่วย" required>
            <input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={p?.cost || 0}
              required
            />
          </Field>
          <Field label="จำนวนขั้นต่ำ" required>
            <input
              name="min"
              type="number"
              min="0"
              step="0.01"
              defaultValue={p?.min || 40}
              required
            />
          </Field>
          <Field label="ผู้ขายสินค้าให้ร้าน">
            <select name="supplier" defaultValue={p?.supplier}>
              {opts(s.suppliers)}
            </select>
          </Field>
        </div>
      </SimpleForm>
    );
  }
  if (kind === "receive") {
    const po = s.purchases.find((x) => x.id === id);
    const pid =
      po?.pid || s.products.find((p) => p.id === id)?.id || s.products[0].id;
    const selectedProduct =
      s.products.find((p) => p.id === choice) || product(s, pid);
    title = po ? "รับสินค้าตามใบสั่งซื้อ " + po.id : "รับสินค้าเข้าคลัง";
    body = (
      <SimpleForm
        label="บันทึกสินค้าเข้า"
        onCancel={close}
        onSubmit={(f) => {
          if (f.expiry < TODAY || f.expiry < f.received)
            throw Error("วันหมดอายุต้องไม่ก่อนวันที่รับหรือวันนี้");
          if (f.received > TODAY) throw Error("วันที่รับต้องไม่เกินวันนี้");
          if (s.lots.some((l) => l.code === f.code))
            throw Error("รหัสล็อตนี้มีในระบบแล้ว");
          const qty = number(f.qty, 0.01);
          if (po && qty !== po.qty) throw Error("จำนวนรับต้องตรงกับใบสั่งซื้อ");
          commit("รับสินค้าเข้าคลังแล้ว", (s) => {
            const l = {
              id: uid("L"),
              pid: po?.pid || f.pid,
              qty,
              code: f.code,
              room: f.room,
              received: f.received,
              expiry: f.expiry,
            };
            s.lots.push(l);
            s.movements.unshift({
              id: uid("MV"),
              date: TODAY,
              lot: l.id,
              qty,
              kind: "รับสินค้าเข้า",
              reason: po ? "ตามใบสั่งซื้อ " + po.id : "รับสินค้าจากผู้ขาย",
            });
            if (po)
              s.purchases.find((x) => x.id === po.id)!.status = "รับสินค้าแล้ว";
          });
        }}
      >
        <div className="form-grid">
          <Field label="สินค้า">
            <select
              name="pid"
              value={selectedProduct.id}
              onChange={(e) => setChoice(e.target.value)}
              disabled={!!po}
            >
              {opts(s.products)}
            </select>
          </Field>
          <Field label={"จำนวน (" + selectedProduct.unit + ")"} required>
            <input
              name="qty"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={po?.qty || 50}
              required
            />
          </Field>
          <Field label="รหัสล็อต" required>
            <input name="code" placeholder="เช่น LOT-A032" required />
          </Field>
          <Field label="ห้องเย็น">
            <select
              name="room"
              key={selectedProduct.id}
              defaultValue={
                s.lots.find((l) => l.pid === selectedProduct.id)?.room ||
                s.rooms[0].id
              }
            >
              {opts(s.rooms)}
            </select>
          </Field>
          <Field label="วันที่รับ" required>
            <input
              name="received"
              type="date"
              max={TODAY}
              defaultValue={TODAY}
              required
            />
          </Field>
          <Field label="วันหมดอายุ" required>
            <input name="expiry" type="date" min={TODAY} required />
          </Field>
        </div>
      </SimpleForm>
    );
  }
  if (kind === "lot") {
    const l = s.lots.find((x) => x.id === id)!;
    const p = product(s, l.pid);
    title = p.name;
    drawer = true;
    body = (
      <>
        <div className="record-heading">
          <b>{l.code}</b>
          <Badge>
            {l.expiry < TODAY
              ? "หมดอายุแล้ว"
              : days(l.expiry) >= -14
                ? "ใกล้หมดอายุ"
                : "ปกติ"}
          </Badge>
        </div>
        <StatStrip
          items={[
            { label: "คงเหลือล็อตนี้", value: l.qty + " " + p.unit },
            { label: "หมดอายุ", value: expiryText(l.expiry) },
          ]}
        />
        <div className="contact-details">
          <div>
            <span>วันหมดอายุ</span>
            <b>{date(l.expiry)}</b>
          </div>
          <div>
            <span>รับเข้า</span>
            <b>{date(l.received)}</b>
          </div>
          <div>
            <span>ห้องเย็น</span>
            <b>{s.rooms.find((r) => r.id === l.room)?.name}</b>
          </div>
          <div>
            <span>บาร์โค้ด</span>
            <b>{p.barcode}</b>
          </div>
        </div>
        <div className="actions">
          <Button
            primary
            disabled={l.expiry < TODAY || l.qty <= 0}
            onClick={() => open("issue", l.id)}
          >
            เบิกสินค้า
          </Button>
          <Button onClick={() => open("adjust", l.id)}>ปรับจำนวน</Button>
          <Button onClick={() => open("count", l.id)}>ตรวจนับ</Button>
          <Button danger onClick={() => open("waste", l.id)}>
            บันทึกสินค้าเสีย
          </Button>
          <Button onClick={() => open("product", p.id)}>แก้ไขสินค้า</Button>
        </div>
        <Section title="ล็อตอื่นของสินค้านี้">
          <DataTable
            rows={s.lots.filter((x) => x.pid === p.id && x.id !== id)}
            columns={[
              { label: "ล็อต", cell: (l) => l.code },
              { label: "คงเหลือ", cell: (l) => l.qty + " " + p.unit },
              { label: "หมดอายุ", cell: (l) => expiryText(l.expiry) },
            ]}
          />
        </Section>
      </>
    );
  }
  if (["issue", "waste", "adjust", "count"].includes(kind)) {
    const defaultLot =
      s.lots.find((l) => l.id === choice) ||
      s.lots.find((l) => l.id === id) ||
      s.lots[0];
    const linkedIncident = s.incidents.find((i) => i.id === id);
    const available = s.lots.filter((l) =>
      kind === "issue"
        ? l.qty > 0 && l.expiry >= TODAY
        : kind === "waste"
          ? l.qty > 0 && (!linkedIncident || l.room === linkedIncident.room)
          : true,
    );
    const l =
      available.find((l) => l.id === choice) ||
      available.find((l) => l.id === id) ||
      available[0];
    title =
      kind === "issue"
        ? "เบิกสินค้า"
        : kind === "waste"
          ? "บันทึกสินค้าเสีย / หมดอายุ"
          : kind === "adjust"
            ? "ปรับจำนวนสินค้า"
            : "ตรวจนับสินค้า";
    if (!l) body = <Empty title="ไม่มีล็อตสินค้าที่ใช้ได้" />;
    else
      body = (
        <SimpleForm
          label={
            kind === "count"
              ? "บันทึกผลตรวจนับ"
              : kind === "adjust"
                ? "ยืนยันปรับจำนวน"
                : "บันทึกและตัดสต๊อก"
          }
          onCancel={close}
          onSubmit={(f) => {
            const lot = s.lots.find((x) => x.id === f.lot)!;
            const qty = number(
              f.qty,
              kind === "issue" || kind === "waste" ? 0.01 : 0,
            );
            if (["issue", "waste"].includes(kind) && qty > lot.qty)
              throw Error(
                "จำนวนมากกว่าคงเหลือล็อตนี้ (" +
                  lot.qty +
                  " " +
                  product(s, lot.pid).unit +
                  ")",
              );
            if (kind === "issue" && lot.expiry < TODAY)
              throw Error("ล็อตหมดอายุแล้ว เบิกขายไม่ได้");
            if (!f.reason?.trim()) throw Error("ระบุเหตุผลก่อนบันทึก");
            commit(
              kind === "count"
                ? "บันทึกผลตรวจนับแล้ว"
                : kind === "adjust"
                  ? "ปรับจำนวนแล้ว"
                  : "บันทึกและตัดสต๊อกแล้ว",
              (s) => {
                const lot = s.lots.find((x) => x.id === f.lot)!,
                  before = lot.qty;
                if (kind === "count") {
                  s.counts.unshift({
                    id: uid("CC"),
                    date: TODAY,
                    lot: lot.id,
                    expected: before,
                    actual: qty,
                    reason: f.reason,
                  });
                  if (f.adjust) lot.qty = qty;
                } else if (kind === "adjust") lot.qty = qty;
                else lot.qty = Math.round((lot.qty - qty) * 100) / 100;
                if (kind === "waste")
                  s.waste.unshift({
                    id: uid("W"),
                    date: TODAY,
                    lot: lot.id,
                    pid: lot.pid,
                    qty,
                    value: number(f.value),
                    reason: f.reason,
                    incident: f.incident || "",
                  });
                s.movements.unshift({
                  id: uid("MV"),
                  date: TODAY,
                  lot: lot.id,
                  qty: lot.qty - before,
                  kind:
                    kind === "issue"
                      ? "เบิกสินค้า"
                      : kind === "waste"
                        ? "สินค้าเสีย"
                        : kind === "count"
                          ? "ตรวจนับ"
                          : "ปรับจำนวน",
                  reason: f.reason,
                });
              },
            );
          }}
        >
          <Field label="ล็อตสินค้า">
            <select
              name="lot"
              value={l.id}
              onChange={(e) => setChoice(e.target.value)}
            >
              {available.map((l) => (
                <option key={l.id} value={l.id}>
                  {product(s, l.pid).name} · {l.code}
                </option>
              ))}
            </select>
          </Field>
          <div className="notice">
            คงเหลือ {l.qty} {product(s, l.pid).unit} · {expiryText(l.expiry)}
          </div>
          <Field
            label={
              (kind === "count"
                ? "จำนวนที่นับได้"
                : kind === "adjust"
                  ? "จำนวนคงเหลือใหม่"
                  : "จำนวนที่ต้องการตัด") +
              " (" +
              product(s, l.pid).unit +
              ")"
            }
            required
          >
            <input
              key={l.id}
              name="qty"
              type="number"
              min={kind === "count" || kind === "adjust" ? 0 : 0.01}
              max={kind === "issue" || kind === "waste" ? l.qty : undefined}
              step="0.01"
              required
              defaultValue={kind === "adjust" ? l.qty : undefined}
            />
          </Field>
          {kind === "count" && (
            <label className="check-row">
              <input type="checkbox" name="adjust" />
              ปรับยอดในระบบให้ตรงกับที่นับจริง
            </label>
          )}
          {kind === "waste" && (
            <>
              <Field label="มูลค่าความเสียหาย (บาท)" required>
                <input
                  name="value"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </Field>
              <Field label="เหตุการณ์ที่เกี่ยวข้อง">
                <select name="incident" defaultValue={linkedIncident?.id || ""}>
                  <option value="">ไม่มี</option>
                  {s.incidents.map((i) => (
                    <option key={i.id} value={i.id}>
                      {s.rooms.find((r) => r.id === i.room)?.name} · {i.id}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field
            label="เหตุผล"
            required
            hint={
              kind === "issue"
                ? "ใช้กับการเบิกที่ไม่ใช่คำสั่งซื้อ การขายควรสร้างคำสั่งซื้อเพื่อบันทึกประวัติลูกค้า"
                : undefined
            }
          >
            <select name="reason" required defaultValue="">
              <option value="" disabled>
                เลือกเหตุผล
              </option>
              {(kind === "waste"
                ? [
                    "หมดอายุ",
                    "อุณหภูมิผิดปกติ",
                    "บรรจุภัณฑ์เสียหาย",
                    "คุณภาพไม่ผ่าน",
                  ]
                : kind === "issue"
                  ? ["ใช้ภายในร้าน", "ตัวอย่างสินค้า", "อื่น ๆ"]
                  : [
                      "ตรวจนับแล้วไม่ตรง",
                      "สินค้าเสีย",
                      "สินค้าหมดอายุ",
                      "อื่น ๆ",
                    ]
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </SimpleForm>
      );
  }
  if (kind === "barcode") {
    title = "สแกนบาร์โค้ด";
    const matches = s.products.filter((p) => p.barcode === barcode);
    body = (
      <>
        <p>พิมพ์หรือวางบาร์โค้ดเพื่อทดลองสแกน ไม่ต้องเปิดกล้อง</p>
        <Field label="บาร์โค้ด">
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.trim())}
            placeholder={"เช่น " + s.products[2].barcode}
            autoFocus
          />
        </Field>
        {matches.map((p) => (
          <Section key={p.id} title={p.name}>
            <p>
              พร้อมขาย {stock(s, p.id)} {p.unit}
            </p>
            <DataTable
              rows={s.lots.filter((l) => l.pid === p.id)}
              columns={[
                {
                  label: "ล็อต",
                  cell: (l) => (
                    <button
                      className="text-link"
                      onClick={() => open("lot", l.id)}
                    >
                      {l.code}
                    </button>
                  ),
                },
                { label: "คงเหลือ", cell: (l) => l.qty + " " + p.unit },
                { label: "หมดอายุ", cell: (l) => expiryText(l.expiry) },
              ]}
            />
          </Section>
        ))}
        {barcode && !matches.length && (
          <Empty
            title="ไม่พบสินค้าสำหรับบาร์โค้ดนี้"
            description="ตรวจเลขบาร์โค้ดอีกครั้ง"
          />
        )}
      </>
    );
  }
  if (kind === "temperature") {
    title = "จำลองอุณหภูมิผิดปกติ";
    body = (
      <SimpleForm
        label="ส่งค่าอุณหภูมิจำลอง"
        onCancel={close}
        onSubmit={(f) =>
          commit("อัปเดตอุณหภูมิและสร้างการแจ้งเตือนแล้ว", (s) =>
            recordTemperature(
              s,
              s.rooms.find((r) => r.id === f.room)!,
              number(f.temp, -60),
              number(f.latency),
            ),
          )
        }
      >
        <Field label="ห้องเย็น">
          <select name="room" defaultValue={id || s.rooms[0].id}>
            {opts(s.rooms)}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="อุณหภูมิ (°C)" required>
            <input
              name="temp"
              type="number"
              min="-60"
              max="40"
              step="0.1"
              defaultValue="-10"
              required
            />
          </Field>
          <Field label="เวลาแจ้งเตือนหลังตรวจพบ (วินาที)" required>
            <input
              name="latency"
              type="number"
              min="0"
              max="3600"
              defaultValue="35"
              required
            />
          </Field>
        </div>
        <div className="notice">
          เมื่อค่าเกินช่วงที่กำหนด ระบบจะสร้างเหตุการณ์และการแจ้งเตือนให้ทันที
        </div>
      </SimpleForm>
    );
  }
  if (kind === "incident") {
    const i = s.incidents.find((x) => x.id === id)!,
      r = s.rooms.find((r) => r.id === i.room)!;
    title = "ตรวจสอบเหตุการณ์ · " + r.name;
    drawer = true;
    body = (
      <>
        <div className="record-heading">
          <b className="danger-text">ตรวจพบ {i.temp}°C</b>
          <Badge>{i.status}</Badge>
        </div>
        <p>
          ช่วงที่กำหนด {r.min} ถึง {r.max}°C
        </p>
        <div className="incident-timeline">
          <div>
            <span>ตรวจพบ</span>
            <b>{new Date(i.detected).toLocaleString("th-TH-u-ca-gregory")}</b>
          </div>
          <div>
            <span>แจ้งเตือน</span>
            <b>{new Date(i.notified).toLocaleString("th-TH-u-ca-gregory")}</b>
            <small>
              ใช้เวลา {(Date.parse(i.notified) - Date.parse(i.detected)) / 1000}{" "}
              วินาที
            </small>
          </div>
          <div>
            <span>รับทราบ</span>
            <b>
              {i.acknowledged
                ? new Date(i.acknowledged).toLocaleString("th-TH-u-ca-gregory")
                : "ยังไม่มีผู้รับทราบ"}
            </b>
            <small>{i.assigned}</small>
          </div>
          {i.closed && (
            <div>
              <span>ปิดเหตุการณ์</span>
              <b>{new Date(i.closed).toLocaleString("th-TH-u-ca-gregory")}</b>
            </div>
          )}
        </div>
        {i.status === "เปิด" && (
          <Button
            primary
            onClick={() =>
              change("รับทราบเหตุการณ์แล้ว", (s) =>
                acknowledge(
                  s.incidents.find((x) => x.id === id)!,
                  role,
                ),
              )
            }
          >
            รับทราบและรับผิดชอบ
          </Button>
        )}
        {i.status !== "ปิด" ? (
          <>
            <Section title="ผลการตรวจสอบ">
              <p>อุณหภูมิปัจจุบัน {r.temp}°C</p>
              {(r.temp > r.max || r.temp < r.min) && (
                <Button
                  onClick={() =>
                    change("บันทึกค่าอุณหภูมิปกติจำลองแล้ว", (s) =>
                      recordTemperature(
                        s,
                        s.rooms.find((x) => x.id === r.id)!,
                        (r.min + r.max) / 2,
                      ),
                    )
                  }
                >
                  จำลองหลังแก้ไข: อุณหภูมิกลับปกติ
                </Button>
              )}
              <SimpleForm
                label="บันทึกและปิดเหตุการณ์"
                onSubmit={(f) => {
                  if (i.status === "เปิด")
                    throw Error("รับทราบเหตุการณ์ก่อนบันทึกผล");
                  commit("บันทึกผลและปิดเหตุการณ์แล้ว", (s) =>
                    closeIncident(
                      s,
                      s.incidents.find((x) => x.id === id)!,
                      f.note,
                    ),
                  );
                }}
              >
                <Field label="ผลการตรวจสอบ / วิธีแก้ไข" required>
                  <textarea name="note" defaultValue={i.note} required />
                </Field>
              </SimpleForm>
            </Section>
            <Button danger onClick={() => open("waste", i.id)}>
              บันทึกสินค้าเสียที่เกี่ยวข้อง
            </Button>
          </>
        ) : (
          <Section title="ผลการตรวจสอบ">
            <p>{i.note}</p>
          </Section>
        )}
      </>
    );
  }
  if (kind === "room") {
    const r = s.rooms.find((x) => x.id === id)!;
    title = "ตั้งเกณฑ์ · " + r.name;
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) => {
          const min = number(f.min, -60),
            max = number(f.max, -60);
          if (min >= max) throw Error("ค่าต่ำสุดต้องน้อยกว่าค่าสูงสุด");
          if (max > 40) throw Error("ค่าสูงสุดต้องไม่เกิน 40°C");
          commit("บันทึกเกณฑ์อุณหภูมิแล้ว", (s) => {
            const r = s.rooms.find((x) => x.id === id)!;
            r.min = min;
            r.max = max;
            recordTemperature(s, r, r.temp);
          });
        }}
      >
        <Field label="อุณหภูมิต่ำสุด (°C)">
          <input
            name="min"
            type="number"
            min="-60"
            max="40"
            step="0.1"
            defaultValue={r.min}
            required
          />
        </Field>
        <Field label="อุณหภูมิสูงสุด (°C)">
          <input
            name="max"
            type="number"
            min="-60"
            max="40"
            step="0.1"
            defaultValue={r.max}
            required
          />
        </Field>
        <p>เกณฑ์นี้เป็นข้อมูลตัวอย่าง ต้องปรับให้ตรงกับสินค้าก่อนใช้งานจริง</p>
      </SimpleForm>
    );
  }
  if (kind === "contact") {
    title = "บันทึกการติดต่อ";
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) =>
          commit("บันทึกการติดต่อแล้ว", (s) =>
            s.contacts.unshift({
              id: uid("N"),
              cid: f.cid,
              date: TODAY,
              channel: f.channel,
              text: f.text,
              kind: f.kind,
              resolved: !!f.resolved,
            }),
          )
        }
      >
        <Field label="ลูกค้า">
          <select name="cid" defaultValue={id}>
            {opts(s.customers)}
          </select>
        </Field>
        <div className="form-grid">
          <Field label="ช่องทาง">
            <select name="channel">
              <option>LINE</option>
              <option>โทรศัพท์</option>
              <option>หน้าร้าน</option>
            </select>
          </Field>
          <Field label="ประเภทการติดต่อ">
            <select name="kind">
              <option>ติดต่อ</option>
              <option>ติดตามลูกค้า</option>
              <option>เสนอสินค้า</option>
              <option>ปัญหา</option>
            </select>
          </Field>
        </div>
        <Field label="รายละเอียด" required>
          <textarea name="text" required />
        </Field>
        <label className="check-row">
          <input type="checkbox" name="resolved" defaultChecked />
          ติดตามเสร็จแล้ว
        </label>
      </SimpleForm>
    );
  }
  if (kind === "redeem") {
    title = "แลกแต้มสะสม";
    body = (
      <SimpleForm
        onCancel={close}
        label="ยืนยันแลกแต้ม"
        onSubmit={(f) => {
          const points = number(f.points, 1);
          if (!Number.isInteger(points)) throw Error("ระบุแต้มเป็นจำนวนเต็ม");
          if (points > customer(s, f.cid).points)
            throw Error("แต้มสะสมไม่เพียงพอ");
          commit("แลกแต้มและบันทึกสิทธิแล้ว", (s) => {
            customer(s, f.cid).points -= points;
            s.contacts.unshift({
              id: uid("N"),
              cid: f.cid,
              date: TODAY,
              channel: "หน้าร้าน",
              text: "แลก " + points + " แต้ม: " + f.reward,
              kind: "แลกแต้ม",
              resolved: true,
            });
          });
        }}
      >
        <Field label="ลูกค้า">
          <select name="cid" defaultValue={id}>
            {s.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.points} แต้ม
              </option>
            ))}
          </select>
        </Field>
        <Field label="แต้มที่ใช้" required>
          <input name="points" type="number" min="1" step="1" required />
        </Field>
        <Field label="สิทธิที่มอบให้ลูกค้า" required>
          <input name="reward" placeholder="เช่น รับถุงเก็บความเย็น" required />
        </Field>
      </SimpleForm>
    );
  }
  if (kind === "purchase") {
    const p =
      s.products.find((x) => x.id === choice) ||
      s.products.find((x) => x.id === id) ||
      s.products[0];
    title = "สร้างใบสั่งซื้อ";
    body = (
      <SimpleForm
        onCancel={close}
        label="สร้างใบสั่งซื้อ"
        onSubmit={(f) =>
          commit("สร้างใบสั่งซื้อแล้ว", (s) =>
            s.purchases.unshift({
              id: uid("PO"),
              date: TODAY,
              pid: f.pid,
              sid: f.sid,
              qty: number(f.qty, 0.01),
              cost: number(f.cost, 0.01),
              eta: f.eta,
              status: "รอรับสินค้า",
            }),
          )
        }
      >
        <Field label="สินค้า">
          <select
            name="pid"
            value={p.id}
            onChange={(e) => setChoice(e.target.value)}
          >
            {opts(s.products)}
          </select>
        </Field>
        <Field label="ผู้ขายสินค้าให้ร้าน">
          <select name="sid" key={p.id} defaultValue={p.supplier}>
            {opts(s.suppliers)}
          </select>
        </Field>
        <div className="form-grid">
          <Field label={"จำนวน (" + p.unit + ")"} required>
            <input
              name="qty"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue="100"
              required
            />
          </Field>
          <Field label="ต้นทุนต่อหน่วย" required>
            <input
              name="cost"
              key={p.id}
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={p.cost}
              required
            />
          </Field>
        </div>
        <Field label="วันที่คาดว่าจะรับ" required>
          <input
            name="eta"
            type="date"
            min={TODAY}
            defaultValue="2026-10-07"
            required
          />
        </Field>
      </SimpleForm>
    );
  }
  if (kind === "supplier") {
    const supplier = s.suppliers.find((x) => x.id === id);
    title = supplier ? "แก้ไขผู้ขาย" : "เพิ่มผู้ขายสินค้าให้ร้าน";
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) =>
          commit("บันทึกข้อมูลผู้ขายแล้ว", (s) => {
            const v = { name: f.name, phone: f.phone, lead: number(f.lead, 1) };
            if (supplier)
              Object.assign(
                s.suppliers.find((x) => x.id === id)!,
                v,
              );
            else s.suppliers.push({ ...v, id: uid("S") });
          })
        }
      >
        <Field label="ชื่อผู้ขาย" required>
          <input name="name" defaultValue={supplier?.name} required />
        </Field>
        <Field label="เบอร์โทร" required>
          <input
            name="phone"
            type="tel"
            defaultValue={supplier?.phone}
            required
          />
        </Field>
        <Field label="ระยะเวลานำส่ง (วัน)" required>
          <input
            name="lead"
            type="number"
            min="1"
            defaultValue={supplier?.lead || 3}
            required
          />
        </Field>
      </SimpleForm>
    );
  }
  if (kind === "delivery") {
    const eligible = s.orders.filter(
      (o) =>
        o.status === "พร้อมส่ง" && !s.deliveries.some((d) => d.oid === o.id),
    );
    const o =
      eligible.find((o) => o.id === choice) ||
      eligible.find((o) => o.id === id) ||
      eligible[0];
    title = "จัดงานส่ง";
    if (!o)
      body = (
        <Empty
          title="ยังไม่มีคำสั่งซื้อที่พร้อมส่ง"
          description="ตรวจและจัดสินค้าให้เสร็จก่อนสร้างงานส่ง"
        />
      );
    else
      body = (
        <SimpleForm
          onCancel={close}
          label="บันทึกงานส่ง"
          onSubmit={(f) => {
            if (s.deliveries.some((d) => d.oid === f.oid))
              throw Error("คำสั่งซื้อนี้มีงานส่งแล้ว");
            commit("บันทึกงานส่งแล้ว", (s) =>
              s.deliveries.unshift({
                id: uid("D"),
                oid: f.oid,
                carrier: f.carrier,
                driver: f.driver,
                tracking: f.tracking,
                address: f.address,
                eta: f.eta,
                status: "รอรับสินค้า",
                log: ["สร้างงานส่ง " + new Date().toLocaleTimeString("th-TH")],
              }),
            );
          }}
        >
          <Field label="คำสั่งซื้อ">
            <select
              name="oid"
              value={o.id}
              onChange={(e) => setChoice(e.target.value)}
            >
              {eligible.map((o) => (
                <option value={o.id} key={o.id}>
                  {o.id} · {customer(s, o.cid).name}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-grid">
            <Field label="ขนส่ง">
              <select name="carrier">
                <option>รถร้าน</option>
                <option>ขนส่งห้องเย็น</option>
              </select>
            </Field>
            <Field label="ผู้ส่ง / คนขับ" required>
              <input name="driver" required />
            </Field>
            <Field label="เลขติดตาม" required>
              <input
                name="tracking"
                defaultValue={"SW-" + Date.now().toString().slice(-6)}
                required
              />
            </Field>
            <Field label="กำหนดส่ง" required>
              <input
                name="eta"
                type="date"
                min={TODAY}
                defaultValue={TODAY}
                required
              />
            </Field>
          </div>
          <Field label="ที่อยู่จัดส่ง" required>
            <textarea
              key={o.id}
              name="address"
              defaultValue={o.address}
              required
            />
          </Field>
        </SimpleForm>
      );
  }
  if (kind === "delivery-detail") {
    const d = s.deliveries.find((x) => x.id === id)!;
    title = "ติดตามงานส่ง " + d.id;
    drawer = true;
    body = (
      <>
        <Badge>{d.status}</Badge>
        <p>
          {d.oid} ·{" "}
          {customer(s, s.orders.find((o) => o.id === d.oid)!.cid).name}
        </p>
        <div className="contact-details">
          <div>
            <span>ผู้ส่ง</span>
            <b>
              {d.driver} · {d.carrier}
            </b>
          </div>
          <div>
            <span>เลขติดตาม</span>
            <b>{d.tracking}</b>
          </div>
          <div>
            <span>ปลายทาง</span>
            <p>{d.address}</p>
          </div>
          <div>
            <span>กำหนดส่ง</span>
            <b>{date(d.eta)}</b>
          </div>
        </div>
        <Section title="ประวัติการจัดส่ง">
          {d.log.map((x, n) => (
            <p key={n}>{x}</p>
          ))}
        </Section>
        {d.status !== "จัดส่งสำเร็จ" && (
          <Button
            primary
            onClick={() =>
              commit(
                d.status === "รอรับสินค้า"
                  ? "ออกจัดส่งแล้ว"
                  : "ส่งมอบสินค้าแล้ว",
                (s) => {
                  const d = s.deliveries.find((x) => x.id === id)!,
                    o = s.orders.find((o) => o.id === d.oid)!;
                  advanceOrder(
                    o,
                    d.status === "รอรับสินค้า" ? "กำลังจัดส่ง" : "เสร็จสิ้น",
                  );
                  d.status =
                    d.status === "รอรับสินค้า" ? "กำลังจัดส่ง" : "จัดส่งสำเร็จ";
                  d.log.push(
                    d.status + " " + new Date().toLocaleTimeString("th-TH"),
                  );
                },
              )
            }
          >
            {d.status === "รอรับสินค้า"
              ? "ออกจัดส่ง"
              : "ยืนยันส่งมอบสินค้าแล้ว"}
          </Button>
        )}
      </>
    );
  }
  if (kind === "picking") {
    const o = s.orders.find((x) => x.id === id)!;
    title = "ใบจัดสินค้า · " + o.id;
    body = (
      <div className="print-document">
        <h2>ศาศวัต ห้องเย็น</h2>
        <p>
          {customer(s, o.cid).name} · {date(o.date)}
        </p>
        <DataTable
          rows={o.allocations.map((a, n) => ({ ...a, id: String(n) }))}
          columns={[
            { label: "สินค้า", cell: (a) => product(s, a.pid).name },
            {
              label: "ล็อต / ห้อง",
              cell: (a) => (
                <>
                  {s.lots.find((l) => l.id === a.lot)?.code}
                  <small>
                    {
                      s.rooms.find(
                        (r) =>
                          r.id === s.lots.find((l) => l.id === a.lot)?.room,
                      )?.name
                    }
                  </small>
                </>
              ),
            },
            {
              label: "จำนวน",
              align: "right",
              cell: (a) => a.qty + " " + product(s, a.pid).unit,
            },
            { label: "ตรวจแล้ว", cell: () => "□" },
          ]}
        />
        <p>ผู้จัดสินค้า ____________________ ผู้ตรวจ ____________________</p>
        <div className="form-footer">
          <Button primary onClick={() => window.print()}>
            <Printer size={16} />
            พิมพ์ใบจัดสินค้า
          </Button>
        </div>
      </div>
    );
  }
  if (kind === "user") {
    const u = s.users.find((x) => x.id === id);
    title = u ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน";
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) =>
          commit("บันทึกพนักงานแล้ว", (s) => {
            const v = { name: f.name, role: f.role, active: !!f.active };
            if (u)
              Object.assign(
                s.users.find((x) => x.id === id)!,
                v,
              );
            else s.users.push({ ...v, id: uid("U"), last: "", training: [] });
          })
        }
      >
        <Field label="ชื่อพนักงาน" required>
          <input name="name" defaultValue={u?.name} required />
        </Field>
        <Field label="หน้าที่">
          <select name="role" defaultValue={u?.role || "ฝ่ายขาย"}>
            <option>ผู้จัดการ</option>
            <option>ฝ่ายขาย</option>
            <option>คลังสินค้า</option>
            <option>ผู้ดูแลห้องเย็น</option>
            <option>ผู้ดูแลระบบ</option>
          </select>
        </Field>
        <label className="check-row">
          <input
            name="active"
            type="checkbox"
            defaultChecked={u?.active ?? true}
          />
          พร้อมใช้งานระบบ
        </label>
      </SimpleForm>
    );
  }
  if (kind === "training") {
    title =
      "แบบทดสอบ · " + (id === "stock" ? "งานคลังสินค้า" : "การดูแลลูกค้า");
    body = (
      <SimpleForm
        label="ส่งคำตอบ"
        onSubmit={(f) => {
          if (f.answer !== "correct")
            throw Error("คำตอบยังไม่ถูกต้อง ลองอ่านขั้นตอนและตอบอีกครั้ง");
          commit("ผ่านแบบทดสอบและบันทึกการอบรมแล้ว", (s) => {
            const u = s.users.find((u) => u.id === f.uid)!,
              topic = id === "stock" ? "คลังสินค้า" : "ข้อมูลลูกค้า";
            if (!u.training.includes(topic)) u.training.push(topic);
            u.last = TODAY;
          });
        }}
      >
        <Field label="พนักงาน">
          <select name="uid">{opts(s.users.filter((u) => u.active))}</select>
        </Field>
        <Field
          label={
            id === "stock"
              ? "ควรหยิบสินค้าล็อตใดก่อน?"
              : "เมื่อลูกค้าไม่ได้ซื้อนาน ควรทำอย่างไร?"
          }
        >
          <select name="answer" required defaultValue="">
            <option value="" disabled>
              เลือกคำตอบ
            </option>
            <option value="correct">
              {id === "stock"
                ? "ล็อตที่หมดอายุก่อนและยังไม่หมดอายุ"
                : "ตรวจประวัติการซื้อและติดต่อพร้อมข้อเสนอที่เหมาะสม"}
            </option>
            <option value="wrong">
              {id === "stock"
                ? "ล็อตที่มีจำนวนมากที่สุด"
                : "ลบข้อมูลลูกค้าออกจากระบบ"}
            </option>
          </select>
        </Field>
      </SimpleForm>
    );
  }
  if (kind === "survey") {
    title = "บันทึกความพึงพอใจลูกค้า";
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) =>
          commit("บันทึกความคิดเห็นลูกค้าแล้ว", (s) =>
            s.surveys.push({
              id: uid("SV"),
              cid: f.cid,
              date: TODAY,
              score: number(f.score, 1),
              note: f.note,
            }),
          )
        }
      >
        <Field label="ลูกค้า">
          <select name="cid" defaultValue={id}>
            {opts(s.customers)}
          </select>
        </Field>
        <Field label="คะแนน">
          <select name="score">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </Field>
        <Field label="ความคิดเห็น">
          <textarea name="note" />
        </Field>
      </SimpleForm>
    );
  }
  if (kind === "baseline") {
    title = "ข้อมูลเปรียบเทียบและบันทึกระบบ";
    body = (
      <SimpleForm
        onCancel={close}
        onSubmit={(f) => {
          const k = {
            baselineWaste: number(f.baselineWaste),
            baselineRetention: number(f.baselineRetention),
            baselineDigital: number(f.baselineDigital),
            totalCaptured: number(f.totalCaptured, s.orders.length),
            uptime: number(f.uptime),
            totalTime: number(f.totalTime, 1),
          };
          if (k.uptime > k.totalTime || k.baselineRetention > 100)
            throw Error("เวลาที่ใช้งานได้หรืออัตราซื้อซ้ำไม่ถูกต้อง");
          commit("บันทึกข้อมูลเปรียบเทียบแล้ว", (s) => {
            s.kpi = k;
          });
        }}
      >
        <p>
          ข้อมูลตัวอย่างใช้สำหรับเปรียบเทียบผลการดำเนินงาน
          ยังไม่มีระบบวัดเวลาใช้งานจริง
        </p>
        <div className="form-grid">
          {Object.entries({
            baselineWaste: "มูลค่าสินค้าเสียเดิม (บาท)",
            baselineRetention: "อัตราลูกค้าซื้อซ้ำเดิม (%)",
            baselineDigital: "ยอดขายออนไลน์และต่างจังหวัดเดิม (บาท)",
            totalCaptured: "คำสั่งซื้อที่ได้รับทั้งหมด",
            uptime: "เวลาที่ระบบใช้งานได้ (นาที)",
            totalTime: "เวลาทั้งหมด (นาที)",
          }).map(([key, label]) => (
            <Field key={key} label={label} required>
              <input
                name={key}
                type="number"
                min={key === "totalCaptured" ? s.orders.length : 0}
                step="0.01"
                defaultValue={s.kpi[key as keyof State["kpi"]]}
                required
              />
            </Field>
          ))}
        </div>
      </SimpleForm>
    );
  }
  if (kind === "import") {
    title = "นำเข้าข้อมูลสำรอง";
    body = (
      <>
        <p>
          ข้อมูลที่จะนำเข้าจะใช้แทนข้อมูลปัจจุบันในเบราว์เซอร์นี้
          ดาวน์โหลดข้อมูลสำรองก่อนหากต้องการเก็บข้อมูลเดิม
        </p>
        <Field label="เลือกไฟล์สำรอง">
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              setImportData(null);
              setImportError("");
              try {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 5 * 1024 * 1024) throw Error("ไฟล์ใหญ่เกิน 5 MB");
                const v = JSON.parse(await f.text());
                if (!validateState(v))
                  throw Error(
                    "โครงสร้างข้อมูลไม่ถูกต้องหรือรายการอ้างอิงไม่ครบ",
                  );
                setImportData(v);
              } catch (err) {
                setImportError((err as Error).message);
              }
            }}
          />
        </Field>
        {importError && <div className="inline-error">{importError}</div>}
        {importData && (
          <div className="notice">
            ตรวจแล้ว: {importData.customers.length} ลูกค้า ·{" "}
            {importData.products.length} สินค้า · {importData.orders.length}{" "}
            คำสั่งซื้อ
          </div>
        )}
        <div className="form-footer">
          <Button onClick={close}>ยกเลิก</Button>
          <Button
            primary
            disabled={!importData}
            onClick={() => {
              if (importData) {
                replace(importData);
                notify("นำเข้าข้อมูลสำรองแล้ว");
                close();
              }
            }}
          >
            ยืนยันแทนที่ข้อมูลปัจจุบัน
          </Button>
        </div>
      </>
    );
  }
  if (!body) return null;
  return drawer ? (
    <Drawer key={kind + "-" + id} title={title} onClose={close}>
      {body}
    </Drawer>
  ) : (
    <Modal key={kind + "-" + id} title={title} onClose={close}>
      {body}
    </Modal>
  );
}
