"use client";
import { useRef, useState } from "react";
export function EditorPreview({ href, version, disabled = false }: { href: string; version: number; disabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), [width, setWidth] = useState(1024), [open, setOpen] = useState(false);
  return <>
    <button type="button" className="button button-outline" disabled={disabled} onClick={() => { setOpen(true); dialog.current?.showModal(); }}>Pratinjau desktop / ponsel</button>
    <dialog ref={dialog} className="admin-preview-dialog" aria-label="Pratinjau website" onClose={() => setOpen(false)}>
      <header className="admin-dialog-heading">
        <div>
          <h2>Pratinjau versi tersimpan</h2>
          <p className="content-note">Privat. Perubahan belum diterbitkan.</p>
        </div>
        <button type="button" className="button button-outline" onClick={() => dialog.current?.close()}>Tutup pratinjau</button>
      </header>
      <div className="admin-tabs">
        <button type="button" aria-pressed={width === 1024} onClick={() => setWidth(1024)}>Desktop</button>
        <button type="button" aria-pressed={width === 360} onClick={() => setWidth(360)}>Ponsel</button>
      </div>
      <div className="admin-preview-viewport">
        {open && <iframe key={version} title="Tampilan website sebelum diterbitkan" src={`${href}?version=${version}`} width={width} height={650} />}
      </div>
    </dialog>
  </>;
}
