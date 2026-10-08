"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  PackageCheck,
  Truck,
  Printer,
  Info,
  X,
} from "lucide-react";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  DataTable,
  Badge,
  SearchInput,
  Filters,
  Field,
  Section,
  StatStrip,
  Empty,
  Modal,
} from "./ui";
import {
  State,
  uid,
  Order,
  Customer,
  Channel,
  Item,
  TODAY,
  stock,
  product,
  customer,
  sum,
  money,
  date,
  relative,
  group,
  lastOrder,
  ordersFor,
  favorites,
  allocate,
  suggestedLots,
  expiryText,
  createOrder,
  confirmOrder,
  advanceOrder,
  cancelOrder,
} from "@/lib/domain";
export type Navigate = (
  route: string,
  filter?: string,
  entity?: string,
) => void;
export type OpenForm = (kind: string, id?: string) => void;
function SendOrderLine({o,go}:{o:Order;go:Navigate}) {
  const {s,change,role}=useStore();
  if(o.cid==='C-WALKIN'||role==='พนักงานคลัง'||['รอยืนยัน','ยกเลิก'].includes(o.status))return null;
  const key=`${o.id}-${o.status}-${o.receipt?.number||'order'}`;
  const sent=s.lineMessages?.some(m=>m.key===key);
  return <Button small onClick={e=>{e.stopPropagation();if(sent){go('line','',o.id);return;}if(change('ส่งคำสั่งซื้อเข้า LINE จำลองแล้ว',state=>{
    const current=state.orders.find(x=>x.id===o.id)!;
    const list=state.lineMessages||(state.lineMessages=[]);
    if(list.some(m=>m.key===key))return;
    list.push({id:uid('LINE'),key,cid:current.cid,source:current.id,route:'orders',direction:'store',sender:role,time:new Date().toISOString(),receipt:current.receipt?.number,text:`แจ้งคำสั่งซื้อ ${current.id}\n${current.items.map(i=>`${product(state,i.pid).name} ${i.qty} ${product(state,i.pid).unit}`).join('\n')}\nยอดสุทธิ ฿${money(sum(current))}\nสถานะ: ${current.status}\n${current.address?'จัดส่ง: '+current.address:'รับสินค้าที่ร้าน'}${current.receipt?'\nรับชำระแล้ว · ใบเสร็จ '+current.receipt.number:''}`});
  }))go('line','',o.id);}}>{sent?'ดูแชต LINE':'ส่งเข้า LINE จำลอง'}</Button>;
}
export function OrderList({
  go,
  filter: initial = "",
  open,
}: {
  go: Navigate;
  filter?: string;
  open: OpenForm;
}) {
  const { s, role } = useStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initial || "ทั้งหมด");
  const [channel, setChannel] = useState("ทั้งหมด");
  const [period, setPeriod] = useState("ทั้งหมด");
  const filtered = s.orders.filter(
    (o) =>
      (status === "ทั้งหมด" || o.status === status) &&
      (channel === "ทั้งหมด" || o.channel === channel) &&
      (period === "ทั้งหมด" || o.date === TODAY) &&
      [o.id, customer(s, o.cid).name, customer(s, o.cid).phone]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const statuses = [
    "ทั้งหมด",
    "รอยืนยัน",
    "กำลังจัดสินค้า",
    "พร้อมส่ง",
    "กำลังจัดส่ง",
    "เสร็จสิ้น",
    "ยกเลิก",
  ];
  return (
    <>
      <PageHeader
        title="คำสั่งซื้อ"
        description={`${s.orders.length} รายการ · รับจากโทรศัพท์ LINE และหน้าร้าน`}
        actions={role !== "พนักงานคลัง" &&
          <Button primary onClick={() => go("new-order")}>
            <Plus size={16} />
            สร้างคำสั่งซื้อ
          </Button>
        }
      />
      <Filters
        value={status}
        onChange={setStatus}
        items={statuses.map((t) => ({
          label: t,
          value: t,
          count:
            t === "ทั้งหมด"
              ? s.orders.length
              : s.orders.filter((o) => o.status === t).length,
        }))}
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ค้นหาเลขที่ / ชื่อลูกค้า / เบอร์โทร"
        />
        <Field label="ช่องทาง">
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            {["ทั้งหมด", "โทรศัพท์", "LINE", "หน้าร้าน", "ออนไลน์"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="วันที่">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>ทั้งหมด</option>
            <option>วันนี้</option>
          </select>
        </Field>
        <span className="result-count">{filtered.length} รายการ</span>
      </div>
      <DataTable
        rows={filtered}
        onRow={(o) => go("orders", "", o.id)}
        empty={
          <Empty
            title={search ? "ไม่พบคำสั่งซื้อ" : "ยังไม่มีคำสั่งซื้อในช่วงนี้"}
            action={role !== "พนักงานคลัง" &&
              <Button primary onClick={() => go("new-order")}>
                สร้างคำสั่งซื้อ
              </Button>
            }
          />
        }
        columns={[
          {
            label: "เลขที่ / เวลา",
            cell: (o) => (
              <>
                <button
                  className="text-link"
                  onClick={() => go("orders", "", o.id)}
                >
                  {o.id}
                </button>
                <small>
                  {relative(o.date)} · {o.time}
                </small>
              </>
            ),
          },
          {
            label: "ลูกค้า",
            cell: (o) => (
              <>
                <b>{customer(s, o.cid).name}</b>
                <small>{customer(s, o.cid).phone}</small>
              </>
            ),
          },
          {
            label: "ช่องทาง",
            cell: (o) => o.channel,
            className: "secondary-column",
          },
          { label: "ยอดรวม", align: "right", cell: (o) => "฿" + money(sum(o)) },
          { label: "สถานะ", cell: (o) => <Badge>{o.status}</Badge> },
          {
            label: "",
            cell: (o) => (
              <div className="actions"><SendOrderLine o={o} go={go}/><Button
                small
                onClick={(e) => {
                  e.stopPropagation();
                  go("orders", "", o.id);
                }}
              >
                ดูรายการ →
              </Button></div>
            ),
          },
        ]}
      />
    </>
  );
}
export function NewOrder({
  go,
  open,
  customerId = "",
  customerAdded = "",
}: {
  go: Navigate;
  open: OpenForm;
  customerId?: string;
  customerAdded?: string;
}) {
  const { s, role, change, notify } = useStore();
  const [cid, setCid] = useState(customerId);
  const [channel, setChannel] = useState<Channel>(() => {
    if (typeof window === "undefined") return "LINE";
    try {
      const c = localStorage.getItem("sasawat-last-channel");
      return ["LINE", "โทรศัพท์", "หน้าร้าน", "ออนไลน์"].includes(c || "")
        ? (c as Channel)
        : "LINE";
    } catch {
      return "LINE";
    }
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<Pick<Item, "pid" | "qty">[]>([]);
  const [discount, setDiscount] = useState(
    customerId ? customer(s, customerId).special : 0,
  );
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [review, setReview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const [mobileStep, setMobileStep] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (customerAdded && customer(s, customerAdded)) {
      setCid(customerAdded);
      setDiscount(customer(s, customerAdded).special);
      setCustomerSearch("");
    }
  }, [customerAdded]);
  const c = cid ? customer(s, cid) : undefined;
  const matches = customerSearch
    ? s.customers.filter((x) =>
        [x.name, x.phone].join(" ").includes(customerSearch),
      )
    : s.customers.slice(0, 5);
  const products = s.products.filter((p) =>
    [p.name, p.sku, p.barcode]
      .join(" ")
      .toLowerCase()
      .includes(productSearch.toLowerCase()),
  );
  const orderItems = items.map((i) => ({
    ...i,
    price: product(s, i.pid).price,
  }));
  const total = sum({ items: orderItems, discount });
  let allocations: ReturnType<typeof allocate> = [];
  let stockError = "";
  try {
    if (items.length) allocations = allocate(s, items);
  } catch (err) {
    stockError = (err as Error).message;
  }
  const valid =
    !!c &&
    items.length > 0 &&
    !stockError &&
    Number.isFinite(discount) &&
    discount >= 0 &&
    discount <= 100;
  const selectCustomer = (c: Customer) => {
    setCid(c.id);
    setDiscount(c.special);
    setCustomerSearch("");
    setError("");
  };
  const add = (pid: string) => {
    setItems((old) =>
      old.some((i) => i.pid === pid)
        ? old.map((i) => (i.pid === pid ? { ...i, qty: i.qty + 1 } : i))
        : [...old, { pid, qty: 1 }],
    );
    setReview(false);
    setError("");
  };
  const submit = () => {
    if (saving) return;
    setSaving(true);
    let oid = "";
    const ok = change(
      "บันทึกคำสั่งซื้อ ตัดสต๊อก และอัปเดตประวัติลูกค้าแล้ว",
      (next) => {
        const o = createOrder(next, {
          cid,
          channel,
          discount,
          address,
          note,
          items,
          employee: role,
        });
        oid = o.id;
      },
    );
    if (ok) {
      try {
        localStorage.setItem("sasawat-last-channel", channel);
      } catch {}
      go("orders", "", oid);
    } else {
      setConfirm(false);
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeader
        title="สร้างคำสั่งซื้อ"
        description="เลือกลูกค้าและสินค้า แล้วตรวจสอบก่อนยืนยัน"
        back={() => (items.length || cid ? setLeave(true) : go("orders"))}
      />
      <div className="work-steps">
        <span className={c ? "done" : ""}>
          1 <b>ลูกค้า</b>
          {c && <Check size={14} />}
        </span>
        <span className={items.length ? "done" : ""}>
          2 <b>สินค้า</b>
          {items.length > 0 && <Check size={14} />}
        </span>
        <span className={review ? "done" : ""}>
          3 <b>ตรวจสอบ</b>
        </span>
      </div>
      <div className="mobile-step-switch">
        <Filters
          value={String(mobileStep)}
          onChange={(x) => setMobileStep(+x)}
          items={[
            { value: "1", label: "ลูกค้า" },
            { value: "2", label: "สินค้า" },
            { value: "3", label: "ตรวจสอบ" },
          ]}
        />
      </div>
      <div className="order-workspace">
        <div className={"order-left mobile-step-" + mobileStep}>
          <Section title="ลูกค้า" className="customer-section">
            <div className="customer-search-row">
              <SearchInput
                value={customerSearch}
                onChange={setCustomerSearch}
                placeholder="ค้นหาชื่อร้าน ชื่อลูกค้า หรือเบอร์โทร"
              />
              <Button onClick={() => open("customer")}>เพิ่มลูกค้า</Button>
            </div>
            {c && !customerSearch ? (
              <div className="selected-customer">
                <div>
                  <strong>{c.name}</strong>
                  <span>
                    {group(s, c)} · {c.phone}
                  </span>
                  <small>
                    {ordersFor(s, c.id).length
                      ? "ซื้อครั้งล่าสุด " +
                        relative(lastOrder(s, c.id)) +
                        " · " +
                        ordersFor(s, c.id).length +
                        " ครั้ง · รวม ฿" +
                        money(
                          ordersFor(s, c.id).reduce((a, o) => a + sum(o), 0),
                        )
                      : "ยังไม่มีประวัติการซื้อ"}
                  </small>
                  <small>
                    ซื้อบ่อย:{" "}
                    {favorites(s, c.id)
                      .slice(0, 3)
                      .map((f) => f.product.name)
                      .join(" · ") || "ยังไม่มีประวัติการซื้อ"}
                  </small>
                </div>
                <Button
                  small
                  onClick={() => {
                    setCid("");
                    setDiscount(0);
                  }}
                >
                  เปลี่ยนลูกค้า
                </Button>
              </div>
            ) : (
              <div className="customer-results">
                {matches.length ? (
                  matches.map((c) => (
                    <button key={c.id} onClick={() => selectCustomer(c)}>
                      <span>
                        <b>{c.name}</b>
                        <small>
                          {c.phone} · {group(s, c)}
                        </small>
                      </span>
                      <span>
                        {ordersFor(s, c.id).length
                          ? relative(lastOrder(s, c.id))
                          : "ยังไม่ได้ซื้อ"}
                      </span>
                    </button>
                  ))
                ) : (
                  <Empty
                    title="ไม่พบลูกค้า"
                    action={
                      <Button onClick={() => open("customer")}>
                        เพิ่มลูกค้าใหม่
                      </Button>
                    }
                  />
                )}
              </div>
            )}
            <div className="form-grid compact-grid">
              <Field label="ช่องทางคำสั่งซื้อ">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                >
                  {["โทรศัพท์", "LINE", "หน้าร้าน", "ออนไลน์"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="วันที่ / ผู้รับคำสั่งซื้อ">
                <div className="field-readonly">
                  {date(TODAY)} · {role}
                </div>
              </Field>
            </div>
            <div className="mobile-next">
              <Button primary disabled={!c} onClick={() => setMobileStep(2)}>
                เลือกสินค้า
                <ArrowRight size={16} />
              </Button>
            </div>
          </Section>
          <Section
            title="สินค้า"
            className="products-section"
            action={<span className="muted">ราคาขายและจำนวนพร้อมขาย</span>}
          >
            <SearchInput
              value={productSearch}
              onChange={setProductSearch}
              placeholder="ค้นหาสินค้า / รหัสสินค้า / บาร์โค้ด"
            />
            <div className="product-picker">
              {products.length ? (
                products.map((p) => (
                  <div className="product-pick-row" key={p.id}>
                    <div>
                      <b>{p.name}</b>
                      <small>
                        {p.sku} · ฿{money(p.price)}/{p.unit}
                      </small>
                    </div>
                    <div
                      className={
                        stock(s, p.id) < p.min ? "warning-text" : "muted"
                      }
                    >
                      เหลือ {money(stock(s, p.id))} {p.unit}
                    </div>
                    <Button
                      small
                      disabled={stock(s, p.id) <= 0}
                      onClick={() => add(p.id)}
                    >
                      <Plus size={14} />
                      เพิ่ม
                    </Button>
                  </div>
                ))
              ) : (
                <Empty title="ไม่พบสินค้า" />
              )}
            </div>
            <div className="mobile-next">
              <Button
                primary
                disabled={!items.length || !c}
                onClick={() => setMobileStep(3)}
              >
                ปรับจำนวนและตรวจสอบ
                <ArrowRight size={16} />
              </Button>
            </div>
          </Section>
        </div>
        <section className={"order-summary mobile-step-" + mobileStep}>
          <div className="section-head">
            <h2>สรุปคำสั่งซื้อ</h2>
            <span>{items.length} รายการ</span>
          </div>
          <p className="summary-customer">
            {c?.name || "ยังไม่ได้เลือกลูกค้า"}
            <small>{channel}</small>
          </p>
          {!items.length ? (
            <Empty
              title="ยังไม่ได้เลือกสินค้า"
              description="เพิ่มสินค้าจากรายการทางซ้าย"
            />
          ) : (
            items.map((i, n) => {
              const p = product(s, i.pid),
                ls = allocations.filter((a) => a.pid === i.pid),
                insufficient = i.qty > stock(s, i.pid) || i.qty <= 0;
              return (
                <div className="summary-item" key={i.pid}>
                  <div className="summary-line">
                    <b>{p.name}</b>
                    <Button
                      small
                      aria-label={"ลบ " + p.name}
                      onClick={() => {
                        setItems(items.filter((j) => j.pid !== i.pid));
                        setReview(false);
                      }}
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
                        step="0.01"
                        value={Number.isNaN(i.qty) ? "" : i.qty}
                        onChange={(e) => {
                          setItems(
                            items.map((x, k) =>
                              k === n ? { ...x, qty: +e.target.value } : x,
                            ),
                          );
                          setReview(false);
                        }}
                      />
                    </Field>
                    <span>
                      {p.unit} × ฿{money(p.price)}
                    </span>
                    <strong>฿{money(i.qty * p.price)}</strong>
                  </div>
                  {insufficient && (
                    <small className="error">
                      สินค้าไม่เพียงพอหรือจำนวนไม่ถูกต้อง · เหลือ{" "}
                      {stock(s, p.id)} {p.unit}
                    </small>
                  )}
                  {ls.map((a, k) => {
                    const l = s.lots.find((l) => l.id === a.lot)!;
                    return (
                      <div className="lot-suggestion" key={a.lot}>
                        <span>
                          {k === 0
                            ? "แนะนำให้ใช้ล็อตนี้ก่อน"
                            : "หยิบเพิ่มจากล็อตนี้"}
                        </span>
                        <b>
                          {l.code} · {a.qty} {p.unit}
                        </b>
                        <small>{expiryText(l.expiry)}</small>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
          <Field
            label="ส่วนลด (%)"
            hint={
              c?.special
                ? "ลูกค้ารายนี้ได้รับส่วนลด " + c.special + "%"
                : undefined
            }
          >
            <input
              aria-label="ส่วนลด"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => {
                setDiscount(+e.target.value);
                setReview(false);
              }}
            />
          </Field>
          <Field label="โปรโมชั่น">
            <select
              aria-label="โปรโมชั่น"
              onChange={(e) => {
                const promo = s.campaigns.find((x) => x.id === e.target.value);
                setDiscount(promo?.discount || c?.special || 0);
                setReview(false);
              }}
            >
              <option value="">ไม่ใช้โปรโมชั่น</option>
              {s.campaigns
                .filter(
                  (x) =>
                    x.status === "ส่งแล้ว" &&
                    x.start <= TODAY &&
                    x.end >= TODAY &&
                    (x.segment === "ทุกกลุ่ม" ||
                      x.customerId === cid ||
                      x.segment === (c ? group(s, c) : "") ||
                      (x.segment === "ซื้อสินค้าประเภทเดิม" &&
                        items.some(
                          (i) => product(s, i.pid).category === x.category,
                        ))),
                )
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} ({x.discount}%)
                  </option>
                ))}
            </select>
          </Field>
          <details className="order-extras">
            <summary>ที่อยู่จัดส่งและหมายเหตุ</summary>
            <Field label="ที่อยู่จัดส่ง" hint="เว้นว่างหากรับหน้าร้าน">
              <textarea
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setReview(false);
                }}
              />
            </Field>
            <Field label="หมายเหตุ">
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setReview(false);
                }}
              />
            </Field>
          </details>
          <div className="total-row">
            <span>ยอดรวมหลังส่วนลด</span>
            <strong>฿{money(total)}</strong>
          </div>
          {stockError && (
            <div className="inline-error" role="alert">
              สินค้าไม่เพียงพอ
              <br />
              {stockError}
            </div>
          )}
          {error && <div className="inline-error">{error}</div>}
          {review && (
            <div className="review-note">
              <Check size={16} />
              ตรวจสอบลูกค้า จำนวนสินค้า และยอดรวมอีกครั้ง
            </div>
          )}
          <div className="sticky-submit">
            <Button
              primary
              disabled={!valid || saving}
              onClick={() => {
                if (!review) {
                  setReview(true);
                  setMobileStep(3);
                } else setConfirm(true);
              }}
            >
              {review ? "ยืนยันคำสั่งซื้อ" : "ตรวจสอบคำสั่งซื้อ"}
              <ArrowRight size={16} />
            </Button>
            <small>
              หลังยืนยัน ระบบจะตัดสต๊อกและบันทึกประวัติลูกค้าให้ทันที
            </small>
          </div>
        </section>
      </div>
      {confirm && (
        <Modal title="ยืนยันคำสั่งซื้อนี้?" onClose={() => setConfirm(false)}>
          <p>
            {c?.name} · {channel}
          </p>
          <div className="confirm-items">
            {orderItems.map((i) => (
              <div key={i.pid}>
                <span>
                  {product(s, i.pid).name} · {i.qty} {product(s, i.pid).unit}
                </span>
                <b>฿{money(i.qty * i.price)}</b>
              </div>
            ))}
          </div>
          <div className="total-row">
            <span>รวมหลังส่วนลด</span>
            <strong>฿{money(total)}</strong>
          </div>
          <p>
            ระบบจะบันทึกคำสั่งซื้อ ตัดสต๊อกตามล็อตที่แนะนำ
            และอัปเดตประวัติลูกค้า
          </p>
          <div className="form-footer">
            <Button onClick={() => setConfirm(false)}>กลับไปตรวจสอบ</Button>
            <Button primary disabled={saving} onClick={submit}>
              {saving ? "กำลังบันทึก…" : "ยืนยันคำสั่งซื้อ"}
            </Button>
          </div>
        </Modal>
      )}
      {leave && (
        <Modal
          title="ออกจากคำสั่งซื้อที่ยังไม่ได้บันทึก?"
          onClose={() => setLeave(false)}
        >
          <p>รายการที่เลือกจะยังไม่ถูกบันทึกและยังไม่ตัดสต๊อก</p>
          <div className="form-footer">
            <Button onClick={() => setLeave(false)}>ทำต่อ</Button>
            <Button danger onClick={() => go("orders")}>
              ออกจากหน้านี้
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function OrderDetail({
  id,
  go,
  open,
}: {
  id: string;
  go: Navigate;
  open: OpenForm;
}) {
  const { s, change, role } = useStore();
  const [cancelling, setCancelling] = useState(false);
  const [handoff, setHandoff] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const o = s.orders.find((o) => o.id === id);
  if (!o)
    return (
      <Empty
        title="ไม่พบคำสั่งซื้อ"
        action={<Button onClick={() => go("orders")}>กลับไปคำสั่งซื้อ</Button>}
      />
    );
  const c = customer(s, o.cid);
  const warehouse = role === "พนักงานคลัง";
  const canProgress = role === "ผู้จัดการ" || (warehouse ? o.status !== "รอยืนยัน" : o.status === "รอยืนยัน" || o.status === "พร้อมส่ง");
  const picked = o.pickedLots || [];
  const stages = [
    "รับคำสั่งซื้อ",
    "ยืนยันและตัดสต๊อก",
    "กำลังจัดสินค้า",
    "พร้อมส่ง",
    o.address ? "กำลังจัดส่ง" : "ลูกค้ารับสินค้า",
    "เสร็จสิ้น",
  ];
  const current =
    o.status === "รอยืนยัน"
      ? 0
      : o.status === "กำลังจัดสินค้า"
        ? 2
        : o.status === "พร้อมส่ง"
          ? 3
          : o.status === "กำลังจัดส่ง"
            ? 4
            : 5;
  const next = () => {
    if (o.status === "รอยืนยัน")
      change("ยืนยันคำสั่งซื้อและตัดสต๊อกแล้ว", (s) =>
        confirmOrder(
          s,
          s.orders.find((x) => x.id === id)!,
        ),
      );
    else if (o.status === "กำลังจัดสินค้า")
      change("จัดสินค้าเสร็จแล้ว พร้อมส่งหรือรับหน้าร้าน", (s) =>
        advanceOrder(
          s.orders.find((x) => x.id === id)!,
          "พร้อมส่ง",
        ),
      );
    else if (o.status === "พร้อมส่ง" && !o.address)
      change("ลูกค้ารับสินค้าแล้ว", (s) =>
        advanceOrder(
          s.orders.find((x) => x.id === id)!,
          "เสร็จสิ้น",
        ),
      );
    else {
      const delivery = s.deliveries.find(d => d.oid === id);
      open(delivery ? "delivery-detail" : "delivery", delivery?.id || id);
    }
  };
  return (
    <>
      <PageHeader
        title={"คำสั่งซื้อ " + o.id}
        description={`${date(o.date)} · ${o.time} · รับโดย ${o.employee}`}
        back={() => go("orders")}
        actions={
          <>
            {!warehouse && !["รอยืนยัน","ยกเลิก"].includes(o.status) && <SendOrderLine o={o} go={go}/>}
            {!warehouse && !["รอยืนยัน", "ยกเลิก"].includes(o.status) && <Button onClick={() => open("receipt", id)}><Printer size={16} />{o.receipt ? "ดูใบเสร็จ" : "ออกใบเสร็จ"}</Button>}
            {!["รอยืนยัน", "ยกเลิก"].includes(o.status) && (
              <Button onClick={() => open("picking", id)}>
                <Printer size={16} />
                ใบจัดสินค้า
              </Button>
            )}
            {canProgress && !["กำลังจัดส่ง", "เสร็จสิ้น", "ยกเลิก"].includes(o.status) && (
              <Button
                primary
                disabled={o.status === "กำลังจัดสินค้า" && (!o.accurate || o.allocations.some(a => !picked.includes(a.lot)))}
                onClick={next}
              >
                {o.status === "รอยืนยัน"
                  ? "ยืนยันคำสั่งซื้อ"
                  : o.status === "กำลังจัดสินค้า"
                    ? "จัดสินค้าเสร็จแล้ว"
                    : o.address
                      ? (s.deliveries.some(d => d.oid === id) ? "ดำเนินการจัดส่งต่อ" : "ออกจัดส่ง")
                      : "ลูกค้ารับสินค้าแล้ว"}
              </Button>
            )}
            {o.status === "กำลังจัดส่ง" && (
              <Button primary onClick={() => {const d=s.deliveries.find(d=>d.oid===id);if(d)open("delivery-detail",d.id);else go("delivery");}}>
                ยืนยันส่งมอบ / ติดตามการจัดส่ง
              </Button>
            )}
          </>
        }
      />
      <div className="record-heading">
        <div>
          <button className="customer-name" onClick={() => go("crm", "", c.id)}>
            {c.name}
          </button>
          <p>
            {c.phone} · {o.channel} · {o.address || "รับสินค้าหน้าร้าน"}
          </p>
        </div>
        <Badge>{o.status}</Badge>
      </div>
      {o.status !== "ยกเลิก" && (
        <div className="status-timeline">
          {stages.map((label, n) => (
            <div
              key={label}
              className={n < current ? "done" : n === current ? "current" : ""}
            >
              <span>{n < current ? <Check size={14} /> : n + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>
      )}
      {o.status === "ยกเลิก" && (
        <div className="notice">
          ยกเลิกคำสั่งซื้อแล้ว สินค้าและแต้มจากรายการนี้ถูกคืนเรียบร้อย
        </div>
      )}
      {o.status === "รอยืนยัน" && (
        <div className="notice">
          ยังไม่ตัดสต๊อกและยังไม่เพิ่มยอดซื้อในประวัติลูกค้า
          กรุณาตรวจรายการก่อนยืนยัน
        </div>
      )}
      <div className="notice">
        <strong>ขั้นตอนถัดไป: </strong>
        {o.status === "รอยืนยัน" ? "ฝ่ายขายตรวจลูกค้า จำนวน และการรับสินค้า ก่อนยืนยันคำสั่งซื้อ" : o.status === "กำลังจัดสินค้า" ? "คลังหยิบสินค้าตามห้องและล็อตด้านล่าง ทำเครื่องหมายทีละล็อต แล้วตรวจความครบถ้วน" : o.status === "พร้อมส่ง" ? (o.address ? "ระบุผู้ส่งและยืนยันออกจัดส่ง จากนั้นบันทึกผลส่งมอบสินค้า" : "ตรวจชื่อผู้รับและจำนวนสินค้าก่อนยืนยันรับหน้าร้าน") : o.status === "กำลังจัดส่ง" ? "กดยืนยันส่งมอบเมื่อสินค้าถึงลูกค้าแล้ว เพื่อปิดคำสั่งซื้อ" : "ตรวจประวัติการทำรายการด้านล่างได้"}
      </div>
      <Section title="รายการสินค้า">
        <DataTable
          rows={o.items.map((i) => ({ ...i, id: i.pid }))}
          columns={[
            { label: "สินค้า", cell: (i) => <b>{product(s, i.pid).name}</b> },
            {
              label: "จำนวน",
              align: "right",
              cell: (i) => i.qty + " " + product(s, i.pid).unit,
            },
            {
              label: "ราคาต่อหน่วย",
              align: "right",
              cell: (i) => "฿" + money(i.price),
            },
            {
              label: "รวม",
              align: "right",
              cell: (i) => "฿" + money(i.qty * i.price),
            },
          ]}
        />
        <div className="order-detail-total">
          <span>ส่วนลด {o.discount}%</span>
          <b>รวม ฿{money(sum(o))}</b>
        </div>
      </Section>
      {o.status !== "ยกเลิก" && o.allocations.length > 0 && (
        <Section
          title="สินค้าที่ต้องหยิบ"
          action={
            <span className="muted">ระบบเลือกล็อตที่หมดอายุก่อนให้แล้ว</span>
          }
        >
          <DataTable
            rows={o.allocations.map((a, n) => ({ ...a, id: a.lot + "-" + n }))}
            columns={[
              ...(o.status === "กำลังจัดสินค้า" ? [{ label: "ตรวจหยิบ", cell: (a: { lot: string; pid: string }) => <input type="checkbox" aria-label={"หยิบล็อต " + s.lots.find(l => l.id === a.lot)?.code} checked={picked.includes(a.lot)} disabled={role !== "ผู้จัดการ" && !warehouse} onChange={e => { const checked = e.target.checked; change("บันทึกการหยิบล็อตแล้ว", state => { const order = state.orders.find(x => x.id === id)!; order.pickedLots = checked ? [...new Set([...(order.pickedLots || []), a.lot])] : (order.pickedLots || []).filter(x => x !== a.lot); order.accurate = false; }); }} /> }] : []),
              { label: "สินค้า", cell: (a) => product(s, a.pid).name },
              { label: "ห้องเก็บ", cell: (a) => s.rooms.find(r => r.id === s.lots.find(l => l.id === a.lot)?.room)?.name },
              {
                label: "ล็อต",
                cell: (a) => s.lots.find((l) => l.id === a.lot)?.code,
              },
              {
                label: "จำนวนที่ต้องหยิบ",
                align: "right",
                cell: (a) => a.qty + " " + product(s, a.pid).unit,
              },
              {
                label: "หมดอายุ",
                cell: (a) => date(s.lots.find((l) => l.id === a.lot)!.expiry),
              },
            ]}
          />
          {o.status === "กำลังจัดสินค้า" && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={o.accurate && o.allocations.every(a => picked.includes(a.lot))}
                disabled={(role !== "ผู้จัดการ" && !warehouse) || o.allocations.some(a => !picked.includes(a.lot))}
                onChange={(e) =>
                  change("บันทึกผลตรวจสินค้าแล้ว", (s) => {
                    s.orders.find((x) => x.id === id)!.accurate =
                      e.target.checked;
                  })
                }
              />
              ตรวจแล้ว: ชนิดสินค้า จำนวน และล็อตถูกต้องครบถ้วน (หยิบแล้ว {o.allocations.filter(a => picked.includes(a.lot)).length}/{o.allocations.length} ล็อต)
            </label>
          )}
        </Section>
      )}
      {o.note && (
        <Section title="หมายเหตุ">
          <p>{o.note}</p>
        </Section>
      )}
      <Section title="บันทึกส่งต่องาน">
        <p className="muted">บันทึกข้อควรระวังหรือข้อมูลที่ทีมถัดไปต้องทราบ โดยเก็บผู้บันทึกและเวลาไว้ในประวัติ</p>
        <Field label="ข้อความส่งต่องาน"><textarea value={handoff} onChange={e => setHandoff(e.target.value)} placeholder="เช่น ลูกค้าจะรับสินค้าเวลา 15:00 น. กรุณาแยกถุงตามรายการ" rows={3} /></Field>
        <Button disabled={!handoff.trim()} onClick={() => { if (change("บันทึกส่งต่องานแล้ว", state => { state.orders.find(x => x.id === id)!.timeline.push({status: role + ": " + handoff.trim(), time: new Date().toISOString()}); })) setHandoff(""); }}>บันทึกส่งต่อ</Button>
      </Section>
      <details className="record-log">
        <summary>ประวัติคำสั่งซื้อ</summary>
        {o.timeline.map((t, n) => (
          <div key={n}>
            <small>
              {new Date(t.time).toLocaleString("th-TH-u-ca-gregory")}
            </small>
            <span>{t.status}</span>
          </div>
        ))}
      </details>
      {!warehouse && !o.receipt && !["กำลังจัดส่ง", "เสร็จสิ้น", "ยกเลิก"].includes(o.status) && (
        <div className="record-footer">
          <Button danger onClick={() => setCancelling(true)}>
            ยกเลิกคำสั่งซื้อ
          </Button>
        </div>
      )}
      {cancelling && (
        <Modal
          title="ต้องการยกเลิกคำสั่งซื้อนี้หรือไม่?"
          onClose={() => setCancelling(false)}
        >
          <p>
            {o.id} · {c.name}
          </p>
          <p>
            {o.reserved
              ? "ระบบจะคืนสินค้าเข้าล็อตเดิมและคืนแต้มที่ได้รับจากคำสั่งซื้อนี้"
              : "คำสั่งซื้อนี้ยังไม่ได้ตัดสต๊อก"}
          </p>
          <Field label="เหตุผลที่ยกเลิก" required error={error}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className="form-footer">
            <Button onClick={() => setCancelling(false)}>
              กลับไปคำสั่งซื้อ
            </Button>
            <Button
              danger
              onClick={() => {
                if (!reason.trim()) {
                  setError("ระบุเหตุผลที่ยกเลิก");
                  return;
                }
                if (
                  change("ยกเลิกคำสั่งซื้อและคืนสต๊อกแล้ว", (s) =>
                    cancelOrder(
                      s,
                      s.orders.find((x) => x.id === id)!,
                      reason,
                    ),
                  )
                )
                  setCancelling(false);
              }}
            >
              ยืนยันยกเลิก
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
