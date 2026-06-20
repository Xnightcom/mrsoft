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
            if (countTo && !entry.target.getAttribute("data-counting")) {
              entry.target.setAttribute("data-counting", "true");
              const isFloat = countTo.includes(".");
              animateCount(entry.target as HTMLElement, parseFloat(countTo), isFloat);
            }

            // Stop observing once revealed
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );

    const observeElements = () => {
      const els = document.querySelectorAll(".reveal-fade-up, .heading-slide-in");
      els.forEach((el) => {
        if (!el.getAttribute("data-observed")) {
          observer.observe(el);
          el.setAttribute("data-observed", "true");
        }
      });
    };

    // Initial query selection
    observeElements();

    // Use MutationObserver to watch for route transitions and lazy-loaded nodes
    const mutationObserver = new MutationObserver((mutations) => {
      let hasNewElements = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          for (let i = 0; i < m.addedNodes.length; i++) {
            if (m.addedNodes[i].nodeType === 1) {
              // Node.ELEMENT_NODE
              hasNewElements = true;
              break;
            }
          }
        }
        if (hasNewElements) break;
      }
      if (hasNewElements) {
        observeElements();
      }
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

function animateCount(el: HTMLElement, target: number, isFloat: boolean) {
  const duration = 2000;
  const start = performance.now();
  const suffix = el.getAttribute("data-count-suffix") || "";

  const step = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;

    if (isFloat) {
      el.textContent = current.toFixed(1) + suffix;
    } else {
      el.textContent = Math.round(current) + suffix;
    }

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}
