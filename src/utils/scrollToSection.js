


const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Only one scroll animation may run at a time (double taps, repeat clicks).
let cancelActiveScroll = null;

export function scrollToSection(id, { gap = 20, minOffset = 64 } = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const target = document.getElementById(id);
  if (!target) return;

  if (cancelActiveScroll) cancelActiveScroll();

  const root = document.documentElement;

  // Find the pinned bars once. Re-measuring them every frame is still done
  // below (so an info bar hiding or showing is followed), but searching the
  // whole page for them on every frame is wasted work.
  const pinned = Array.from(
    document.querySelectorAll("header, nav, [data-site-header]")
  ).filter((el) => {
    const { position } = window.getComputedStyle(el);
    return position === "fixed" || position === "sticky";
  });

  // Space covered by whatever is pinned to the top right now.
  const getOffset = () => {
    let measured = 0;

    pinned.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 0 && rect.bottom > 0) {
        measured = Math.max(measured, rect.bottom);
      }
    });

    return Math.max(measured, minOffset);
  };

  // Where the page should end up. Clamped to the real scroll range: a
  // section near the bottom of the page can never reach an unreachable
  // position, so the animation can always finish.
  const getTargetTop = () => {
    const maxScroll = Math.max(root.scrollHeight - root.clientHeight, 0);
    const top =
      target.getBoundingClientRect().top + window.scrollY - getOffset() - gap;

    return clamp(top, 0, maxScroll);
  };

  // Keyboard and screen-reader users land on the section too.
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });

  // IMPORTANT: if the site CSS has `html { scroll-behavior: smooth }`, every
  // window.scrollTo() below would be smoothed again by the browser. That is
  // what made the scroll stop and then crawl. Turn it off while animating.
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";

  const reduce = Boolean(
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  const interruptEvents = ["wheel", "touchstart", "keydown"];
  let frame = 0;
  let timer = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;

    cancelAnimationFrame(frame);
    clearTimeout(timer);
    interruptEvents.forEach((type) => window.removeEventListener(type, finish));

    root.style.scrollBehavior = previousBehavior;
    cancelActiveScroll = null;
  };

  cancelActiveScroll = finish;

  if (reduce) {
    window.scrollTo(0, getTargetTop());
    // Layout can still shift after the jump, so correct once more.
    timer = setTimeout(() => {
      if (finished) return;
      window.scrollTo(0, getTargetTop());
      finish();
    }, 150);
    return;
  }

  const start = window.scrollY;
  const distance = getTargetTop() - start;

  if (Math.abs(distance) < 2) {
    finish();
    return;
  }

  // Short hops are quick, long distances take longer (never more than 1s).
  const duration = clamp(Math.abs(distance) * 0.35, 450, 1000);
  const startTime = performance.now();
  let settled = 0;

  // Let the user take over at any time.
  interruptEvents.forEach((type) =>
    window.addEventListener(type, finish, { passive: true })
  );

  const tick = (now) => {
    if (finished) return;

    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = easeInOutCubic(progress);

    // Re-measured each frame, so lazy images and a hiding info bar above the
    // section never make the scroll land short.
    const goal = getTargetTop();

    window.scrollTo(0, start + (goal - start) * eased);

    if (progress < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }

    // Animation is done: keep correcting briefly until the layout is still.
    if (Math.abs(window.scrollY - goal) < 1.5) settled += 1;
    else settled = 0;

    if (settled >= 4 || now - startTime > duration + 800) {
      finish();
      return;
    }

    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
}



