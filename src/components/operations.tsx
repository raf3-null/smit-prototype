"use client";
import { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  LayoutList,
  ClipboardList,
  Package,
  Thermometer,
  Users,
  Tags,
  ChartNoAxesCombined,
  Settings as SettingsIcon,
  Bell,
  Truck,
  Contact,
  UserRound,
  Menu,
  Search,
  X,
  ChevronDown,
  ArrowRight,
  Warehouse,
  Boxes,
  Check,
  TriangleAlert,
} from "lucide-react";
import { useStore } from "./store";
import {
  createSeed,
  Role,
  alerts,
  stock,
  money,
  date,
  TODAY,
  customer,
  product,
  group,
} from "@/lib/domain";
import {
  PageHeader,
  Button,
  ActionRow,
  Filters,
  Modal,
  SearchInput,
  Empty,
} from "./ui";
import { OrderList, NewOrder, OrderDetail, Navigate, OpenForm } from "./orders";
import { Inventory } from "./inventory";
import { ColdRoom } from "./coldroom";
import { Customers, CustomerDetail, Groups } from "./customers";
import { Promotions, NewPromotion, PromotionDetail } from "./promotions";
import {
  download,
  Home,
  Performance,
  Analytics,
  Delivery,
  Suppliers,
  Service,
  Team,
  Settings,
} from "./management";
import { Forms } from "./forms";
import Driver from "./driver";
import LineWorkspace from "./line-workspace";
import Training from "./training";
import OnlineIntake from "./online-intake";
const navigation = [
  {
    section: "",
    items: [{ route: "dashboard", title: "ภาพรวม", icon: LayoutList }],
  },
  {
    section: "งานประจำวัน",
    items: [
      { route: "orders", title: "คำสั่งซื้อ", icon: ClipboardList },
      { route: "inventory", title: "สินค้าและสต๊อก", icon: Package },
      { route: "coldroom", title: "ห้องเย็น", icon: Thermometer },
      { route: "delivery", title: "การจัดส่ง", icon: Truck },
    ],
  },
  {
    section: "ลูกค้า",
    items: [
      { route: "crm", title: "รายชื่อลูกค้า", icon: Contact },
      { route: "groups", title: "กลุ่มลูกค้า", icon: Users },
      { route: "marketing", title: "โปรโมชั่น", icon: Tags },
      { route: "line", title: "ข้อความ LINE", icon: Contact },
      { route: "service", title: "ติดตามและบริการ", icon: Contact },
    ],
  },
  {
    section: "วิเคราะห์",
    manager: true,
    items: [
      { route: "kpi", title: "ผลการดำเนินงาน", icon: ChartNoAxesCombined },
      { route: "analytics", title: "ยอดขายและแผนเติมสินค้า", icon: Boxes },
      { route: "suppliers", title: "สั่งซื้อและผู้ขาย", icon: Warehouse },
    ],
  },
  {
    section: "ระบบ",
    items: [
      { route: "alerts", title: "การแจ้งเตือน", icon: Bell },
      { route: "team", title: "พนักงานและการอบรม", icon: UserRound },
      { route: "settings", title: "ตั้งค่า", icon: SettingsIcon },
    ],
  },
];
const roleRoutes: Record<string, string[]> = {
  พนักงานส่งของ: ["dashboard", "delivery"],
  พนักงานขาย: ["dashboard", "orders", "inventory", "delivery", "crm", "groups", "marketing", "line", "service", "alerts", "team", "new-order"],
  พนักงานคลัง: ["dashboard", "orders", "inventory", "delivery", "alerts", "team"],
  ผู้ดูแลห้องเย็น: ["dashboard", "coldroom", "inventory", "alerts", "team"],
};
function canAccess(role: string, route: string) {
  return role === "ผู้จัดการ" || (roleRoutes[role] || []).includes(route);
}
const titles = Object.fromEntries(
  navigation.flatMap((g) => g.items).map((x) => [x.route, x.title]),
);
const aliases: Record<string, string> = { store: "online-order" };
function parseRoute() {
  const [r = "dashboard", query = ""] = window.location.hash
      .slice(1)
      .split("?"),
    params = new URLSearchParams(query);
  return {
    page: aliases[r] || r,
    filter: params.get("filter") || "",
    entity: params.get("item") || "",
  };
}
export default function Operations() {
  const { s, role, setRole, change, toast, toastKind, ready, replace, notify } = useStore();
  const [location, setLocation] = useState({
    page: "dashboard",
    filter: "",
    entity: "",
  });
  const [customerAdded, setCustomerAdded] = useState("");
  const [form, setForm] = useState<{ kind: string; id?: string } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [notificationPanel, setNotificationPanel] = useState(false);
  const list = alerts(s);
  const unread = list.filter((a) => !s.readAlerts.includes(a.id)).length;
  useEffect(() => {
    const onHash = () => {
      const p = parseRoute();
      if (
        !titles[p.page] &&
        !["new-order", "new-promotion", "online-order"].includes(p.page)
      )
        p.page = "dashboard";
      setLocation(p);
      setMenu(false);
      setForm(null);
      window.scrollTo(0, 0);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go: Navigate = useCallback((page, filter = "", entity = "") => {
    setNotificationPanel(false);
    setSearchOpen(false);
    setMenu(false);
    setForm(null);
    setCustomerAdded("");
    const q = new URLSearchParams();
    if (filter) q.set("filter", filter);
    if (entity) q.set("item", entity);
    const hash = page + (q.size ? "?" + q.toString() : "");
    window.location.hash = hash;
    setLocation({ page, filter, entity });
    window.scrollTo(0, 0);
  }, []);
  const open = (kind: string, id?: string) => {
    setNotificationPanel(false);
    setForm({ kind, id });
  };
  const sidebarGo = (r: string) => {
    if (location.page === "new-order" || location.page === "new-promotion")
      setPendingNav(r);
    else go(r);
  };
  let content: React.ReactNode;
  const p = location.page,
    filter = location.filter,
    entity = location.entity;
  const managerPage = !canAccess(role, p);
  if (managerPage)
    content = (
      <Empty
        title="หน้านี้ไม่อยู่ในงานของบทบาทที่เลือก"
        description="กลับไปงานวันนี้เพื่อดูเมนูสำหรับบทบาทของคุณ"
        action={
          <Button onClick={() => go("dashboard")}>กลับไปงานวันนี้</Button>
        }
      />
    );
  else
    switch (p) {
      case "dashboard":
        content = role === "พนักงานส่งของ" ? <Driver/> : <Home go={go} open={open} />;
        break;
      case "orders":
        content = entity ? (
          <OrderDetail id={entity} go={go} open={open} />
        ) : (
          <OrderList filter={filter} go={go} open={open} />
        );
        break;
      case "online-order":
        content = <OnlineIntake go={go} />;
        break;
      case "new-order":
        content = (
          <NewOrder
            go={go}
            open={open}
            customerId={entity}
            customerAdded={customerAdded}
          />
        );
        break;
      case "inventory":
        content = <Inventory filter={filter} go={go} open={open} />;
        break;
      case "coldroom":
        content = <ColdRoom open={open} />;
        break;
      case "delivery":
        content = role === "พนักงานส่งของ" ? <Driver/> : <Delivery open={open} />;
        break;
      case "crm":
        content = entity ? (
          <CustomerDetail id={entity} go={go} open={open} />
        ) : (
          <Customers filter={filter} go={go} open={open} />
        );
        break;
      case "groups":
        content = <Groups go={go} />;
        break;
      case "marketing":
        content = entity ? (
          <PromotionDetail id={entity} go={go} />
        ) : (
          <Promotions go={go} open={open} />
        );
        break;
      case "new-promotion":
        content = <NewPromotion initial={filter} customerId={entity} go={go} />;
        break;
      case "service":
        content = <Service go={go} open={open} />;
        break;
      case "suppliers":
        content = <Suppliers open={open} />;
        break;
      case "analytics":
        content = <Analytics go={go} open={open} />;
        break;
      case "kpi":
        content = <Performance go={go} open={open} />;
        break;
      case "line":
        content = <LineWorkspace go={go} entity={entity} filter={filter} />;
        break;
      case "team":
        content = <Training open={open} />;
        break;
      case "settings":
        content = <Settings open={open} go={go} />;
        break;
      case "alerts":
        content = <Alerts go={go} open={open} />;
        break;
      default:
        content = <Home go={go} open={open} />;
    }
  const active = ["new-order", "online-order"].includes(p)
    ? "orders"
    : p === "new-promotion"
      ? "marketing"
      : p;
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      {menu && (
        <button
          className="nav-scrim"
          aria-label="ปิดเมนู"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <div className="brand">
          <img className="brand-logo" src="/sasawat-logo.png" alt="บริษัท ศาศวัต ห้องเย็น จำกัด" width={192} height={128} />
          <small>ระบบจัดการภายใน</small>
        </div>
        <div className="branch">
          <span>มุกดาหาร</span>
          <small>สาขาหลัก</small>
        </div>
        <nav aria-label="เมนูหลัก">
          {navigation
            .map((g) => ({ ...g, items: g.items.filter((x) => canAccess(role, x.route)) }))
            .filter((g) => g.items.length > 0)
            .map((g, n) => (
              <div className="nav-section" key={n}>
                {g.section && (
                  <span className="nav-section-label">{g.section}</span>
                )}
                {g.items.map((x) => (
                  <button
                    key={x.route}
                    onClick={() => sidebarGo(x.route)}
                    className={active === x.route ? "active" : ""}
                    aria-current={active === x.route ? "page" : undefined}
                  >
                    <x.icon size={17} />
                    <span>{x.route === "team" && role !== "ผู้จัดการ" ? "การอบรมของฉัน" : x.title}</span>
                    {x.route === "alerts" && unread > 0 && (
                      <small>{unread}</small>
                    )}
                  </button>
                ))}
              </div>
            ))}
        </nav>
        <details className="user-menu">
          <summary>
            <span className="avatar">
              <UserRound size={17} />
            </span>
            <span>
              <b>{role}</b>
              <small>ดูตัวอย่างในบทบาท</small>
            </span>
            <ChevronDown size={15} />
          </summary>
          <div className="role-options">
            <small>ดูตัวอย่างในบทบาท</small>
            {(
              [
                "พนักงานขาย",
                "พนักงานคลัง",
                "พนักงานส่งของ",
                "ผู้ดูแลห้องเย็น",
                "ผู้จัดการ",
              ] as Role[]
            ).map((r) => (
              <button
                key={r}
                aria-pressed={role === r}
                onClick={() => {
                  setRole(r);
                  go("dashboard");
                  document
                    .querySelector<HTMLDetailsElement>(".user-menu")
                    ?.removeAttribute("open");
                }}
              >
                {r}
                {role === r && <Check size={14} />}
              </button>
            ))}
          </div>
        </details>
      </aside>
      <div className="app-shell">
        <header className="app-header">
          <div className="header-breadcrumb">
            <Button
              className="menu-toggle"
              aria-label="เปิดเมนู"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </Button>
            <img className="header-logo" src="/sasawat-logo.png" alt="ศาศวัต ห้องเย็น" width={66} height={44} />
            <span>สาขามุกดาหาร</span>
            <b>/</b>
            <strong>{titles[active] || "ภาพรวม"}</strong>
          </div>
          <div className="header-tools">
            {role === "ผู้จัดการ" && <Button aria-label="รีเซ็ตข้อมูลตัวอย่าง" onClick={() => {setResetConfirmed(false);setResetOpen(true);}}><RotateCcw size={16}/><span className="reset-button-label">รีเซ็ตข้อมูล</span></Button>}
            <Button
              className="global-search-button"
              onClick={() => {
                setSearchOpen(true);
                setGlobalSearch("");
              }}
            >
              <Search size={16} />
              <span>ค้นหา…</span>
            </Button>
            <Button
              className="notification-button"
              aria-label={"การแจ้งเตือน " + unread + " รายการใหม่"}
              onClick={() => setNotificationPanel(true)}
            >
              <Bell size={18} />
              {unread > 0 && <span>{unread}</span>}
            </Button>
            <span className="header-role">{role}</span>
          </div>
        </header>
        <main id="main" tabIndex={-1} key={p + "-" + filter + "-" + entity}>
          {ready ? (
            content
          ) : (
            <div className="loading-state">กำลังโหลดข้อมูล…</div>
          )}
        </main>
        <footer className="app-footer">
          <span>ศาศวัต ห้องเย็น · สาขามุกดาหาร</span>
          <span>{date(TODAY)}</span>
        </footer>
      </div>
      <nav className="mobile-bottom" aria-label="เมนูมือถือ">
        {[
          { r: "dashboard", label: "งานวันนี้", icon: LayoutList },
          {
            r: role === "ผู้ดูแลห้องเย็น" ? "coldroom" : "orders",
            label: role === "ผู้ดูแลห้องเย็น" ? "ห้องเย็น" : "คำสั่งซื้อ",
            icon: role === "ผู้ดูแลห้องเย็น" ? Thermometer : ClipboardList,
          },
          { r: role === "พนักงานส่งของ" ? "delivery" : "inventory", label: role === "พนักงานส่งของ" ? "งานส่งของ" : "สินค้า", icon: role === "พนักงานส่งของ" ? Truck : Package },
          { r: "crm", label: "ลูกค้า", icon: Users },
        ].filter((x) => canAccess(role, x.r)).map((x) => (
          <button
            key={x.r}
            className={active === x.r ? "active" : ""}
            onClick={() => sidebarGo(x.r)}
          >
            <x.icon size={19} />
            <span>{x.label}</span>
          </button>
        ))}
      </nav>
      {resetOpen && <Modal title="รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้น?" onClose={() => setResetOpen(false)}>
        <p>ข้อมูลที่ทดลองเพิ่มหรือแก้ในเบราว์เซอร์นี้จะถูกแทนที่ด้วยข้อมูลตัวอย่างเริ่มต้น รวมคำสั่งซื้อ สต๊อก ลูกค้า ใบเสร็จ โปรโมชั่น และผลการอบรม</p>
        <p className="muted">มีผลเฉพาะเบราว์เซอร์นี้ เครื่องอื่นจะไม่เปลี่ยนตาม</p>
        <Button onClick={() => download("ศาศวัต-ข้อมูลก่อนรีเซ็ต.json", s)}>ดาวน์โหลดข้อมูลสำรองก่อนรีเซ็ต</Button>
        <label className="check-row"><input type="checkbox" checked={resetConfirmed} onChange={e=>setResetConfirmed(e.target.checked)}/>เข้าใจว่าข้อมูลที่ทดลองจะถูกแทนที่</label>
        <div className="form-footer"><Button onClick={()=>setResetOpen(false)}>ยกเลิก</Button><Button danger disabled={!resetConfirmed} onClick={()=>{replace(createSeed());setResetOpen(false);setForm(null);go("dashboard");notify("รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นแล้ว");}}>ยืนยันรีเซ็ตข้อมูล</Button></div>
      </Modal>}
      {toast && (
        <div
          className={"toast " + (toastKind === "error" ? "toast-error" : "")}
          role={toastKind === "error" ? "alert" : "status"}
        >
          {toastKind === "error" ? (
            <TriangleAlert size={17} />
          ) : (
            <Check size={17} />
          )}{" "}
          {toast}
        </div>
      )}
      {form && (
        <Forms
          key={form.kind + "-" + form.id}
          kind={form.kind}
          id={form.id}
          open={open}
          go={go}
          onCreatedCustomer={setCustomerAdded}
          close={() => setForm(null)}
        />
      )}{" "}
      {notificationPanel && (
        <div className="drawer-modal">
          <Modal
            title="การแจ้งเตือน"
            onClose={() => setNotificationPanel(false)}
          >
            <p>{unread} รายการยังไม่ได้อ่าน</p>
            {list.slice(0, 8).map((a) => (
              <ActionRow
                key={a.id}
                title={a.title}
                detail={a.detail}
                severity={a.severity}
                action={a.action}
                onClick={() => {
                  change("เปิดการแจ้งเตือนแล้ว", (s) => {
                    if (!s.readAlerts.includes(a.id)) s.readAlerts.push(a.id);
                  });
                  if (a.route === "coldroom" && a.entity)
                    open("incident", a.entity);
                  else go(a.route, a.filter, a.entity);
                }}
              />
            ))}
            <div className="form-footer">
              <Button onClick={() => go("alerts")}>
                ดูการแจ้งเตือนทั้งหมด
              </Button>
            </div>
          </Modal>
        </div>
      )}
      {searchOpen && (
        <Modal title="ค้นหาในร้าน" onClose={() => setSearchOpen(false)}>
          <SearchInput
            value={globalSearch}
            onChange={setGlobalSearch}
            placeholder="ชื่อร้าน / เบอร์โทร / เลขคำสั่งซื้อ / สินค้า"
          />
          {globalSearch ? (
            <div className="global-results">
              <h3>ลูกค้า</h3>
              {s.customers
                .filter((c) =>
                  [c.name, c.phone].join(" ").includes(globalSearch),
                )
                .slice(0, 4)
                .map((c) => (
                  <ActionRow
                    key={c.id}
                    title={c.name}
                    detail={c.phone}
                    action="ดูข้อมูล"
                    onClick={() => go("crm", "", c.id)}
                  />
                ))}
              <h3>คำสั่งซื้อ</h3>
              {s.orders
                .filter((o) =>
                  [o.id, customer(s, o.cid).name]
                    .join(" ")
                    .includes(globalSearch),
                )
                .slice(0, 4)
                .map((o) => (
                  <ActionRow
                    key={o.id}
                    title={o.id + " · " + customer(s, o.cid).name}
                    detail={o.status}
                    action="ดูรายการ"
                    onClick={() => go("orders", "", o.id)}
                  />
                ))}
              <h3>สินค้า</h3>
              {s.products
                .filter((p) =>
                  [p.name, p.sku, p.barcode].join(" ").includes(globalSearch),
                )
                .slice(0, 4)
                .map((p) => (
                  <ActionRow
                    key={p.id}
                    title={p.name}
                    detail={"เหลือ " + stock(s, p.id) + " " + p.unit}
                    action="ดูสินค้า"
                    onClick={() => {
                      go("inventory");
                      setSearchOpen(false);
                      s.lots.some((l) => l.pid === p.id)
                        ? open("lot", s.lots.find((l) => l.pid === p.id)!.id)
                        : open("product", p.id);
                    }}
                  />
                ))}
            </div>
          ) : (
            <p className="muted">พิมพ์ชื่อหรือเลขบางส่วนเพื่อค้นหา</p>
          )}
        </Modal>
      )}
      {pendingNav && (
        <Modal
          title="ออกจากรายการที่ยังไม่ได้บันทึก?"
          onClose={() => setPendingNav(null)}
        >
          <p>ข้อมูลที่กรอกในหน้านี้จะยังไม่ถูกบันทึก</p>
          <div className="form-footer">
            <Button onClick={() => setPendingNav(null)}>ทำต่อ</Button>
            <Button
              danger
              onClick={() => {
                go(pendingNav);
                setPendingNav(null);
              }}
            >
              ออกจากหน้านี้
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Alerts({ go, open }: { go: Navigate; open: OpenForm }) {
  const { s, change } = useStore();
  const [filter, setFilter] = useState("ทั้งหมด");
  const list = alerts(s).filter(
    (a) =>
      filter === "ทั้งหมด" ||
      (filter === "ยังไม่ได้อ่าน" && !s.readAlerts.includes(a.id)) ||
      (filter === "ต้องตรวจสอบ" && a.severity === "danger"),
  );
  return (
    <>
      <PageHeader
        title="การแจ้งเตือน"
        description="ดูสิ่งที่เกิดขึ้นและไปทำงานที่เกี่ยวข้องได้ทันที"
        actions={
          <Button
            onClick={() =>
              change("ทำเครื่องหมายว่าอ่านแล้ว", (s) => {
                s.readAlerts = [
                  ...new Set([...s.readAlerts, ...alerts(s).map((a) => a.id)]),
                ];
              })
            }
          >
            อ่านทั้งหมดแล้ว
          </Button>
        }
      />
      <Filters
        value={filter}
        onChange={setFilter}
        items={["ทั้งหมด", "ยังไม่ได้อ่าน", "ต้องตรวจสอบ"].map((x) => ({
          label: x,
          value: x,
        }))}
      />
      <div className="notification-list">
        {list.length ? (
          list.map((a) => (
            <div
              key={a.id}
              className={s.readAlerts.includes(a.id) ? "read" : "unread"}
            >
              <ActionRow
                title={a.title}
                detail={a.detail}
                severity={a.severity}
                action={a.action}
                onClick={() => {
                  change("เปิดการแจ้งเตือนแล้ว", (s) => {
                    if (!s.readAlerts.includes(a.id)) s.readAlerts.push(a.id);
                  });
                  if (a.route === "coldroom" && a.entity)
                    open("incident", a.entity);
                  else go(a.route, a.filter, a.entity);
                }}
              />
              <small>
                {a.time.includes("T")
                  ? new Date(a.time).toLocaleString("th-TH-u-ca-gregory")
                  : date(a.time)}
              </small>
            </div>
          ))
        ) : (
          <Empty title="ไม่มีการแจ้งเตือนในกลุ่มนี้" />
        )}
      </div>
    </>
  );
}
