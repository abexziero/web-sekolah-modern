"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type AnimationEvent } from "react";
import { useSiteConfig } from "./site-config";
import { imageUrl } from "@/lib/cms-validation";
import { navigation, schoolPages } from "@/lib/school-pages";
import { jQueryFactory } from "./vendor/jquery.factory.slim.module.js";

export function SiteHeader() {
  const config=useSiteConfig(), settings=config.settings;
  type Menu={label:string;section:string;area?:string;href?:string;children:{label:string;href:string;group?:string;visible?:boolean}[];visible?:boolean};
  const menus:Menu[]=(config.navigation?.items || navigation.map(item=>({...item,children:schoolPages.filter(page=>page.area===item.area).map(page=>({label:page.title,href:`/${page.area}/${page.slug}`,group:page.group}))}))).filter((item:Menu)=>item.visible!==false);
  const header = useRef<HTMLElement>(null);
  const [atTop, setAtTop] = useState(false);
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  function closeMenus() {
    header.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(menu => { menu.removeAttribute("data-closing"); menu.open = false; });
  }

  function finishClose(event: AnimationEvent<HTMLDivElement>) {
    if (event.animationName !== "nav-fade-out" || event.target !== event.currentTarget) return;
    const menu = event.currentTarget.parentElement as HTMLDetailsElement;
    if (menu.hasAttribute("data-closing")) { menu.removeAttribute("data-closing"); menu.open = false; }
  }

  useEffect(() => {
    const update = () => setAtTop(pathname === "/" && window.scrollY < 32 && !!document.querySelector(".hero"));
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) closeMenus();
    };
    const $header = jQueryFactory(window)(header.current!);
    const hover = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    const enter = (event: { type: string; currentTarget: Element }) => {
      if (!hover.matches) return;
      const menu = event.currentTarget as HTMLDetailsElement;
      if (event.type === "focusin" && !menu.open) return;
      menu.removeAttribute("data-closing");
      menu.open = true;
    };
    const leave = (event: { currentTarget: Element; relatedTarget?: EventTarget | null }) => {
      if (!hover.matches) return;
      const menu = event.currentTarget as HTMLDetailsElement;
      if (menu.matches(":hover, :focus-within") || (event.relatedTarget instanceof Node && menu.contains(event.relatedTarget))) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) menu.open = false;
      else if (menu.open) menu.setAttribute("data-closing", "true");
    };
    $header.on("pointerenter.annurNav focusin.annurNav", ".desktop-nav > .nav-group", enter);
    $header.on("pointerleave.annurNav focusout.annurNav", ".desktop-nav > .nav-group", leave);
    if (previousPath.current !== pathname) closeMenus();
    previousPath.current = pathname;
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("pointerdown", outside);
    window.addEventListener("resize", closeMenus);
    window.addEventListener("hashchange", closeMenus);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", closeMenus);
      window.removeEventListener("hashchange", closeMenus);
      $header.off(".annurNav");
    };
  }, [pathname]);

  function renderNavigation(className?: string) {
    return <nav aria-label="Navigasi utama" className={className}>
      {menus.map(item => item.children.some(child=>child.visible!==false) ? (
        <details className="nav-group" key={item.label} onToggle={event => {
          if (event.currentTarget.open) {
            event.currentTarget.parentElement?.querySelectorAll<HTMLDetailsElement>(":scope > details").forEach(other => {
              if (other !== event.currentTarget) { other.removeAttribute("data-closing"); other.open = false; }
            });
          }
        }}>
          <summary role="button" data-nav-section={item.section} onClick={event => {
            const menu = event.currentTarget.parentElement as HTMLDetailsElement;
            menu.removeAttribute("data-closing");
            if (event.detail && window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches) { event.preventDefault(); menu.open = true; }
          }}>{item.label}<ChevronDown size={14} aria-hidden="true" /></summary>
          <div className={`nav-submenu${item.area === "profil" ? " nav-profile" : ""}`} onAnimationEnd={finishClose}>
            {Array.from(new Set(item.children.filter(child=>child.visible!==false).map(child=>child.group||""))).map(group => <div key={group || item.area}>
              {group && <p className="nav-group-label">{group}</p>}
              {item.children.filter(page => page.visible!==false && (page.group||"") === group).map(page => {
                const href = page.href;
                const current = pathname === href || pathname.startsWith(`${href}/`);
                return <Link href={href} prefetch={false} key={href} aria-current={current ? (pathname === href ? "page" : "location") : undefined} onClick={closeMenus}>{page.label}</Link>;
              })}
            </div>)}
          </div>
        </details>
      ) : <a href={item.href} key={item.label} data-nav-section={item.section} onClick={closeMenus}>{item.label}</a>)}
    </nav>;
  }

  return (
    <>
      <a className="skip-link" href="#konten">Lewati ke konten</a>
      <header ref={header} className={`site-header${atTop ? " at-top" : ""}`} onKeyDown={event => {
        if (event.key !== "Escape" || !(event.target instanceof Element)) return;
        const menu = event.target.closest<HTMLDetailsElement>("details");
        if (menu?.open) {
          menu.removeAttribute("data-closing");
          menu.open = false;
          menu.querySelector<HTMLElement>(":scope > summary")?.focus();
          event.preventDefault();
          event.stopPropagation();
        }
      }}>
        <span className="scroll-progress" aria-hidden="true" />
        <div className="container-wrap flex min-h-22 items-center justify-between gap-6">
          <a href="/#beranda" className="brand" onClick={closeMenus}>
            <Image unoptimized src={imageUrl(settings?.logo || "logo.png")} alt="" width={552} height={432} sizes="60px" className="h-12 w-15 object-contain" />
            <span className="flex flex-col gap-0.5"><strong>{settings?.shortName||"MA ANNUR"}</strong><span className="brand-caption">{settings?.caption||"MADRASAH ALIYAH · SAMARINDA"}</span></span>
          </a>
          {renderNavigation("desktop-nav")}
          <details id="navigation-menu" className="mobile-menu">
            <summary role="button" aria-controls="mobile-navigation" aria-label="Menu navigasi" onClick={event => {
              const menu = event.currentTarget.parentElement as HTMLDetailsElement;
              if (!menu.open || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
              event.preventDefault();
              menu.toggleAttribute("data-closing");
            }}>
              <Menu size={23} className="menu-open-icon" aria-hidden="true" /><X size={23} className="menu-close-icon" aria-hidden="true" />
            </summary>
            <div id="mobile-navigation" onAnimationEnd={finishClose}>{renderNavigation()}</div>
          </details>
        </div>
      </header>
    </>
  );
}
