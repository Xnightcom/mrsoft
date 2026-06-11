import { useEffect } from "react";

/**
 * Observes all `.reveal-fade-up` and `.heading-slide-in` elements,
 * adding `.reveal-active` when they enter the viewport.
 * Also handles counter animations for `[data-count-to]` elements.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");

            // Count-up animation for stat numbers
            const countTo = entry.target.getAttribute("data-count-to");
            if (countTo) {
              animateCount(entry.target as HTMLElement, parseInt(countTo, 10));
            }
          }
        });
      },
      { threshold: 0.08 }
    );

    const els = document.querySelectorAll(".reveal-fade-up, .heading-slide-in");
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

function animateCount(el: HTMLElement, target: number) {
  const duration = 2000;
  const start = performance.now();
  const suffix = el.getAttribute("data-count-suffix") || "";

  const step = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out curve
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}
