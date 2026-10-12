

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

/* ==========================================================
   useInView
   - Fires ONCE (observer disconnects after the first hit),
     so animations never replay while scrolling up/down.
   - Reduced-motion users / browsers without IntersectionObserver
     get the content immediately, no animation.
========================================================== */
export function useInView({
  threshold = 0.12,
  rootMargin = "0px 0px -6% 0px",
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      setInView(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}

export function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}) {
  const [ref, inView] = useInView();

  return (
    <Tag
      ref={ref}
      data-inview={inView}
      data-reveal={variant}
      className={`reveal ${className}`.trim()}
      style={{ "--i": delay, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}


export function RevealGroup({
  as: Tag = "div",
  variant = "up",
  className = "",
  children,
  ...rest
}) {
  const [ref, inView] = useInView();
  let index = 0;

  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const i = Math.min(index++, 8);

    return cloneElement(child, {
      className: `${child.props.className ?? ""} reveal-item`.trim(),
      style: { ...child.props.style, "--i": i },
    });
  });

  return (
    <Tag
      ref={ref}
      data-inview={inView}
      data-reveal={variant}
      className={className}
      {...rest}
    >
      {items}
    </Tag>
  );
}

export default Reveal;