"use client";
import { ReactNode, useRef, useEffect, FormEvent, useState } from "react";
import {
  Search,
  X,
  Check,
  ChevronRight,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
export function Button({
  children,
  primary = false,
  danger = false,
  small = false,
  ...props
}: {
  children: ReactNode;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={
        "btn " +
        (primary ? "primary " : "") +
        (danger ? "danger " : "") +
        (small ? "small " : "") +
        (props.className || "")
      }
    >
      {children}
    </button>
  );
}
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: () => void;
}) {
  return (
    <div className="page-head">
      <div>
        {back && (
          <button className="back-link" onClick={back}>
            ← กลับไปหน้ารายการ
          </button>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}
export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: string;
}) {
  const label = String(children);
  const auto = /ยกเลิก|ผิดปกติ|หมดอายุแล้ว/.test(label)
    ? "danger"
    : /รอยืนยัน|กำลังจัด|ใกล้หมด|รับทราบ|ต้องติดตาม|ร่าง/.test(label)
      ? "warning"
      : /เสร็จสิ้น|ปกติ|ปิด|อยู่ในเป้าหมาย|ส่งแล้ว/.test(label)
        ? "success"
        : "neutral";
  return (
    <span className={"badge " + (tone || auto)}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
export function Field({
  label,
  children,
  required = false,
  hint,
  error,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <span className="required"> *</span>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
      {error && (
        <small className="error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="ล้างคำค้นหา" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Filters({
  items,
  value,
  onChange,
}: {
  items: { label: string; value: string; count?: number }[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="quick-filters" role="group" aria-label="กรองรายการ">
      {items.map((t) => (
        <button
          key={t.value}
          aria-pressed={value === t.value}
          className={value === t.value ? "selected" : ""}
          onClick={() => onChange(t.value)}
        >
          {t.label}
          {t.count !== undefined && <span>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export type Column<T> = {
  label: string;
  cell: (row: T) => ReactNode;
  align?: "right";
  className?: string;
};
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRow,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  onRow?: (r: T) => void;
  empty?: ReactNode;
}) {
  if (!rows.length)
    return (
      <>
        {empty || (
          <Empty
            title="ไม่มีรายการตรงกับเงื่อนไข"
            description="ลองเปลี่ยนตัวกรองหรือคำค้นหา"
          />
        )}
      </>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                className={
                  (c.align === "right" ? "numeric " : "") + (c.className || "")
                }
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={onRow ? "clickable" : ""}
              onClick={onRow ? () => onRow(r) : undefined}
            >
              {columns.map((c, i) => (
                <td
                  data-label={c.label}
                  key={i}
                  className={
                    (c.align === "right" ? "numeric " : "") +
                    (c.className || "")
                  }
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={wide ? "wide-dialog" : ""}
      aria-labelledby="modal-title"
    >
      <div className="dialog-head">
        <h2 id="modal-title">{title}</h2>
        <Button aria-label="ปิด" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export function Drawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="drawer-modal">
      <Modal title={title} onClose={onClose} wide>
        {children}
      </Modal>
    </div>
  );
}
export function SimpleForm({
  children,
  onSubmit,
  label = "บันทึก",
  onCancel,
}: {
  children: ReactNode;
  onSubmit: (
    f: Record<string, string>,
    form: HTMLFormElement,
  ) => void | boolean;
  label?: string;
  onCancel?: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
          onSubmit(
            Object.fromEntries(new FormData(e.currentTarget)) as Record<
              string,
              string
            >,
            e.currentTarget,
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        }
      }}
    >
      {children}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-footer">
        {onCancel && <Button onClick={onCancel}>ยกเลิก</Button>}
        <Button type="submit" primary>
          {label}
        </Button>
      </div>
    </form>
  );
}
export function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"section " + className}>
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function StatStrip({
  items,
}: {
  items: { label: string; value: ReactNode; note?: string }[];
}) {
  return (
    <div className="stat-strip">
      {items.map((x) => (
        <div key={x.label}>
          <small>{x.label}</small>
          <strong>{x.value}</strong>
          {x.note && <span>{x.note}</span>}
        </div>
      ))}
    </div>
  );
}
export function ActionRow({
  title,
  detail,
  count,
  severity = "neutral",
  onClick,
  action = "ดูรายการ",
}: {
  title: string;
  detail?: string;
  count?: number;
  severity?: string;
  onClick: () => void;
  action?: string;
}) {
  return (
    <button className={"action-row " + severity} onClick={onClick}>
      <span className="status-dot" />
      <span>
        <b>{title}</b>
        {detail && <small>{detail}</small>}
      </span>
      {count !== undefined && <strong>{count}</strong>}
      <span className="action-label">{action}</span>
      <ChevronRight size={16} />
    </button>
  );
}
