document.addEventListener("DOMContentLoaded", () => {
  const currentYearEl = document.getElementById("current-year");
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }

  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  document.querySelectorAll(".logo-marquee").forEach((marquee) => {
    const track = marquee.querySelector(".marquee-track");
    if (!track) {
      return;
    }
    const clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    marquee.appendChild(clone);
  });

  const hero = document.querySelector(".hero");
  const heroGlow = document.querySelector(".hero-glow");

  if (hero && heroGlow) {
    const syncGlow = (xRatio, yRatio) => {
      const x = (xRatio - 0.5) * 120;
      const y = (yRatio - 0.5) * 120;
      heroGlow.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
      heroGlow.style.opacity = "0.75";
    };

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const xRatio = (event.clientX - rect.left) / rect.width;
      const yRatio = (event.clientY - rect.top) / rect.height;
      syncGlow(xRatio, yRatio);
    });

    hero.addEventListener("pointerleave", () => {
      heroGlow.style.transform = "translate3d(0, 0, 0)";
      heroGlow.style.opacity = "0.6";
    });
  }
});
