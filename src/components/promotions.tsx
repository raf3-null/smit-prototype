"use client";
import { useState } from "react";
import { Plus, Send, Check, ArrowRight } from "lucide-react";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  DataTable,
  Badge,
  SearchInput,
  Section,
  Field,
  Empty,
  Modal,
  SimpleForm,
  StatStrip,
} from "./ui";
import {
  Campaign,
  TODAY,
  uid,
  money,
  date,
  customer,
  group,
  campaignRecipients,
  sendCampaign,
  favoriteCategory,
} from "@/lib/domain";
import { Navigate, OpenForm } from "./orders";
export function Promotions({ go, open }: { go: Navigate; open: OpenForm }) {
  const { s } = useStore();
  const [search, setSearch] = useState("");
  return (
    <>
      <PageHeader
        title="โปรโมชั่น"
        description={`${s.campaigns.length} โปรโมชั่น · เลือกข้อเสนอให้เหมาะกับประวัติการซื้อของลูกค้า`}
        actions={
          <Button primary onClick={() => go("new-promotion")}>
            <Plus size={16} />
            สร้างโปรโมชั่น
          </Button>
        }
      />
      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="ค้นหาชื่อโปรโมชั่น / กลุ่มลูกค้า"
        />
      </div>
      <DataTable
        rows={s.campaigns.filter((c) =>
          [c.name, c.segment].join(" ").includes(search),
        )}
        onRow={(c) => go("marketing", "", c.id)}
        columns={[
          {
            label: "โปรโมชั่น",
            cell: (c) => (
              <>
                <b>{c.name}</b>
                <small>
                  {c.start && date(c.start)} – {c.end && date(c.end)}
                </small>
              </>
            ),
          },
          {
            label: "กลุ่มลูกค้า",
            cell: (c) =>
              c.customerId ? customer(s, c.customerId).name : c.segment,
          },
          { label: "ส่วนลด", align: "right", cell: (c) => c.discount + "%" },
          {
            label: "ช่องทาง",
            cell: (c) => c.channel,
            className: "secondary-column",
          },
          { label: "สถานะ", cell: (c) => <Badge>{c.status}</Badge> },
          {
            label: "ผู้รับ",
            align: "right",
            cell: (c) =>
              c.status === "ส่งแล้ว"
                ? c.recipients.length + " ราย"
                : campaignRecipients(s, c).length + " รายที่เข้าเกณฑ์",
          },
          {
            label: "",
            cell: (c) => (
              <Button
                small
                onClick={(e) => {
                  e.stopPropagation();
                  go("marketing", "", c.id);
                }}
              >
                {c.status === "ส่งแล้ว" ? "ดูผลการส่ง" : "ตรวจและส่ง"} →
              </Button>
            ),
          },
        ]}
      />
      <div className="split-layout loyalty-section">
        <Section
          title="แต้มสะสมและการแนะนำลูกค้า"
          action={<Button onClick={() => open("redeem")}>แลกแต้ม</Button>}
        >
          <p>
            ทุกยอดซื้อ ฿{s.settings.loyaltyRate} ได้ 1 แต้ม ·
            ผู้แนะนำลูกค้าใหม่รับ {s.settings.referralPoints} แต้ม
          </p>
          <DataTable
            rows={s.customers
              .filter((c) => c.points > 0)
              .sort((a, b) => b.points - a.points)
              .slice(0, 8)}
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
                label: "แต้มสะสม",
                align: "right",
                cell: (c) => money(c.points),
              },
              {
                label: "",
                cell: (c) => (
                  <Button small onClick={() => open("redeem", c.id)}>
                    แลกแต้ม
                  </Button>
                ),
              },
            ]}
          />
        </Section>
        <Section title="ข้อความที่ส่งล่าสุด">
          <p className="muted">
            เป็นการส่งจำลอง ไม่มีข้อความส่งออกไปยังลูกค้าจริง
          </p>
          {s.messages.length ? (
            s.messages.slice(0, 6).map((m) => (
              <div key={m.id} className="message-history">
                <b>{customer(s, m.cid).name}</b>
                <span>
                  {m.channel} · {date(m.date)}
                </span>
                <p>{m.text}</p>
              </div>
            ))
          ) : (
            <Empty
              title="ยังไม่มีประวัติการส่ง"
              description="เลือกโปรโมชั่นแล้วตรวจตัวอย่างก่อนส่ง"
            />
          )}
        </Section>
      </div>
    </>
  );
}
export function NewPromotion({
  go,
  customerId = "",
  initial = "",
}: {
  go: Navigate;
  customerId?: string;
  initial?: string;
}) {
  const { s, change } = useStore();
  const c = customerId ? customer(s, customerId) : undefined;
  const [name, setName] = useState(
    initial === "winback"
      ? "เรียกลูกค้ากลับมา"
      : initial && initial !== "ไม่ได้ซื้อนาน" && c
        ? "โปรโมชั่นสินค้า" + initial
        : "",
  );
  const [segment, setSegment] = useState(
    initial === "winback"
      ? "ไม่ได้ซื้อนาน"
      : [
            "ลูกค้าใหม่",
            "ลูกค้าประจำ",
            "ลูกค้าซื้อซ้ำ",
            "ไม่ได้ซื้อนาน",
            "ซื้อสินค้าประเภทเดิม",
            "ทุกกลุ่ม",
          ].includes(initial)
        ? initial
        : c
          ? "ซื้อสินค้าประเภทเดิม"
          : "ลูกค้าใหม่",
  );
  const [category, setCategory] = useState(
    c ? favoriteCategory(s, c.id) || "หมู" : "หมู",
  );
  const [discount, setDiscount] = useState(initial === "winback" ? 8 : 5);
  const [channel, setChannel] = useState("LINE");
  const [text, setText] = useState(
    initial === "winback"
      ? "ไม่ได้เจอกันนาน ร้านศาศวัต ห้องเย็นมีสินค้าเข้าใหม่ รับส่วนลด 8% สำหรับคำสั่งซื้อครั้งถัดไปค่ะ"
      : "",
  );
  const [start, setStart] = useState(TODAY);
  const [end, setEnd] = useState("2026-10-31");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const campaign: Campaign = {
    id: "",
    name,
    segment,
    category,
    discount,
    text,
    status: "ร่าง",
    recipients: [],
    channel,
    start,
    end,
    customerId: customerId || undefined,
  };
  const recipients = campaignRecipients(s, campaign);
  const validate = () => {
    if (!name.trim() || !text.trim())
      throw Error("ระบุชื่อโปรโมชั่นและข้อความสำหรับลูกค้า");
    if (discount < 0 || discount > 100)
      throw Error("ส่วนลดต้องอยู่ระหว่าง 0–100%");
    if (!start || !end || end < start)
      throw Error("วันสิ้นสุดต้องไม่ก่อนวันเริ่ม");
    if (!recipients.length) throw Error("ยังไม่มีลูกค้าในกลุ่มนี้");
  };
  const save = (send: boolean) => {
    try {
      validate();
      let id = "";
      const ok = change(
        send
          ? "บันทึกโปรโมชั่นและส่งข้อความจำลองแล้ว"
          : "บันทึกร่างโปรโมชั่นแล้ว",
        (s) => {
          const p = { ...campaign, id: uid("M") };
          id = p.id;
          s.campaigns.unshift(p);
          if (send) sendCampaign(s, p);
        },
      );
      if (ok) go("marketing", "", id);
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <>
      <PageHeader
        title="สร้างโปรโมชั่น"
        description={
          c
            ? "ข้อเสนอสำหรับ " + c.name
            : "เลือกกลุ่มลูกค้า สร้างข้อเสนอ แล้วตรวจข้อความก่อนส่ง"
        }
        back={() => go("marketing")}
      />
      <div className="promotion-workspace">
        <div>
          <Section title="1. เลือกผู้รับ">
            {c ? (
              <div className="selected-customer">
                <div>
                  <strong>{c.name}</strong>
                  <small>
                    {c.phone} · {group(s, c)}
                  </small>
                </div>
              </div>
            ) : (
              <Field label="กลุ่มลูกค้า">
                <select
                  value={segment}
                  onChange={(e) => {
                    setSegment(e.target.value);
                    setPreview(false);
                  }}
                >
                  {[
                    "ลูกค้าใหม่",
                    "ลูกค้าประจำ",
                    "ลูกค้าซื้อซ้ำ",
                    "ไม่ได้ซื้อนาน",
                    "ซื้อสินค้าประเภทเดิม",
                    "แนะนำลูกค้าใหม่",
                    "ทุกกลุ่ม",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            )}
            {segment === "ซื้อสินค้าประเภทเดิม" && !c && (
              <Field label="ประเภทสินค้าที่ซื้อเป็นประจำ">
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPreview(false);
                  }}
                >
                  {[...new Set(s.products.map((p) => p.category))].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            )}
            <p>
              ผู้รับที่เข้าเกณฑ์ {recipients.length} ราย ·
              คำนวณจากประวัติการซื้อปัจจุบัน
            </p>
          </Section>
          <Section title="2. สร้างข้อเสนอ">
            <Field label="ชื่อโปรโมชั่น" required>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setPreview(false);
                }}
              />
            </Field>
            <div className="form-grid">
              <Field label="ส่วนลด (%)" required>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => {
                    setDiscount(+e.target.value);
                    setPreview(false);
                  }}
                />
              </Field>
              <Field label="ช่องทาง">
                <select
                  value={channel}
                  onChange={(e) => {
                    setChannel(e.target.value);
                    setPreview(false);
                  }}
                >
                  <option>LINE</option>
                  <option>SMS</option>
                  <option>การแจ้งเตือน</option>
                </select>
              </Field>
              <Field label="วันที่เริ่ม" required>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => {
                    setStart(e.target.value);
                    setPreview(false);
                  }}
                />
              </Field>
              <Field label="วันที่สิ้นสุด" required>
                <input
                  type="date"
                  min={start}
                  value={end}
                  onChange={(e) => {
                    setEnd(e.target.value);
                    setPreview(false);
                  }}
                />
              </Field>
            </div>
            <Field label="ข้อความสำหรับลูกค้า" required>
              <textarea
                rows={5}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setPreview(false);
                }}
              />
            </Field>
          </Section>
        </div>
        <section className="promotion-review">
          <h2>3. ตรวจตัวอย่างและส่ง</h2>
          <p>
            {channel} · ผู้รับ {recipients.length} ราย
          </p>
          <div className="message-preview">
            <small>ศาศวัต ห้องเย็น</small>
            <p>{text || "ข้อความสำหรับลูกค้าจะแสดงที่นี่"}</p>
            {text && (
              <span>
                ส่วนลด {discount}% · ถึง {date(end || TODAY)}
              </span>
            )}
          </div>
          {preview && (
            <>
              <h3>รายชื่อผู้รับ</h3>
              <div className="recipient-preview">
                {recipients.map((c) => (
                  <div key={c.id}>
                    <b>{c.name}</b>
                    <small>{c.phone}</small>
                  </div>
                ))}
              </div>
              <div className="notice">
                ส่งจำลองเท่านั้น ไม่มีข้อความออกไปยังลูกค้าจริง
              </div>
            </>
          )}
          {error && (
            <div className="inline-error" role="alert">
              {error}
            </div>
          )}
          <div className="actions">
            <Button onClick={() => save(false)}>บันทึกร่าง</Button>
            <Button
              primary
              disabled={!recipients.length}
              onClick={() => {
                if (preview) save(true);
                else
                  try {
                    validate();
                    setPreview(true);
                    setError("");
                  } catch (err) {
                    setError((err as Error).message);
                  }
              }}
            >
              {preview ? (
                <>
                  <Send size={16} />
                  ส่งโปรโมชั่นจำลอง
                </>
              ) : (
                "ตรวจข้อความและผู้รับ"
              )}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
export function PromotionDetail({ id, go }: { id: string; go: Navigate }) {
  const { s, change } = useStore();
  const [preview, setPreview] = useState(false);
  const p = s.campaigns.find((x) => x.id === id);
  if (!p) return <Empty title="ไม่พบโปรโมชั่น" />;
  const recipients =
    p.status === "ส่งแล้ว"
      ? s.customers.filter((c) => p.recipients.includes(c.id))
      : campaignRecipients(s, p);
  return (
    <>
      <Button onClick={()=>go("line","",id)}>เตรียมข้อความ LINE</Button>
      <PageHeader
        title={p.name}
        description={`${p.channel} · ${date(p.start)} – ${date(p.end)} · ส่วนลด ${p.discount}%`}
        back={() => go("marketing")}
        actions={
          p.status === "ร่าง" && (
            <Button
              primary
              disabled={!recipients.length}
              onClick={() => setPreview(true)}
            >
              ตรวจตัวอย่างก่อนส่ง
            </Button>
          )
        }
      />
      <div className="record-heading">
        <p>
          กลุ่มผู้รับ:{" "}
          {p.customerId ? customer(s, p.customerId).name : p.segment}
        </p>
        <Badge>{p.status}</Badge>
      </div>
      <Section title="ข้อความสำหรับลูกค้า">
        <div className="message-preview">
          <small>ศาศวัต ห้องเย็น</small>
          <p>{p.text}</p>
        </div>
      </Section>
      <Section title={"ผู้รับ " + recipients.length + " ราย"}>
        <DataTable
          rows={recipients}
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
            { label: "เบอร์โทร", cell: (c) => c.phone },
            { label: "กลุ่ม", cell: (c) => group(s, c) },
          ]}
        />
      </Section>
      {p.status === "ส่งแล้ว" && (
        <div className="notice success">
          <Check size={16} />
          ส่งข้อความจำลองให้ {p.recipients.length} รายแล้ว
          ดูประวัติได้ในหน้าโปรโมชั่น
        </div>
      )}
      {preview && (
        <Modal
          title="ตรวจตัวอย่างก่อนส่งโปรโมชั่น"
          onClose={() => setPreview(false)}
        >
          <div className="message-preview">
            <small>ศาศวัต ห้องเย็น · {p.channel}</small>
            <p>{p.text}</p>
          </div>
          <p>
            ผู้รับ {recipients.length} ราย · ส่วนลด {p.discount}%
          </p>
          <div className="notice">
            การส่งนี้เป็นการจำลอง ไม่มีข้อความออกไปยังลูกค้าจริง
          </div>
          <div className="form-footer">
            <Button onClick={() => setPreview(false)}>กลับไปตรวจสอบ</Button>
            <Button
              primary
              onClick={() => {
                if (
                  change("ส่งโปรโมชั่นจำลองแล้ว", (s) =>
                    sendCampaign(
                      s,
                      s.campaigns.find((x) => x.id === id)!,
                    ),
                  )
                )
                  setPreview(false);
              }}
            >
              <Send size={16} />
              ส่งโปรโมชั่นจำลอง
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
