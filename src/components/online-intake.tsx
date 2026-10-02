"use client";
import { useState } from "react";
import { Plus, Check, ArrowRight, X } from "lucide-react";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  DataTable,
  Field,
  Section,
  SearchInput,
  SimpleForm,
  Badge,
  Empty,
  Modal,
} from "./ui";
import {
  stock,
  product,
  customer,
  createOrder,
  uid,
  Item,
  money,
  sum,
  Channel,
} from "@/lib/domain";
import { Navigate } from "./orders";
export default function OnlineIntake({ go }: { go: Navigate }) {
  const { s, change } = useStore();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Pick<Item, "pid" | "qty">[]>([]);
  const [shipping, setShipping] = useState("รับหน้าร้าน");
  const [review, setReview] = useState<Record<string, string> | null>(null);
  const [created, setCreated] = useState("");
  const [error, setError] = useState("");
  const total = items.reduce((a, i) => a + i.qty * product(s, i.pid).price, 0);
  const valid =
    items.length > 0 &&
    items.every((i) => i.qty > 0 && i.qty <= stock(s, i.pid));
  const add = (pid: string) =>
    setItems(
      items.some((i) => i.pid === pid)
        ? items.map((i) => (i.pid === pid ? { ...i, qty: i.qty + 1 } : i))
        : [...items, { pid, qty: 1 }],
    );
  const submit = () => {
    if (!review) return;
    let oid = "";
    const ok = change("รับคำสั่งซื้อออนไลน์แล้ว รอฝ่ายขายยืนยัน", (s) => {
      const phone = review.phone.replace(/\D/g, "");
      let c = s.customers.find((c) => c.phone.replace(/\D/g, "") === phone);
      if (c && c.name.trim() !== review.name.trim())
        throw Error(
          "ชื่อไม่ตรงกับเบอร์โทรที่มีในระบบ ตรวจชื่อและเบอร์โทรอีกครั้ง",
        );
      if (!c) {
        c = {
          id: uid("C"),
          name: review.name.trim(),
          phone,
          type: "ค้าปลีก",
          area: review.area,
          channel: "ออนไลน์",
          joined: "2026-10-02",
          points: 0,
          referrer: "",
          special: 0,
        };
        s.customers.push(c);
      }
      const o = createOrder(s, {
        cid: c.id,
        channel: "ออนไลน์",
        discount: 0,
        address: shipping === "จัดส่ง" ? review.address : "",
        note: review.note,
        items,
        employee: "ช่องทางออนไลน์",
        pending: true,
      });
      oid = o.id;
    });
    if (ok) {
      setReview(null);
      setCreated(oid);
      setItems([]);
    }
  };
  if (created) {
    const o = s.orders.find((o) => o.id === created)!;
    return (
      <>
        <PageHeader
          title="รับคำสั่งซื้อออนไลน์แล้ว"
          description="คำสั่งซื้อเข้าคิวเดียวกับโทรศัพท์ LINE และหน้าร้าน"
        />
        <Section title={o.id}>
          <Badge>{o.status}</Badge>
          <p style={{ marginTop: 16 }}>
            {customer(s, o.cid).name} · {shipping} · ฿{money(sum(o))}
          </p>
          <p>ยังไม่ตัดสต๊อก ฝ่ายขายจะตรวจสินค้าและยืนยันก่อนเริ่มจัด</p>
          <div className="actions" style={{ marginTop: 24 }}>
            <Button primary onClick={() => go("orders", "", o.id)}>
              ดูขั้นตอนรับคำสั่งซื้อของฝ่ายขาย
              <ArrowRight size={16} />
            </Button>
            <Button onClick={() => setCreated("")}>
              ลองส่งคำสั่งซื้ออีกครั้ง
            </Button>
          </div>
        </Section>
      </>
    );
  }
  return (
    <>
      <PageHeader
        title="คำสั่งซื้อออนไลน์ (ตัวอย่าง)"
        description="ทดสอบช่องทางรับคำสั่งซื้อจากลูกค้า เมื่อส่งแล้วจะเข้าคิวรอยืนยันของฝ่ายขาย"
        back={() => go("settings")}
      />
      <div className="notice">
        ช่องทางตัวอย่างสำหรับต้นแบบ
        ไม่มีการรับชำระเงินหรือส่งคำสั่งซื้อไปยังบริการจริง
      </div>
      <div className="order-workspace">
        <Section title="เลือกสินค้า">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="ค้นหาสินค้า"
          />
          <div style={{ marginTop: 16 }}>
            <DataTable
              rows={s.products.filter((p) => p.name.includes(search))}
              columns={[
                {
                  label: "สินค้า",
                  cell: (p) => (
                    <>
                      <b>{p.name}</b>
                      <small>
                        เหลือ {stock(s, p.id)} {p.unit}
                      </small>
                    </>
                  ),
                },
                {
                  label: "ราคาต่อหน่วย",
                  align: "right",
                  cell: (p) => "฿" + money(p.price),
                },
                {
                  label: "",
                  cell: (p) => (
                    <Button
                      small
                      disabled={stock(s, p.id) <= 0}
                      onClick={() => add(p.id)}
                    >
                      <Plus size={14} />
                      เพิ่ม
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </Section>
        <section className="order-summary">
          <h2>คำสั่งซื้อของคุณ</h2>
          {items.length ? (
            items.map((i, n) => {
              const p = product(s, i.pid);
              return (
                <div className="summary-item" key={p.id}>
                  <div className="summary-line">
                    <b>{p.name}</b>
                    <Button
                      aria-label={"ลบ " + p.name}
                      small
                      onClick={() =>
                        setItems(items.filter((j) => j.pid !== p.id))
                      }
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div className="quantity-line">
                    <Field label={"จำนวน " + p.name}>
                      <input
                        aria-label={"จำนวน " + p.name}
                        type="number"
                        min="0.01"
                        max={stock(s, p.id)}
                        step="0.01"
                        value={i.qty}
                        onChange={(e) =>
                          setItems(
                            items.map((j, k) =>
                              k === n ? { ...j, qty: +e.target.value } : j,
                            ),
                          )
                        }
                      />
                    </Field>
                    <span>
                      {p.unit} × ฿{p.price}
                    </span>
                    <b>฿{money(i.qty * p.price)}</b>
                  </div>
                  {i.qty > stock(s, p.id) && (
                    <small className="error">
                      สินค้าคงเหลือไม่พอ เหลือ {stock(s, p.id)} {p.unit}
                    </small>
                  )}
                </div>
              );
            })
          ) : (
            <Empty title="ยังไม่ได้เลือกสินค้า" />
          )}
          <div className="total-row">
            <span>รวม</span>
            <strong>฿{money(total)}</strong>
          </div>
          <SimpleForm
            label="ตรวจสอบก่อนส่ง"
            onSubmit={(f) => {
              if (!valid) throw Error("เลือกสินค้าและตรวจจำนวนคงเหลือ");
              if (!/^0\d{8,9}$/.test(f.phone.replace(/\D/g, "")))
                throw Error("เบอร์โทรต้องขึ้นต้นด้วย 0 จำนวน 9–10 หลัก");
              setReview(f);
            }}
          >
            <Field label="ชื่อ / ชื่อร้าน" required>
              <input name="name" required />
            </Field>
            <Field label="เบอร์โทรศัพท์" required>
              <input name="phone" type="tel" required />
            </Field>
            <Field label="จังหวัด" required>
              <input name="area" defaultValue="มุกดาหาร" required />
            </Field>
            <Field label="รับสินค้า">
              <select
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
              >
                <option>รับหน้าร้าน</option>
                <option>จัดส่ง</option>
              </select>
            </Field>
            {shipping === "จัดส่ง" && (
              <Field label="ที่อยู่จัดส่ง" required>
                <textarea name="address" required />
              </Field>
            )}
            <Field label="หมายเหตุ">
              <textarea name="note" />
            </Field>
          </SimpleForm>
        </section>
      </div>
      {review && (
        <Modal title="ตรวจสอบคำสั่งซื้อออนไลน์" onClose={() => setReview(null)}>
          <p>
            {review.name} · {review.phone}
          </p>
          <div className="confirm-items">
            {items.map((i) => (
              <div key={i.pid}>
                <span>
                  {product(s, i.pid).name} · {i.qty} {product(s, i.pid).unit}
                </span>
                <b>฿{money(i.qty * product(s, i.pid).price)}</b>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>รวม</span>
            <strong>฿{money(total)}</strong>
          </div>
          <p>ส่งเข้าคิวรอยืนยัน ฝ่ายขายจะตรวจรายการก่อนตัดสต๊อก</p>
          <div className="form-footer">
            <Button onClick={() => setReview(null)}>กลับไปตรวจสอบ</Button>
            <Button primary onClick={submit}>
              ส่งคำสั่งซื้อจำลอง
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
