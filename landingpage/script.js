document.addEventListener("DOMContentLoaded", () => {
  const currentYearEl = document.getElementById("current-year");
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  const navTrigger = document.querySelector(".nav-trigger");
  const navOverlay = document.getElementById("nav-overlay");
  const navOverlayClose = navOverlay ? navOverlay.querySelector(".nav-overlay__close") : null;

  const setNavState = (open) => {
    if (!navOverlay || !navTrigger) return;
    navTrigger.setAttribute("aria-expanded", String(open));
    navOverlay.classList.toggle("is-open", open);
    navOverlay.setAttribute("aria-hidden", String(!open));
    if (open) {
      navOverlay.removeAttribute("hidden");
      document.body.classList.add("nav-open");
      const closeTarget = navOverlayClose || navTrigger;
      closeTarget.focus?.({ preventScroll: true });
    } else {
      navOverlay.setAttribute("hidden", "");
      document.body.classList.remove("nav-open");
      navTrigger.focus?.({ preventScroll: true });
    }
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };

  if (navTrigger && navOverlay) {
    navTrigger.addEventListener("click", () => {
      const isOpen = navTrigger.getAttribute("aria-expanded") === "true";
      setNavState(!isOpen);
    });
  }

  if (navOverlayClose) {
    navOverlayClose.addEventListener("click", () => setNavState(false));
  }

  if (navOverlay) {
    navOverlay.querySelectorAll(".nav-group__toggle").forEach((toggle) => {
      const body = toggle.nextElementSibling;
      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        if (body) {
          body.hidden = expanded;
        }
      });
    });

    navOverlay.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", () => setNavState(false));
    });

    navOverlay.addEventListener("click", (event) => {
      if (event.target === navOverlay) {
        setNavState(false);
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navOverlay?.classList.contains("is-open")) {
      setNavState(false);
    }
  });

  const howGrid = document.querySelector(".how-grid");
  if (howGrid) {
    const stepItems = Array.from(howGrid.querySelectorAll(".how-sequence li"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      howGrid.classList.add("has-started");
      stepItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      const stepObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              stepObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.45,
          rootMargin: "0px 0px -10%",
        }
      );

      const gridObserver = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            howGrid.classList.add("has-started");
            stepItems.forEach((item) => stepObserver.observe(item));
            obs.unobserve(entry.target);
          }
        },
        { threshold: 0.25 }
      );

      gridObserver.observe(howGrid);
    }
  }
});
