/*
  All animation code for the site lives in this one file.
  Each component calls one hook from here, e.g. useSpotlight(box, layer, animate),
  and only renders HTML itself. Sections below follow the order of the page.
*/
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Ref<T = HTMLElement> = RefObject<T>;

/* ================= General ================= */

/** True while a CSS media query matches, e.g. useMedia('(pointer: fine)'). */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
  );
}

/** Smooth inertia scrolling (Lenis), kept in sync with ScrollTrigger. */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Make links like href="#work" scroll smoothly too.
    const onClick = (e: MouseEvent) => {
      const id = (e.target as Element)
        .closest('a[href^="#"]')
        ?.getAttribute("href");
      const target =
        id && id !== "#" ? document.querySelector<HTMLElement>(id) : null;
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -40 });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [enabled]);
}

/**
 * 3D tilt for every element with class "tilt": it leans toward the mouse and a soft
 * light follows the pointer (the light is .tilt::after in index.css). One listener
 * for the whole page, so it also works for content that appears later.
 */
export function useTilt(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let current: HTMLElement | null = null;

    const reset = (el: HTMLElement) => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
      el.style.setProperty("--glare", "0");
    };

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(".tilt");
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width; // 0 → 1 across the element
      const y = (e.clientY - r.top) / r.height;
      gsap.to(el, {
        rotateY: (x - 0.5) * 28,
        rotateX: (0.5 - y) * 28,
        transformPerspective: 900,
        duration: 0.4,
        ease: "power2.out",
      });
      el.style.setProperty("--glare-x", `${x * 100}%`);
      el.style.setProperty("--glare-y", `${y * 100}%`);
      el.style.setProperty("--glare", "1");
    };
    const onLeavePage = () => current && reset(current);

    document.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeavePage);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeavePage);
    };
  }, [enabled]);
}

/**
 * Recalculates every scroll animation when `value` changes. Use it when a section
 * appears later (e.g. after loading), because everything below it moves down.
 */
export function useRefreshScrollOnChange(value: unknown) {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [value]);
}

/** Recalculates every scroll animation once the content and fonts are in place. */
export function useRefreshScrollWhenReady(ready: boolean) {
  useEffect(() => {
    if (ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }, [ready]);
}

/* ================= SectionHead ================= */

/** The top line draws in, the heading wipes up and the tag fades in. Reverses when scrolling back. */
export function useHeadingReveal(root: Ref, animate: boolean) {
  useGSAP(
    () => {
      if (!animate) return;
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        })
        .from(".section-head-rule", {
          scaleX: 0,
          duration: 0.9,
          ease: "expo.out",
        })
        .fromTo(
          "h2",
          { clipPath: "inset(0 0 100% 0)", yPercent: 60 },
          {
            clipPath: "inset(0 0 -10% 0)",
            yPercent: 0,
            duration: 0.8,
            ease: "expo.out",
          },
          0.1,
        )
        .from(".tag", { autoAlpha: 0, x: 20, duration: 0.6 }, 0.25);
    },
    { scope: root, dependencies: [animate], revertOnUpdate: true },
  );
}

/* ================= ScrambleText ================= */

const GLYPHS = "!<>-_\\/[]{}=+*^?#ABCDEFGHJKLMNOPQRSTUVWXYZ";

/** Text decodes from random characters when its link/button is hovered or focused. */
export function useScramble(ref: Ref<HTMLSpanElement>, text: string) {
  useEffect(() => {
    const el = ref.current;
    const host = el?.closest("a, button") ?? el;
    if (
      !el ||
      !host ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let timer = 0;
    const run = () => {
      let frame = 0;
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        const solved = (frame / 18) * text.length;
        el.textContent = [...text]
          .map((ch, i) =>
            ch === " " || i < solved
              ? ch
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join("");
        if (++frame > 18) {
          window.clearInterval(timer);
          el.textContent = text;
        }
      }, 35);
    };

    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    return () => {
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focus", run);
      window.clearInterval(timer);
    };
  }, [ref, text]);
}

/* ================= Preloader ================= */

const SPINNER = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";

/** Types `text` into `el` one character at a time. */
function typeInto(el: Element | null, text: string) {
  const state = { n: 0 };
  return gsap.to(state, {
    n: text.length,
    duration: text.length * 0.035,
    ease: "none",
    onUpdate: () => {
      if (el) el.textContent = text.slice(0, Math.round(state.n));
    },
  });
}

/**
 * The terminal boot:
 * 1. types the two commands, 2. spins while waiting for the API,
 * 3. prints the result and switches the screen off like an old TV, then calls onDone.
 * Returns whether it is still waiting, and the current spinner character.
 */
export function usePreloader(root: Ref, ready: boolean, onDone: () => void) {
  const [typed, setTyped] = useState(false);
  const [frame, setFrame] = useState(0);
  const waiting = !(ready && typed);

  useGSAP(
    () => {
      gsap
        .timeline({ onComplete: () => setTyped(true) })
        .add(
          typeInto(
            root.current!.querySelector("#cmd-1"),
            "ssh guest@portfolio",
          ),
        )
        .set("#out-1", { autoAlpha: 1 }, "+=0.15")
        .add(
          typeInto(root.current!.querySelector("#cmd-2"), "npm run portfolio"),
          "+=0.25",
        )
        .set("#out-2", { autoAlpha: 1 }, "+=0.1");
    },
    { scope: root },
  );

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(
      () => setFrame((f) => (f + 1) % SPINNER.length),
      80,
    );
    return () => window.clearInterval(id);
  }, [waiting]);

  useGSAP(
    () => {
      if (waiting) return;
      gsap
        .timeline({ onComplete: onDone })
        .set("#out-3", { autoAlpha: 1 })
        .set("#out-4", { autoAlpha: 1 }, "+=0.25")
        .to(
          "#screen",
          { scaleY: 0.006, duration: 0.28, ease: "power4.in" },
          "+=0.45",
        )
        .to("#screen", { scaleX: 0, duration: 0.22, ease: "power3.in" })
        .to(root.current, { autoAlpha: 0, duration: 0.25 });
    },
    { dependencies: [waiting], scope: root },
  );

  return { waiting, spinner: SPINNER[frame] };
}

/* ================= Cursor ================= */

/** Dot + trailing ring follow the mouse. Hovering data-cursor="Label" grows the ring and shows the label. */
export function useCustomCursor(
  dot: Ref<HTMLDivElement>,
  ring: Ref<HTMLDivElement>,
  label: Ref<HTMLSpanElement>,
) {
  useEffect(() => {
    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;
    document.documentElement.classList.add("has-cursor");

    const dotX = gsap.quickTo(d, "x", { duration: 0.1 });
    const dotY = gsap.quickTo(d, "y", { duration: 0.1 });
    const ringX = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const ringY = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element).closest<HTMLElement>(
        "[data-cursor]",
      );
      l.textContent = target?.dataset.cursor ?? "";
      r.toggleAttribute("data-active", Boolean(target));
    };

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerover", onOver);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
    };
  }, [dot, ring, label]);
}

/* ================= Nav ================= */

/** The progress line grows from 0 to full width as you scroll the page. */
export function useScrollProgress(bar: Ref<HTMLDivElement>) {
  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { end: "max", scrub: 0.3 } },
    );
  });
}

/**
 * Phone menu: opens as a circle growing from the menu button (top right),
 * then the links slide up one by one. Closing shrinks the circle back.
 */
export function useMobileMenu(menu: Ref<HTMLDivElement>, open: boolean, animate: boolean) {
  useGSAP(
    () => {
      const el = menu.current!;
      const closed = "circle(0% at calc(100% - 40px) 36px)";
      if (!animate) {
        gsap.set(el, { clipPath: open ? "none" : closed, visibility: open ? "visible" : "hidden" });
        return;
      }
      if (open) {
        gsap
          .timeline()
          .set(el, { visibility: "visible" })
          .fromTo(
            el,
            { clipPath: closed },
            { clipPath: "circle(150% at calc(100% - 40px) 36px)", duration: 0.7, ease: "power3.inOut" },
          )
          .fromTo(
            ".mobile-menu a",
            { y: 40, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: "power3.out" },
            "-=0.35",
          );
      } else {
        gsap.to(el, {
          clipPath: closed,
          duration: 0.5,
          ease: "power3.inOut",
          onComplete: () => {
            gsap.set(el, { visibility: "hidden" });
          },
        });
      }
    },
    { scope: menu, dependencies: [open, animate] },
  );
}

/* ================= Hero ================= */

interface HeroOptions {
  /** True after the preloader has finished. */
  start: boolean;
  animate: boolean;
  finePointer: boolean;
}

/** Particle name, fade-up of the text below it, and background glows that follow the mouse. */
export function useHero(
  hero: Ref,
  canvas: Ref<HTMLCanvasElement>,
  title: Ref,
  { start, animate, finePointer }: HeroOptions,
) {
  const startRef = useRef(start);
  startRef.current = start;

  // The name drawn as particles: they flee the mouse, explode on click and blow away on scroll.
  useEffect(() => {
    if (!animate) return;
    return particleName(
      hero.current!,
      canvas.current!,
      title.current!,
      () => startRef.current,
      finePointer,
    );
  }, [hero, canvas, title, animate, finePointer]);

  // Text under the name fades up once the intro is done.
  useGSAP(
    () => {
      if (animate && start)
        gsap.from(".hero-current, .hero-foot > *", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
        });
    },
    { scope: hero, dependencies: [start, animate] },
  );

  // Background glows follow the mouse at different speeds (parallax). Speed comes from data-depth.
  useEffect(() => {
    if (!animate || !finePointer) return;
    const glows = [
      ...hero.current!.querySelectorAll<HTMLElement>("[data-depth]"),
    ].map((el) => ({
      x: gsap.quickTo(el, "x", { duration: 1.2 }),
      y: gsap.quickTo(el, "y", { duration: 1.2 }),
      depth: Number(el.dataset.depth),
    }));
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      glows.forEach((g) => {
        g.x(nx * g.depth * 3);
        g.y(ny * g.depth * 3);
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [hero, animate, finePointer]);
}

/**
 * The 3D cube in the hero: it spins all the time, spins faster while you scroll
 * (backwards when scrolling up) and leans toward the mouse.
 */
export function useHeroCube(cube: Ref<HTMLDivElement>, animate: boolean, finePointer: boolean) {
  useEffect(() => {
    const el = cube.current;
    if (!animate || !el) return;

    const BASE_SPEED = 20; // degrees per second
    const state = { spin: 35, speed: BASE_SPEED, leanX: 0, leanY: 0 };

    const tick = (_time: number, deltaMs: number) => {
      state.spin += (state.speed * deltaMs) / 1000;
      // Extra speed from scrolling fades back to the normal speed.
      state.speed += (BASE_SPEED - state.speed) * 0.04;
      gsap.set(el, { rotateX: -22 + state.leanX, rotateY: state.spin + state.leanY });
    };
    gsap.ticker.add(tick);

    const scroll = ScrollTrigger.create({
      onUpdate: (self) => {
        state.speed = BASE_SPEED + gsap.utils.clamp(-400, 400, self.getVelocity() / 4);
      },
    });

    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      gsap.to(state, { leanY: nx * 60, leanX: -ny * 40, duration: 1, ease: "power3.out" });
    };
    if (finePointer) window.addEventListener("pointermove", onMove);

    return () => {
      gsap.ticker.remove(tick);
      scroll.kill();
      window.removeEventListener("pointermove", onMove);
    };
  }, [cube, animate, finePointer]);
}

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  line: number; // 0 = first name, 1 = last name (picks the colour)
  flyX: number; // where it flies when you scroll away
  flyY: number;
  size: number;
}

/** Draws the heading's text as particles on the canvas. Returns a cleanup function. */
function particleName(
  hero: HTMLElement,
  canvas: HTMLCanvasElement,
  heading: HTMLElement,
  isStarted: () => boolean,
  finePointer: boolean,
) {
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const css = getComputedStyle(document.documentElement);
  const colors = ["--color-paper", "--color-accent", "--color-warm"].map((v) =>
    css.getPropertyValue(v).trim(),
  );

  let particles: Particle[] = [];
  let width = 0;
  let height = 0;
  let scrollAway = 0; // 0 → 1 as the hero scrolls out
  const pointer = { x: -9999, y: -9999 };

  // Draw the heading text off-screen, then put a particle on every few filled pixels.
  function build() {
    const box = hero.getBoundingClientRect();
    width = Math.round(box.width);
    height = Math.round(box.height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const off = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })!;
    off.canvas.width = width;
    off.canvas.height = height;

    let fontSize = 60;
    heading.querySelectorAll<HTMLElement>("[data-line]").forEach((line, i) => {
      const style = getComputedStyle(line);
      fontSize = parseFloat(style.fontSize);
      const range = document.createRange();
      range.selectNodeContents(line);
      const r = range.getBoundingClientRect();
      off.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      off.letterSpacing =
        style.letterSpacing as CanvasRenderingContext2D["letterSpacing"];
      off.textBaseline = "middle";
      off.fillStyle = i === 0 ? "#f00" : "#00f"; // red = line 0, blue = line 1
      off.fillText(
        line.textContent ?? "",
        r.left - box.left,
        r.top - box.top + r.height / 2,
      );
    });

    const gap = Math.max(3, Math.round(fontSize / 40));
    const pixels = off.getImageData(0, 0, width, height).data;
    particles = [];
    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const k = (y * width + x) * 4;
        if (pixels[k + 3]! < 128) continue;
        particles.push({
          homeX: x,
          homeY: y,
          x: width / 2 + (Math.random() - 0.5) * width * 1.6,
          y: height / 2 + (Math.random() - 0.5) * height * 1.6,
          vx: 0,
          vy: 0,
          line: pixels[k]! > pixels[k + 2]! ? 0 : 1,
          flyX: (Math.random() - 0.5) * width * 1.4,
          flyY: -Math.random() * height * 1.1 - 80,
          size: gap * 0.62 + 0.5,
        });
      }
    }
  }

  // Runs every frame: spring each particle home, push it away from the pointer, draw it.
  function tick() {
    if (scrollAway > 0.995 || particles.length === 0) return;
    const started = isStarted();
    const radius = finePointer ? 120 : 80;
    const fly = scrollAway * scrollAway;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = started ? Math.max(0, 1 - scrollAway * 1.15) : 0.35;

    for (const p of particles) {
      if (started) {
        p.vx += (p.homeX + p.flyX * fly - p.x) * 0.055;
        p.vy += (p.homeY + p.flyY * fly - p.y) * 0.055;
      }
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < radius) {
        const force = ((radius - dist) / radius) * 6;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
      p.vx *= 0.8;
      p.vy *= 0.8;
      p.x += p.vx;
      p.y += p.vy;

      const fast = Math.abs(p.vx) + Math.abs(p.vy) > 2.5;
      ctx.fillStyle = colors[fast ? 2 : p.line]!;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  const toLocal = (e: PointerEvent) => {
    const box = hero.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  const onMove = (e: PointerEvent) => Object.assign(pointer, toLocal(e));
  const onLeave = () => Object.assign(pointer, { x: -9999, y: -9999 });
  const onClick = (e: PointerEvent) => {
    const c = toLocal(e);
    for (const p of particles) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 340) {
        const f = (1 - d / 340) * 38;
        p.vx += (dx / d) * f + (Math.random() - 0.5) * 6;
        p.vy += (dy / d) * f + (Math.random() - 0.5) * 6;
      }
    }
  };
  let lastWidth = window.innerWidth;
  const onResize = () => {
    if (window.innerWidth === lastWidth) return; // ignore mobile address-bar resizes
    lastWidth = window.innerWidth;
    build();
  };

  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", onLeave);
  hero.addEventListener("pointerdown", onClick);
  window.addEventListener("resize", onResize);
  gsap.ticker.add(tick);
  const trigger = ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => (scrollAway = self.progress),
  });
  // Wait for the web font so the particles match the real typeface.
  let alive = true;
  document.fonts.ready.then(() => alive && build());

  return () => {
    alive = false;
    hero.removeEventListener("pointermove", onMove);
    hero.removeEventListener("pointerleave", onLeave);
    hero.removeEventListener("pointerdown", onClick);
    window.removeEventListener("resize", onResize);
    gsap.ticker.remove(tick);
    trigger.kill();
  };
}

/* ================= Spotlight ================= */

/** A circle that follows the pointer reveals the hidden sentence. Sweeps once on its own when scrolled into view. */
export function useSpotlight(
  box: Ref<HTMLDivElement>,
  layer: Ref<HTMLParagraphElement>,
  animate: boolean,
) {
  useGSAP(
    () => {
      if (!animate) return;
      const el = box.current!;
      const top = layer.current!;

      // The circle's position and size, written to CSS variables used by .spotlight-hidden in index.css.
      const spot = { x: 0, y: 0, r: 0 };
      const apply = () => {
        top.style.setProperty("--x", `${spot.x}px`);
        top.style.setProperty("--y", `${spot.y}px`);
        top.style.setProperty("--r", `${spot.r}px`);
      };
      const local = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };

      const onMove = (e: PointerEvent) =>
        gsap.to(spot, {
          ...local(e),
          duration: 0.45,
          overwrite: "auto",
          onUpdate: apply,
        });
      const onEnter = (e: PointerEvent) => {
        Object.assign(spot, local(e));
        gsap.to(spot, {
          r: 150,
          duration: 0.6,
          ease: "back.out(1.7)",
          overwrite: "auto",
          onUpdate: apply,
        });
      };
      const onLeave = () =>
        gsap.to(spot, {
          r: 0,
          duration: 0.5,
          ease: "power3.in",
          overwrite: "auto",
          onUpdate: apply,
        });
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);

      // One automatic sweep when it scrolls into view, so phone users see it too.
      ScrollTrigger.create({
        trigger: el,
        start: "top 65%",
        once: true,
        onEnter: () => {
          const h = el.offsetHeight;
          gsap
            .timeline({ onUpdate: apply })
            .set(spot, { x: 0, y: h / 2, r: 0 })
            .to(spot, { r: Math.min(140, h * 0.6), duration: 0.4 })
            .to(
              spot,
              { x: el.offsetWidth, duration: 1.8, ease: "power2.inOut" },
              "<",
            )
            .to(spot, { r: 0, duration: 0.4 }, "-=0.4");
        },
      });

      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { dependencies: [animate], revertOnUpdate: true },
  );
}

/* ================= Compile ================= */

export interface CodeLine {
  /** [kind, text] pairs; kind only matters for colour. */
  parts: [string, string][];
  /** data-reveal name of the card piece that appears when this line is typed. */
  reveals?: string;
}

/**
 * Scrolling types out the code file token by token, and card pieces with
 * data-reveal="<name>" appear when their line is done.
 * Big screens: the section pins. Phones: it types while scrolling past.
 */
export function useCompileTyping(
  root: Ref,
  lines: CodeLine[],
  animate: boolean,
) {
  const wide = useMedia("(min-width: 900px)");
  const source = lines.map((l) => l.parts.map((p) => p[1]).join("")).join("\n");

  useGSAP(
    () => {
      if (!animate) return;
      const el = root.current!;

      // Every token with the character position where it starts, and where each line ends.
      let total = 0;
      const tokens: { node: HTMLElement; text: string; start: number }[] = [];
      const lineEnds: Record<string, number> = {};
      const tokenNodes = el.querySelectorAll<HTMLElement>(
        ".editor-code code span",
      );
      lines.forEach((line) => {
        line.parts.forEach(([, text]) => {
          tokens.push({ node: tokenNodes[tokens.length]!, text, start: total });
          total += text.length;
        });
        total += 1; // newline
        if (line.reveals) lineEnds[line.reveals] = total;
      });
      const pieces = el.querySelectorAll<HTMLElement>("[data-reveal]");
      const status = el.querySelector<HTMLElement>(".editor-status")!;

      // Show the first `progress` share of the file (0 → 1).
      const typeUpTo = (progress: number) => {
        const typed = Math.round(progress * total);
        tokens.forEach((t) => {
          const visible = Math.max(0, Math.min(t.text.length, typed - t.start));
          t.node.textContent = t.text.slice(0, visible);
          t.node.toggleAttribute(
            "data-caret",
            visible > 0 && visible < t.text.length,
          );
        });
        pieces.forEach((p) =>
          p.toggleAttribute(
            "data-shown",
            typed >= (lineEnds[p.dataset.reveal!] ?? 0),
          ),
        );
        const done = typed >= total;
        status.textContent = done
          ? "✓ Compiled successfully · 0 errors"
          : `● Typing… ${Math.round(progress * 100)}%`;
        status.toggleAttribute("data-done", done);
      };

      const progress = { value: 0 };
      typeUpTo(0);
      gsap.to(progress, {
        value: 1,
        ease: "none",
        onUpdate: () => typeUpTo(progress.value),
        scrollTrigger: wide
          ? {
              trigger: el,
              start: "top top",
              end: "+=200%",
              scrub: 0.6,
              pin: true,
            }
          : { trigger: el, start: "top 75%", end: "bottom 70%", scrub: 0.6 },
      });
    },
    {
      scope: root,
      dependencies: [animate, wide, source],
      revertOnUpdate: true,
    },
  );
}

/* ================= About ================= */

/** Each word of .about-text lights up as the paragraph scrolls through the screen. */
export function useWordsLightUp(root: Ref, animate: boolean, text: string) {
  useGSAP(
    () => {
      if (!animate) return;
      gsap.fromTo(
        ".about-text span",
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: {
            trigger: ".about-text",
            start: "top 80%",
            end: "bottom 40%",
            scrub: true,
          },
        },
      );
    },
    { scope: root, dependencies: [animate, text], revertOnUpdate: true },
  );
}

/* ================= Marquee ================= */

/** Endless strip. It reverses with scroll direction and speeds up when you scroll fast. */
export function useMarquee(
  root: Ref<HTMLDivElement>,
  animate: boolean,
  items: string[],
) {
  useGSAP(
    () => {
      if (!animate) return;
      // Speed in pixels per second. Lower = slower. The duration is worked out from the
      // track's length, so the speed stays the same however many skills there are.
      const SPEED = 60;
      const track = root.current!.querySelector<HTMLElement>(".marquee-track")!;
      const loop = gsap.to(track, {
        xPercent: -50,
        duration: track.scrollWidth / 2 / SPEED,
        ease: "none",
        repeat: -1,
      });
      gsap.to(".marquee-item i", {
        rotate: 360,
        duration: 6,
        ease: "none",
        repeat: -1,
      });
      ScrollTrigger.create({
        onUpdate: (self) => {
          // Scrolling speeds it up a little (at most 2× extra).
          const boost = Math.min(Math.abs(self.getVelocity()) / 800, 2);
          gsap.to(loop, {
            timeScale: self.direction * (1 + boost),
            duration: 0.3,
            overwrite: true,
          });
        },
      });
    },
    {
      scope: root,
      dependencies: [animate, items.join()],
      revertOnUpdate: true,
    },
  );
}

/* ================= Skills + Achievements ================= */

/**
 * Cards with class .reveal-card (inside a .reveal-grid) rise in one after another,
 * then any chips inside them (.reveal-card li) pop in. Used by Skills and Achievements.
 */
export function useCardsReveal(root: Ref, animate: boolean, count: number) {
  useGSAP(
    () => {
      if (!animate || !root.current) return; // nothing to animate when the section is hidden (empty)
      const timeline = gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current!.querySelector(".reveal-grid"),
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        })
        .from(".reveal-card", {
          autoAlpha: 0,
          y: 60,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });
      if (root.current!.querySelector(".reveal-card li")) {
        timeline.from(
          ".reveal-card li",
          {
            autoAlpha: 0,
            scale: 0.6,
            duration: 0.4,
            stagger: 0.04,
            ease: "back.out(2)",
          },
          "-=0.5",
        );
      }
    },
    { scope: root, dependencies: [animate, count], revertOnUpdate: true },
  );
}

/* ================= Projects ================= */

/**
 * The section pins and the track slides sideways as you scroll down.
 * Cards lean with scroll speed, pictures drift inside their frames.
 */
export function useHorizontalSlider(
  root: Ref,
  track: Ref<HTMLDivElement>,
  animate: boolean,
  count: number,
) {
  useGSAP(
    () => {
      if (!animate) return;
      const t = track.current!;
      const distance = () => t.scrollWidth - window.innerWidth;

      const slide = gsap.to(t, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      // Each picture moves a little inside its card (parallax).
      gsap.utils.toArray<HTMLElement>(".cover-inner").forEach((layer) => {
        gsap.fromTo(
          layer,
          { xPercent: -8 },
          {
            xPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: layer,
              containerAnimation: slide,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          },
        );
      });

      // 3D "cover flow": each card enters from the right turned away, faces you
      // in the middle of the screen, and turns away again as it leaves on the left.
      gsap.utils.toArray<HTMLElement>(".slider-card").forEach((card) => {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: card,
              containerAnimation: slide,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          })
          .fromTo(
            card,
            { rotateY: -40, scale: 0.85, transformPerspective: 1000 },
            { rotateY: 0, scale: 1, ease: "power1.out" },
          )
          .to(card, { rotateY: 40, scale: 0.85, ease: "power1.in" });
      });
    },
    { scope: root, dependencies: [animate, count], revertOnUpdate: true },
  );
}

/** The floating preview follows the mouse and pops in while something is hovered. */
export function useFollowPreview(
  preview: Ref<HTMLDivElement>,
  enabled: boolean,
  hovered: string | null,
) {
  useEffect(() => {
    const p = preview.current;
    if (!enabled || !p) return;
    gsap.set(p, { scale: 0 });
    const x = gsap.quickTo(p, "x", { duration: 0.6 });
    const y = gsap.quickTo(p, "y", { duration: 0.6 });
    const onMove = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [preview, enabled]);

  useEffect(() => {
    if (!enabled || !preview.current) return;
    gsap.to(
      preview.current,
      hovered
        ? { scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5 }
        : { scale: 0, duration: 0.4 },
    );
  }, [preview, enabled, hovered]);
}

/* ================= Timeline (Experience + Education) ================= */

/**
 * Timeline: the .timeline-progress line fills as you scroll, each .timeline-item
 * slides in, and its dot lights up (data-reached) once the line gets there.
 */
export function useTimeline(root: Ref, animate: boolean, count: number) {
  useGSAP(
    () => {
      if (!animate || !root.current) return; // nothing to animate when the section is hidden (empty)
      gsap.fromTo(
        ".timeline-progress",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            // This section's own timeline (there are two on the page).
            trigger: root.current!.querySelector(".timeline"),
            start: "top 60%",
            end: "bottom 60%",
            scrub: true,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>(".timeline-item").forEach((item) => {
        gsap.from(item, {
          autoAlpha: 0,
          x: 40,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
        ScrollTrigger.create({
          trigger: item,
          start: "top 60%",
          onEnter: () => item.setAttribute("data-reached", ""),
          onLeaveBack: () => item.removeAttribute("data-reached"),
        });
      });
    },
    { scope: root, dependencies: [animate, count], revertOnUpdate: true },
  );
}

/* ================= Process ================= */

/**
 * Sticky .process-card items: each one shrinks, darkens and tips backwards in 3D
 * as the next one slides over it.
 */
export function useStackingCards(root: Ref, animate: boolean, count: number) {
  useGSAP(
    () => {
      if (!animate) return;
      const cards = gsap.utils.toArray<HTMLElement>(".process-card");
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        // Start value is written out: from "none" GSAP would start at brightness(0) (black).
        gsap.fromTo(card, { scale: 1, rotateX: 0, transformPerspective: 1000, filter: "brightness(1)" }, {
          scale: 0.9,
          rotateX: 12,
          filter: "brightness(0.7)",
          ease: "none",
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: "top 30%",
            scrub: true,
          },
        });
      });
    },
    { scope: root, dependencies: [animate, count], revertOnUpdate: true },
  );
}

/* ================= Contact ================= */

/** Headline letters (.contact-title span span) slide up one after another. */
export function useLetterReveal(root: Ref, animate: boolean) {
  useGSAP(
    () => {
      if (!animate) return;
      gsap.from(".contact-title span span", {
        yPercent: 110,
        stagger: 0.03,
        duration: 0.9,
        ease: "expo.out",
        scrollTrigger: { trigger: ".contact-title", start: "top 85%" },
      });
    },
    { scope: root, dependencies: [animate], revertOnUpdate: true },
  );
}

/** Magnetic button: pulled toward the cursor, springs back when it leaves. */
export function useMagnetic(button: Ref<HTMLButtonElement>, enabled: boolean) {
  useEffect(() => {
    const b = button.current;
    if (!enabled || !b) return;
    const onMove = (e: PointerEvent) => {
      const r = b.getBoundingClientRect();
      gsap.to(b, {
        x: (e.clientX - r.left - r.width / 2) * 0.4,
        y: (e.clientY - r.top - r.height / 2) * 0.4,
        duration: 0.4,
      });
    };
    const onLeave = () =>
      gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
    b.addEventListener("pointermove", onMove);
    b.addEventListener("pointerleave", onLeave);
    return () => {
      b.removeEventListener("pointermove", onMove);
      b.removeEventListener("pointerleave", onLeave);
    };
  }, [button, enabled]);
}
