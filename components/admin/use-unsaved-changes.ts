"use client";
import { useEffect } from "react";
export function useUnsavedChanges(dirty: boolean, pending: boolean) {
  useEffect(() => {
    if (!dirty || pending) return;
    let leaving = false;
    const unload = (e: BeforeUnloadEvent) => { if (!leaving) { e.preventDefault(); e.returnValue = ""; } };
    const leave = (e: Event) => { if (confirm("Perubahan belum disimpan. Tinggalkan halaman ini?")) leaving = true; else e.preventDefault(); };
    const reset = () => { leaving = false; };
    const traverse = (e: NavigateEvent) => {
      if (e.navigationType !== "traverse" || !e.cancelable) return;
      const target = new URL(e.destination.url);
      if (target.pathname === location.pathname && target.search === location.search) return;
      leave(e);
    };
    const navigate = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || (link.pathname === location.pathname && link.search === location.search && link.origin === location.origin)) return;
      leave(e); if (e.defaultPrevented) e.stopPropagation();
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", navigate, true); document.addEventListener("admin:before-leave", leave); document.addEventListener("admin:cancel-leave", reset);
    // shortcut: riwayat SPA memakai Navigation API; tambah fallback bila mendukung browser lama.
    window.navigation?.addEventListener("navigate", traverse);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); document.removeEventListener("admin:before-leave", leave); document.removeEventListener("admin:cancel-leave", reset); window.navigation?.removeEventListener("navigate", traverse); };
  }, [dirty, pending]);
}
export function confirmLeavingEditor() { return document.dispatchEvent(new Event("admin:before-leave", { cancelable: true })); }
