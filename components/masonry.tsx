"use client";

// Adapted from https://reactbits.dev/r/Masonry-TS-TW.json, retrieved 2026-10-14: native links/dialog, SSR fallback and reduced motion.
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

type Item = { id: string; img: string; title: string; alt: string; height: number };
type GridItem = Item & { x: number; y: number; w: number; h: number };

const useMedia = () => {
  const [columns, setColumns] = useState(1);
  useEffect(() => {
    const queries = [matchMedia("(min-width:1000px)"), matchMedia("(min-width:600px)")];
    const update = () => setColumns(queries[0].matches ? 3 : queries[1].matches ? 2 : 1);
    update();
    queries.forEach(query => query.addEventListener("change", update));
    return () => queries.forEach(query => query.removeEventListener("change", update));
  }, []);
  return columns;
};

const useMeasure = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
};

export default function Masonry({ items }: { items: Item[] }) {
  const columns = useMedia();
  const [container, width] = useMeasure();
  const previous = useRef<GridItem[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const savedOverflow = useRef("");

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return [];
    const colHeights = new Array<number>(columns).fill(0);
    const gap = 20;
    const columnWidth = (width - (columns - 1) * gap) / columns;
    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const h = child.height / 2;
      const y = colHeights[col];
      colHeights[col] += h + gap;
      return { ...child, x, y, w: columnWidth, h };
    });
  }, [columns, items, width]);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const restoreGeometry = () => grid.forEach((item, index) => {
      const element = container.current?.children[index] as HTMLElement | undefined;
      if (!element) return;
      element.style.width = `${item.w}px`;
      element.style.height = `${item.h}px`;
      element.style.transform = `translate(${item.x}px, ${item.y}px)`;
    });
    restoreGeometry();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      grid.forEach((item, index) => {
        const old = previous.current[index];
        const element = container.current?.children[index];
        if (old && element) gsap.fromTo(element,
          { x: old.x, y: old.y, width: old.w, height: old.h },
          { x: item.x, y: item.y, width: item.w, height: item.h, duration: 0.35, ease: "power2.out" }
        );
      });
      // GSAP reverts captured styles before this callback; keep the current responsive geometry.
      return restoreGeometry;
    });
    previous.current = grid;
    return () => media.revert();
  }, [grid, container]);

  useEffect(() => {
    const modal = dialog.current;
    return () => { if (modal?.open) document.documentElement.style.overflow = savedOverflow.current; };
  }, []);

  return <>
    <div ref={container} className={`gallery-grid${width ? " gallery-positioned" : ""}`} style={width ? { height: Math.max(0, ...grid.map(item => item.y + item.h)) } : undefined}>
      {items.map((item, index) => {
        const position = grid[index];
        return <a key={item.id} href={item.img} aria-label={`Perbesar foto: ${item.title}`} className="gallery-item"
          style={position ? { width: position.w, height: position.h, transform: `translate(${position.x}px, ${position.y}px)` } : { height: item.height / 2 }}
          onClick={event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            if (!dialog.current) return;
            event.preventDefault();
            setSelected(item);
            savedOverflow.current = document.documentElement.style.overflow;
            dialog.current.showModal();
            document.documentElement.style.overflow = "hidden";
          }}>
          <span className="gallery-photo" data-photo-reveal><span className="photo-depth"><Image unoptimized={item.img.startsWith("/media/")} src={item.img} alt={item.alt} fill sizes="(max-width: 599px) 92vw, (max-width: 999px) 46vw, 380px" className="object-cover" /></span></span>
          <span className="gallery-caption"><span>{item.title}</span><ZoomIn size={20} aria-hidden="true" /></span>
        </a>;
      })}
    </div>
    <dialog ref={dialog} className="photo-dialog" aria-label="Foto madrasah" data-lenis-prevent
      onClose={() => { document.documentElement.style.overflow = savedOverflow.current; setSelected(null); }}
      onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <button type="button" className="photo-close" aria-label="Tutup foto" autoFocus onClick={() => dialog.current?.close()}><X size={24} aria-hidden="true" /></button>
      {selected && <figure><Image unoptimized={selected.img.startsWith("/media/")} src={selected.img} alt={selected.alt} width={1200} height={800} sizes="90vw" className="dialog-image" /><figcaption>{selected.title}</figcaption></figure>}
    </dialog>
  </>;
}
