"use client";
import { useState } from "react";
import { Thermometer, TriangleAlert, Check, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useStore } from "./store";
import {
  Button,
  PageHeader,
  Section,
  DataTable,
  Badge,
  Filters,
  Empty,
} from "./ui";
import { recordTemperature, acknowledge, date, TODAY } from "@/lib/domain";
import { OpenForm } from "./orders";
export function ColdRoom({ open }: { open: OpenForm }) {
  const { s, change, role } = useStore();
  const [selected, setSelected] = useState(s.rooms[0].id);
  const [filter, setFilter] = useState("ยังไม่ปิด");
  const r = s.rooms.find((r) => r.id === selected)!;
  const abnormal = s.rooms.filter((r) => r.temp < r.min || r.temp > r.max);
  const incidents = s.incidents.filter(
    (i) => filter === "ทั้งหมด" || i.status !== "ปิด",
  );
  return (
    <>
      <PageHeader
        title="ห้องเย็น"
        description={`${s.rooms.length} ห้อง · ${abnormal.length ? "มี " + abnormal.length + " ห้องต้องตรวจสอบ" : "อุณหภูมิทุกห้องอยู่ในช่วงที่กำหนด"}`}
        actions={
          <Button onClick={() => open("temperature")}>
            จำลองอุณหภูมิผิดปกติ
          </Button>
        }
      />
      <div className="room-grid">
        {s.rooms.map((r) => {
          const bad = r.temp < r.min || r.temp > r.max,
            i = s.incidents.find((i) => i.room === r.id && i.status !== "ปิด");
          return (
            <section className={"room " + (bad ? "abnormal" : "")} key={r.id}>
              <div className="room-title">
                <h2>{r.name}</h2>
                <Thermometer size={18} />
              </div>
              <small>{r.category}</small>
              <div className="temperature">
                {r.temp.toFixed(1)}
                <span>°C</span>
              </div>
              <div className={"room-status " + (bad ? "danger-text" : "")}>
                {bad ? <TriangleAlert size={16} /> : <Check size={16} />}
                <b>{bad ? "อุณหภูมิผิดปกติ" : "ปกติ"}</b>
              </div>
              {bad && (
                <p>
                  {r.temp > r.max
                    ? "อุณหภูมิสูงกว่าค่าที่กำหนด"
                    : "อุณหภูมิต่ำกว่าค่าที่กำหนด"}
                </p>
              )}
              <div className="room-meta">
                <span>ช่วงที่กำหนด</span>
                <b>
                  {r.min} ถึง {r.max}°C
                </b>
              </div>
              <div className="room-meta">
                <span>อัปเดต</span>
                <b>
                  {new Date(r.updated).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </b>
              </div>
              <small className="sensor-status">
                <span className="status-dot" />
                {r.sensor
                  ? "เครื่องวัดเชื่อมต่ออยู่"
                  : "เครื่องวัดขาดการเชื่อมต่อ"}
              </small>
              <div className="actions">
                {i ? (
                  <>
                    <Button
                      primary={bad}
                      onClick={() => open("incident", i.id)}
                    >
                      ตรวจสอบเหตุการณ์
                    </Button>
                    {i.status === "เปิด" && (
                      <Button
                        onClick={() =>
                          change("รับทราบเหตุการณ์แล้ว", (s) =>
                            acknowledge(
                              s.incidents.find((x) => x.id === i.id)!,
                              role,
                            ),
                          )
                        }
                      >
                        รับทราบ
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setSelected(r.id);
                      document
                        .getElementById("temperature-history")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    ประวัติอุณหภูมิ
                  </Button>
                )}
                <Button small onClick={() => open("room", r.id)}>
                  ตั้งเกณฑ์
                </Button>
              </div>
            </section>
          );
        })}
      </div>
      <Section
        title="เหตุการณ์อุณหภูมิ"
        action={
          <Filters
            value={filter}
            onChange={setFilter}
            items={[
              {
                value: "ยังไม่ปิด",
                label: "ยังไม่ปิด",
                count: s.incidents.filter((i) => i.status !== "ปิด").length,
              },
              { value: "ทั้งหมด", label: "ทั้งหมด", count: s.incidents.length },
            ]}
          />
        }
      >
        <DataTable
          rows={incidents}
          onRow={(i) => open("incident", i.id)}
          empty={
            <Empty
              title="ไม่มีเหตุการณ์ที่รอตรวจสอบ"
              description="เลือก “ทั้งหมด” เพื่อดูเหตุการณ์ที่ผ่านมา"
            />
          }
          columns={[
            {
              label: "ห้อง / เหตุการณ์",
              cell: (i) => (
                <>
                  <b>{s.rooms.find((r) => r.id === i.room)?.name}</b>
                  <small>{i.id}</small>
                </>
              ),
            },
            {
              label: "ตรวจพบ",
              cell: (i) => (
                <>
                  {date(i.detected)}
                  <small>
                    {new Date(i.detected).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </>
              ),
            },
            {
              label: "อุณหภูมิ",
              cell: (i) => <strong className="danger-text">{i.temp}°C</strong>,
            },
            {
              label: "เวลาแจ้งเตือน",
              cell: (i) => (
                <>
                  {Math.round(
                    (Date.parse(i.notified) - Date.parse(i.detected)) / 1000,
                  )}{" "}
                  วินาที<small>เป้าหมายไม่เกิน 60 วินาที</small>
                </>
              ),
            },
            {
              label: "ผู้รับผิดชอบ",
              cell: (i) => i.assigned || "ยังไม่ได้รับทราบ",
              className: "secondary-column",
            },
            { label: "สถานะ", cell: (i) => <Badge>{i.status}</Badge> },
            {
              label: "",
              cell: (i) => (
                <Button
                  small
                  onClick={(e) => {
                    e.stopPropagation();
                    open("incident", i.id);
                  }}
                >
                  ตรวจสอบ →
                </Button>
              ),
            },
          ]}
        />
      </Section>
      <div id="temperature-history">
        <Section
          title="อุณหภูมิย้อนหลัง"
          action={
            <select
              aria-label="เลือกห้องดูประวัติ"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {s.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          }
        >
          <p className="chart-caption">
            {r.name} · ค่าล่าสุดจากการจำลอง {r.history.length} ครั้ง
          </p>
          <div className="temperature-chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={r.history.map((v, n) => ({ reading: n + 1, temp: v }))}
                margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="reading"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[-28, -8]}
                  unit="°"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  labelFormatter={(v) => "ค่าครั้งที่ " + v}
                  formatter={(v) => [String(v) + "°C", "อุณหภูมิ"]}
                />
                <ReferenceLine
                  y={r.max}
                  stroke="#b7791f"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={r.min}
                  stroke="#aeb9c6"
                  strokeDasharray="4 4"
                />
                <Line
                  dataKey="temp"
                  stroke="#27628d"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </>
  );
}
