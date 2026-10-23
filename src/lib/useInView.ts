'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** True once the element has scrolled into view (stays true). */
export function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, inView]);
  return { ref, inView };
}

/**
 * Site owner's choice: play animations for everyone, even when the device has
 * "Reduce Motion" turned on. Set to true to honor the OS setting again.
 */
export const RESPECT_REDUCED_MOTION = false;

export function prefersReducedMotion() {
  return (
    RESPECT_REDUCED_MOTION &&
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
/** React hook: true when the visitor has asked for reduced motion. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => RESPECT_REDUCED_MOTION && window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}
