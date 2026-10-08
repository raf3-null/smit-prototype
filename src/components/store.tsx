"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  State,
  Role,
  STORAGE_KEY,
  createSeed,
  addWalkInExamples,
  uid,
  validateState,
} from "@/lib/domain";
type Store = {
  s: State;
  role: Role;
  setRole: (r: Role) => void;
  change: (text: string, fn: (s: State) => void) => boolean;
  replace: (s: State) => void;
  notify: (message: string) => void;
  toast: string;
  toastKind: string;
  ready: boolean;
};
const Context = createContext<Store>(null!);
export function Provider({ children }: { children: ReactNode }) {
  const [s, setState] = useState<State>(createSeed);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("ผู้จัดการ");
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("success");
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validateState(parsed)) { addWalkInExamples(parsed); setState(parsed); }
        else setToast("ข้อมูลที่บันทึกไว้ไม่สมบูรณ์ ใช้ข้อมูลตัวอย่างแทน");
      }
    } catch {
      setToast("อ่านข้อมูลที่บันทึกไว้ไม่ได้ ใช้ข้อมูลตัวอย่างแทน");
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {
        setToast("บันทึกลงอุปกรณ์ไม่ได้ โปรดดาวน์โหลดข้อมูลสำรอง");
      }
  }, [s, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const change = useCallback(
    (text: string, fn: (s: State) => void) => {
      try {
        const next = structuredClone(s);
        fn(next);
        next.logs.unshift({
          id: uid("LOG"),
          date: new Date().toISOString(),
          text,
          user: role,
        });
        setState(next);
        setToastKind("success");
        setToast(text);
        return true;
      } catch (err) {
        setToastKind("error");
        setToast(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        return false;
      }
    },
    [s, role],
  );
  return (
    <Context.Provider
      value={{
        s,
        role,
        setRole,
        change,
        replace: setState,
        notify: setToast,
        toast,
        toastKind,
        ready,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
