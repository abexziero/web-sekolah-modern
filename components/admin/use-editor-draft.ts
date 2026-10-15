"use client";
import { useEffect, useRef, useState } from "react";
type Options<T> = { storageKey: string; version: number; data: T; onRecover: (data: T) => void; save?: (data: T, version: number) => Promise<{ error: string; version: number }>; valid: (data: T) => boolean; locked: boolean };
export function useEditorDraft<T>({ storageKey, version, data, onRecover, save, valid, locked }: Options<T>) {
  const [currentVersion, setVersion] = useState(version), [baseline, setBaseline] = useState(JSON.stringify(data)), [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [recovery, setRecovery] = useState<{ data: T; version: number } | null>(null), [error, setError] = useState("");
  const latest = useRef({ save, valid, onRecover }); latest.current = { save, valid, onRecover };
  const serialized = JSON.stringify(data), dirty = serialized !== baseline;
  useEffect(() => {
    try { const raw = sessionStorage.getItem(storageKey); if (raw) { const saved = JSON.parse(raw); if (Date.now() - saved.at < 86400000 && saved.data && JSON.stringify(saved.data) !== baseline) setRecovery(saved); else sessionStorage.removeItem(storageKey); } } catch { }
  }, [storageKey]);
  useEffect(() => {
    if (!dirty || locked) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ data, version: currentVersion, at: Date.now() })); setMessage("Isian disimpan sementara pada tab ini."); } catch { setMessage("Penyimpanan sementara tidak tersedia. Simpan perubahan sebelum menutup halaman."); }
    if (!latest.current.save || busy || error || !latest.current.valid(data)) return;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const result = await latest.current.save!(data, currentVersion);
        if (result.error) { setError(result.error); return; }
        setVersion(result.version); setBaseline(serialized); setMessage(`Tersimpan pukul ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}. Belum menerbitkan perubahan.`);
      } catch { setError("Simpan otomatis gagal. Periksa koneksi lalu coba lagi."); } finally { setBusy(false); }
    }, 2000);
    return () => clearTimeout(timer);
  }, [serialized, baseline, currentVersion, locked, busy, error, storageKey]);
  useEffect(() => { if (!dirty && message.startsWith("Tersimpan")) { try { sessionStorage.removeItem(storageKey); } catch { } } }, [dirty, message, storageKey]);
  function recover() { if (!recovery) return; if (recovery.version !== version && !confirm("Isian sementara berasal dari versi sebelumnya. Pulihkan untuk ditinjau? Versi website tidak langsung berubah.")) return; latest.current.onRecover(recovery.data); setRecovery(null); }
  function discard() { setRecovery(null); try { sessionStorage.removeItem(storageKey); } catch { } }
  return { version: currentVersion, dirty, busy, message, error, recovery, recover, discard, retry: () => setError("") };
}
