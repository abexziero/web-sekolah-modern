"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { jQueryFactory } from "./vendor/jquery.factory.slim.module.js";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function PageMotion() {
  const pathname = usePathname();
  useGSAP(() => {
    const $ = jQueryFactory(window);
    const $document = $(document);
    const $root = $(document.documentElement);
    const $navigation = $("[data-nav-section]");
    const canAnimate=(element:Element)=>!element.closest(".motion-none");
    const panels = gsap.utils.toArray<HTMLElement>("#konten > section");
    let activeSection = "";
    let wheelScroller: Lenis | undefined;
    const initialHash = window.location.hash;
    let startupCancelled = false;
    let startupFrame = 0;
    let motionConfigured = false;
    let pendingScroll: number | undefined;
    const preserveReadingPosition = () => {
      if (pendingScroll === undefined) return;
      window.scrollTo({ top: pendingScroll, behavior: "instant" });
      wheelScroller?.scrollTo(window.scrollY, { immediate: true });
      pendingScroll = undefined;
      ScrollTrigger.update();
    };
    ScrollTrigger.addEventListener("matchMedia", preserveReadingPosition);
    const cancelStartup = () => { startupCancelled = true; };
    const restoreInitialAnchor = () => {
      void document.fonts.ready.then(() => {
        if (startupCancelled) return;
        startupFrame = requestAnimationFrame(() => {
          if (startupCancelled || window.location.hash !== initialHash) return;
          let target: HTMLElement | null;
          try { target = document.getElementById(decodeURIComponent(initialHash.slice(1))); }
          catch { return; }
          if (!target) return;
          ScrollTrigger.refresh();
          target.scrollIntoView({ block: "start", behavior: "instant" });
          wheelScroller?.scrollTo(window.scrollY, { immediate: true });
          ScrollTrigger.update();
        });
      });
    };

    const setSection = (id: string) => {
      if (activeSection === id) return;
      activeSection = id;
      $root.attr("data-active-section", id);
      $navigation.removeAttr("data-active aria-current");
      const current = $navigation.filter(`[data-nav-section~="${CSS.escape(id)}"]`);
      current.attr("data-active", "true");
      current.filter("a").attr("aria-current", "location");
    };

    setSection(panels[0]?.id || "beranda");
    panels.forEach(panel => ScrollTrigger.create({
      trigger: panel, start: "top 36%", end: "bottom 36%",
      onToggle: self => { if (self.isActive) setSection(panel.id); }
    }));
    ScrollTrigger.create({
      start: 0, end: () => ScrollTrigger.maxScroll(window),
      onUpdate: self => {
        $root.css("--scroll-progress", String(self.progress));
        $root.attr("data-scroll-direction", self.direction > 0 ? "down" : "up");
      }
    });

    const media = gsap.matchMedia();
    media.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(hover: hover) and (pointer: fine)", stack: "(min-width: 1024px) and (hover: hover) and (pointer: fine)" }, context => {
      // Restore after ScrollTrigger's media refresh, which can reset its recorded scroll position.
      if (motionConfigured) pendingScroll = window.scrollY;
      motionConfigured = true;
      if (!context.conditions?.motion) return;
      const splits: SplitText[] = [];
      let scrolling: Lenis | undefined;
      const navigationEvents = ["pointerdown", "keydown", "hashchange", "popstate"];
      // Cancel wheel inertia before the browser moves focus, hash, or history position.
      const interruptWheel = () => scrolling?.scrollTo(window.scrollY, { immediate: true });

      try {
        if (context.conditions.desktop) {
          scrolling = new Lenis({ autoRaf: true, smoothWheel: true, syncTouch: false, lerp: 0.12 });
          wheelScroller = scrolling;
          scrolling.on("scroll", ScrollTrigger.update);
          navigationEvents.forEach(name => window.addEventListener(name, interruptWheel, true));
          if (document.querySelector(".hero:not(.motion-none):not(.motion-reveal) .hero-image")) gsap.fromTo(".hero-image img", { yPercent: -3 }, { yPercent: 3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.5 } });

          const interact = context.add("cardInteraction", (event: { type: string; currentTarget: Element }) => {
            const card = event.currentTarget;
            const enter = event.type === "pointerenter" || event.type === "focusin" || card.matches(":hover, :focus-within");
            const icons = card.querySelectorAll(".profile-icon svg, .experience-content > svg, .agenda-date svg, .button svg, .hero-summary-grid svg");
            const content = card.querySelectorAll(".teacher-content, .news-card-content, .experience-content");
            if (icons.length) gsap.to(icons, {
              y: enter ? -7 : 0, rotation: enter ? -8 : 0, duration: 0.35, ease: "power2.out", overwrite: "auto"
            });
            if (content.length) gsap.to(content, {
              y: enter ? -6 : 0, duration: 0.35, ease: "power2.out", overwrite: "auto"
            });
          });
          $document.on("pointerenter.annurMotion pointerleave.annurMotion focusin.annurMotion focusout.annurMotion", ".profile-item, .teacher-card, .news-card, .experience-card, .agenda-item, .hero-summary-grid a, .button", interact);

          gsap.utils.toArray<HTMLElement>(".photo-depth").filter(photo=>canAnimate(photo)&&!photo.closest(".motion-reveal")).forEach(photo => {
            gsap.fromTo(photo, { y: 28, scale: 1.18 }, {
              y: -28, scale: 1.08, ease: "none",
              scrollTrigger: { trigger: photo.parentElement, start: "top bottom", end: "bottom top", scrub: 0.65 }
            });
          });
        }

        if (context.conditions.stack) {
          panels.forEach((panel, index) => {
            gsap.set(panel, { zIndex: index + 1 });
            const next = panels[index + 1];
            const scene = panel.querySelector<HTMLElement>(":scope > .section-scene");
            const backdrop = scene?.querySelector<HTMLElement>(":scope > .section-backdrop");
            const content = scene?.querySelector<HTMLElement>(":scope > .container-wrap");
            if (!next || !content || !backdrop || !scene || panel.matches(".motion-none,.motion-reveal")) return;
            const measure = () => gsap.set(scene, { "--scene-width": `${panel.offsetWidth}px`, "--scene-height": `${panel.id === "beranda" ? content.offsetHeight : scene.offsetHeight}px` });
            measure();
            // Pin spacers change the parent; preserve the section's opaque surface.
            gsap.set(backdrop, { backgroundColor: getComputedStyle(panel).backgroundColor });
            const pinLayer = panel.id === "beranda" ? scene : backdrop;
            if (panel.id === "beranda") gsap.set(scene, { backgroundColor: getComputedStyle(panel).backgroundColor });
            gsap.to(content, {
              y: panel.id === "galeri" ? -44 : -32, ease: "none",
              scrollTrigger: {
                trigger: panel, pin: pinLayer, pinSpacing: false,
                start: () => panel.offsetHeight > window.innerHeight ? "bottom bottom" : "top top",
                endTrigger: next, end: "top top", scrub: 0.45, invalidateOnRefresh: true, onRefreshInit: measure
              }
            });
          });
        }

        gsap.utils.toArray<HTMLElement>(".hero [data-reveal]").filter(canAnimate).forEach((element, index) => {
          gsap.fromTo(element, { opacity: 0, y: index === 0 ? 8 : 18 }, {
            opacity: 1, y: 0, delay: index * 0.18, duration: 0.65, ease: "power3.out", clearProps: "opacity,transform",
            scrollTrigger: { trigger: ".hero", start: "top 92%", once: true }
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-photo-reveal]").filter(canAnimate).forEach(element => {
          const horizontal = Boolean(element.closest("#informasi"));
          gsap.fromTo(element, { clipPath: horizontal ? "inset(0 100% 0 0)" : "inset(0 0 100% 0)" }, {
            clipPath: "inset(0 0 0 0)", duration: 1.1, ease: "power3.inOut", clearProps: "clipPath",
            scrollTrigger: { trigger: element, start: "top 92%", once: true }
          });
        });

        gsap.utils.toArray<HTMLElement>(".section-heading").filter(canAnimate).forEach(element => {
          gsap.fromTo(element, { "--underline-scale": 0 }, {
            "--underline-scale": 1, duration: 0.45, delay: 0.25, ease: "power2.out", clearProps: "--underline-scale",
            scrollTrigger: { trigger: element, start: "top 92%", once: true }
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-reveal], .contact-details > div, .faq-list details, .gallery-caption").filter(element => canAnimate(element)&&!element.closest(".hero")).filter(canAnimate).forEach(element => {
          const from: gsap.TweenVars = { opacity: 0, y: 42 };
          if (element.matches(".profile-item") && context.conditions?.stack) Object.assign(from, { x: -32, y: 0 });
          if (element.matches(".teacher-card, .news-card, .experience-card")) Object.assign(from, { y: 72, scale: 0.94 });
          if (element.matches(".agenda-item") && context.conditions?.stack) Object.assign(from, { x: 32, y: 0 });
          const stagger = element.hasAttribute("data-reveal") ? 0 : Array.from(element.parentElement!.children).indexOf(element) * 0.12;
          gsap.fromTo(element, from, {
            opacity: 1, x: 0, y: 0, scale: 1, duration: 0.95, ease: "power3.out", clearProps: "opacity,transform",
            delay: Number(element.dataset.delay || 0) + stagger,
            scrollTrigger: { trigger: element, start: "top 92%", once: true }
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-split], .section-description, .hero-description").filter(canAnimate).forEach(element => {
          const hero = element.id === "hero-heading";
          const lines = hero || element.matches(".section-description, .hero-description") || Boolean(element.closest("#informasi, #galeri"));
          const split = SplitText.create(element, {
            type: lines ? "lines" : "words", mask: lines ? "lines" : undefined, autoSplit: lines,
            aria: "auto", wordsClass: "split-word", linesClass: hero ? "hero-line" : "text-line", tag: "span",
            onSplit: self => gsap.fromTo(lines ? self.lines : self.words,
              { opacity: 0, yPercent: lines ? 110 : 0, y: lines ? 0 : 38, rotationX: lines ? 0 : -65, transformPerspective: 700 }, {
                opacity: 1, yPercent: 0, y: 0, rotationX: 0, duration: 0.95, delay: hero ? 0.1 : 0,
                stagger: lines ? 0.16 : 0.09, ease: "power3.out", clearProps: "opacity,transform",
                scrollTrigger: { trigger: element, start: "top 92%", once: true }
              })
          });
          splits.push(split);
        });

        if (document.querySelector("#agenda:not(.motion-none) .agenda-timeline")) {
        gsap.fromTo(".agenda-timeline", { "--timeline-progress": 0 }, {
          "--timeline-progress": 1, ease: "none",
          scrollTrigger: { trigger: ".agenda-timeline", start: "top 85%", end: "bottom 45%", scrub: true }
        });
        gsap.fromTo(".agenda-marker", { scale: 0.65 }, {
          scale: 1, duration: 0.45, ease: "back.out(1.5)", clearProps: "transform",
          scrollTrigger: { trigger: ".agenda-timeline", start: "top 85%", once: true }
        });
        }
      } catch {
        $document.off(".annurMotion");
        scrolling?.destroy();
        if (wheelScroller === scrolling) wheelScroller = undefined;
        splits.forEach(split => split.revert());
        context.revert();
      }

      return () => {
        $document.off(".annurMotion");
        navigationEvents.forEach(name => window.removeEventListener(name, interruptWheel, true));
        scrolling?.destroy();
        if (wheelScroller === scrolling) wheelScroller = undefined;
        splits.forEach(split => split.revert());
      };
    });

    // Restore native fragment position once font/motion layout settles; user input takes precedence.
    if (initialHash) {
      if (document.readyState === "complete") restoreInitialAnchor();
      else window.addEventListener("load", restoreInitialAnchor, { once: true });
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach(name => window.addEventListener(name, cancelStartup, { once: true, passive: true }));
    }

    return () => {
      ScrollTrigger.removeEventListener("matchMedia", preserveReadingPosition);
      startupCancelled = true;
      cancelAnimationFrame(startupFrame);
      window.removeEventListener("load", restoreInitialAnchor);
      ["pointerdown", "keydown", "wheel", "touchstart"].forEach(name => window.removeEventListener(name, cancelStartup));
      media.revert();
      $document.off(".annurMotion");
      $navigation.removeAttr("data-active aria-current");
      $root.removeAttr("data-active-section data-scroll-direction").css("--scroll-progress", "");
    };
  }, { dependencies: [pathname], revertOnUpdate: true });

  return null;
}
