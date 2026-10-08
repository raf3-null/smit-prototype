import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSeed,
  addWalkInExamples,
  stock,
  allocate,
  createOrder,
  confirmOrder,
  cancelOrder,
  advanceOrder,
  issueReceipt,
  recordTemperature,
  acknowledge,
  closeIncident,
  alerts,
  group,
  campaignRecipients,
  sendCampaign,
  validateState,
  customer,
  ordersFor,
  sum,
  TODAY,
} from "../src/lib/domain";
import { metrics } from "../src/lib/metrics";
const request = {
  cid: "C7",
  channel: "LINE" as const,
  discount: 5,
  address: "",
  note: "",
  items: [{ pid: "P007", qty: 10 }],
  employee: "พนักงานขาย",
};
test("connected realistic sample data", () => {
  const s = createSeed();
  assert.equal(s.products.length, 20);
  assert.equal(s.customers.length, 21);
  assert(s.orders.length >= 30);
  assert.equal(s.rooms.length, 3);
  assert.equal(s.incidents.length, 5);
  assert.equal(s.campaigns.length, 5);
  assert(validateState(s));
  assert(
    s.orders.every((o) =>
      o.items.every((i) => s.products.some((p) => p.id === i.pid)),
    ),
  );
});
test("lot recommendation splits demand and excludes expired lots", () => {
  const s = createSeed();
  const a = allocate(s, [{ pid: "P007", qty: 40 }]);
  assert.equal(a[0].lot, "L009");
  assert.equal(a[0].qty, 30);
  assert.equal(a[1].lot, "L030");
  assert.equal(a[1].qty, 10);
  assert.equal(stock(s, "P003"), 185);
  assert.throws(() =>
    allocate(s, [
      { pid: "P007", qty: 60 },
      { pid: "P007", qty: 50 },
    ]),
  );
  assert.throws(() => allocate(s, [{ pid: "P007", qty: 0.001 }]));
  assert.throws(() => allocate(s, []));
});
test("LINE order updates stock, lots, history, spending, points and performance counts", () => {
  const s = createSeed(),
    before = stock(s, "P007"),
    history = ordersFor(s, "C7").length,
    spending = ordersFor(s, "C7").reduce((a, o) => a + sum(o), 0),
    points = customer(s, "C7").points,
    captured = s.kpi.totalCaptured;
  const o = createOrder(s, request);
  assert.equal(stock(s, "P007"), before - 10);
  assert.equal(ordersFor(s, "C7").length, history + 1);
  assert.equal(
    ordersFor(s, "C7").reduce((a, o) => a + sum(o), 0),
    spending + sum(o),
  );
  assert.equal(customer(s, "C7").points, points + Math.floor(sum(o) / 100));
  assert.equal(s.kpi.totalCaptured, captured + 1);
  assert.equal(o.status, "กำลังจัดสินค้า");
  assert(o.reserved);
  assert.equal(o.allocations[0].pid, "P007");
});
test("invalid order is atomic across all products and fields", () => {
  const s = createSeed(),
    before = JSON.stringify(s);
  assert.throws(() =>
    createOrder(s, {
      ...request,
      items: [
        { pid: "P007", qty: 1 },
        { pid: "P003", qty: 9999 },
      ],
    }),
  );
  assert.equal(JSON.stringify(s), before);
  assert.throws(() => createOrder(s, { ...request, discount: 101 }));
  assert.equal(JSON.stringify(s), before);
});
test("pending order defers stock and history until confirmation", () => {
  const s = createSeed(),
    before = stock(s, "P007"),
    points = customer(s, "C7").points,
    history = ordersFor(s, "C7").length;
  const o = createOrder(s, { ...request, pending: true });
  assert.equal(o.status, "รอยืนยัน");
  assert.equal(stock(s, "P007"), before);
  assert.equal(customer(s, "C7").points, points);
  assert.equal(ordersFor(s, "C7").length, history);
  confirmOrder(s, o);
  assert.equal(stock(s, "P007"), before - 10);
  assert.equal(ordersFor(s, "C7").length, history + 1);
  assert.throws(() => confirmOrder(s, o));
});
test("cancellation restores original lot and points once, removes from sales history", () => {
  const s = createSeed(),
    before = stock(s, "P007"),
    points = customer(s, "C7").points,
    h = ordersFor(s, "C7").length;
  const o = createOrder(s, request);
  assert.throws(() => cancelOrder(s, o, ""));
  cancelOrder(s, o, "ลูกค้าเปลี่ยนรายการ");
  assert.equal(stock(s, "P007"), before);
  assert.equal(customer(s, "C7").points, points);
  assert.equal(ordersFor(s, "C7").length, h);
  cancelOrder(s, o, "อีกครั้ง");
  assert.equal(stock(s, "P007"), before);
});
test("status transitions prevent skipping and completed order reversal", () => {
  const s = createSeed(),
    o = createOrder(s, request);
  assert.throws(() => advanceOrder(o, "เสร็จสิ้น"));
  assert.throws(() => advanceOrder(o, "พร้อมส่ง"));
  o.accurate = true;
  advanceOrder(o, "พร้อมส่ง");
  advanceOrder(o, "เสร็จสิ้น");
  assert.throws(() => advanceOrder(o, "รอยืนยัน"));
  assert.throws(() => cancelOrder(s, o, "ย้อนหลัง"));
});
test("temperature incident shares alert and metrics, ack and resolution keep audit timestamps", () => {
  const s = createSeed(),
    r = s.rooms[0],
    before = s.incidents.length;
  recordTemperature(s, r, -10, 35);
  const i = s.incidents[0];
  assert.equal(s.incidents.length, before + 1);
  assert(alerts(s).some((a) => a.id === i.id));
  assert.equal(metrics(s, "all").find((m) => m.key === "latency")!.value, 35);
  recordTemperature(s, r, -9);
  assert.equal(s.incidents.length, before + 1);
  acknowledge(i, "คุณเอก");
  assert(i.acknowledged);
  assert.equal(i.assigned, "คุณเอก");
  assert(Date.parse(i.detected) <= Date.parse(i.notified));
  assert(Date.parse(i.notified) <= Date.parse(i.acknowledged!));
  assert.throws(() => closeIncident(s, i, "ตรวจแล้ว"));
  recordTemperature(s, r, -20);
  closeIncident(s, i, "ปิดประตูให้สนิท");
  assert.equal(i.status, "ปิด");
  assert(!alerts(s).some((a) => a.id === i.id));
});
test("customer grouping and win-back recipients derive from purchase history", () => {
  const s = createSeed();
  assert.equal(group(s, customer(s, "C4")), "ไม่ได้ซื้อนาน");
  assert.equal(group(s, customer(s, "C9")), "ลูกค้าประจำ");
  const c = s.campaigns.find((c) => c.id === "M2")!;
  assert(campaignRecipients(s, c).some((c) => c.id === "C4"));
  sendCampaign(s, c);
  assert.equal(c.status, "ส่งแล้ว");
  assert.equal(s.messages.length, c.recipients.length);
  assert(s.messages.every((m) => m.campaign === c.id && m.channel === "LINE"));
  assert.throws(() => sendCampaign(s, c));
});
test("performance avoids fake monthly uptime and actual prior comparison", () => {
  const s = createSeed();
  assert.equal(
    metrics(s, "2026-10").find((m) => m.key === "uptime")!.value,
    null,
  );
  assert.equal(
    metrics(s, "2026-10").find((m) => m.key === "capture")!.value,
    null,
  );
  assert.equal(
    metrics(s, "2026-09").find((m) => m.key === "latency")!.value,
    35,
  );
  assert.equal(metrics(s, "all").length, 9);
  assert(metrics(s, "2026-10").find((m) => m.key === "order")!.trend !== null);
});
test("backup import rejects negative inventory and broken references", () => {
  const s = createSeed();
  s.lots[0].qty = -1;
  assert(!validateState(s));
  const bad = createSeed();
  bad.orders[0].cid = "missing";
  assert(!validateState(bad));
  assert(!validateState({}));
});

test("import validation protects room, promotion and settings rendering", () => {
  const s = createSeed();
  (s.rooms[0] as any).history = undefined;
  assert(!validateState(s));
  const c = createSeed();
  (c.campaigns[0] as any).recipients = null;
  assert(!validateState(c));
  const k = createSeed();
  k.settings.regularOrders = 0;
  assert(!validateState(k));
  assert(!validateState({ products: [null] }));
});

test("picking checklist must cover every allocated lot before handoff", () => {
 const s = createSeed(); const o = createOrder(s, {...request, items: [{pid: "P007", qty: 40}]});
 o.accurate = true; o.pickedLots = [o.allocations[0].lot];
 assert.throws(() => advanceOrder(o, "พร้อมส่ง"));
 assert.equal(o.status, "กำลังจัดสินค้า");
 o.pickedLots = o.allocations.map(a => a.lot);
 advanceOrder(o, "พร้อมส่ง"); assert.equal(o.status, "พร้อมส่ง");
});

test("receipt records exact net amount, prevents duplicate issue and cancellation", () => {
 const s = createSeed(); const o = createOrder(s, request);
 assert.throws(()=>issueReceipt(o,"โอนเงิน","","ขาย"));
 issueReceipt(o,"โอนเงิน","TEST-001","ขาย");
 assert.equal(o.receipt!.amount,sum(o)); assert.equal(o.receipt!.reference,"TEST-001");
 assert.throws(()=>issueReceipt(o,"เงินสด","","ขาย"));
 assert.throws(()=>cancelOrder(s,o,"ยกเลิก"));
 const pending = createOrder(s,{...request, pending:true}); assert.throws(()=>issueReceipt(pending,"เงินสด","","ขาย"));
});

import {trainingData,saveResult} from '../src/lib/training';
test('training seeds relevant assignments and requires reason for result correction',()=>{
 const s=createSeed();const d=trainingData(s);assert.equal(d.courses.length,4);s.trainingData=d;const e=d.enrollments[0];
 assert.throws(()=>saveResult(s,e.id,{attendance:'เข้าอบรม',score:101,note:'',reason:''},'ผู้จัดการ'));
 saveResult(s,e.id,{attendance:'เข้าอบรม',score:85,note:'ผ่าน',reason:''},'ผู้จัดการ');assert.equal(e.status,'ผ่าน');assert.ok(e.review);
 assert.throws(()=>saveResult(s,e.id,{attendance:'เข้าอบรม',score:60,note:'',reason:''},'ผู้จัดการ'));
 saveResult(s,e.id,{attendance:'เข้าอบรม',score:60,note:'ทบทวน',reason:'แก้คะแนนตามแบบประเมิน'},'ผู้จัดการ');assert.equal(e.status,'ต้องทบทวน');assert.equal(e.history.length,2);assert.equal(e.review,'');
});

test("walk-in baseline has ten completed receipts and migrates without duplicates", () => {
  const s=createSeed();
  const orders=s.orders.filter(o=>o.cid==='C-WALKIN');
  assert.equal(orders.length,10);
  assert(orders.every(o=>o.channel==='หน้าร้าน' && !o.address && o.status==='เสร็จสิ้น' && o.receipt?.amount===sum(o)));
  assert.equal(customer(s,'C-WALKIN').phone,'');
  const count=s.orders.length;
  addWalkInExamples(s); addWalkInExamples(s);
  assert.equal(s.orders.length,count);
  assert(validateState(s));
});
