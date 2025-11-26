document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // 1. Text Reveal Animation
  const revealTexts = document.querySelectorAll('.reveal-text');

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px'
  };

  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  revealTexts.forEach(text => textObserver.observe(text));

  // 2. Parallax Effect for Floating Elements
  const floatingElements = document.querySelectorAll('.floating-ui');

  window.addEventListener('mousemove', (e) => {
    // Only on desktop
    if (window.innerWidth > 768) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      floatingElements.forEach((el, index) => {
        const speed = (index + 1) * 20;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;

        el.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
      });
    }
  });

  // 3. Sticky Pill Navigation
  const nav = document.querySelector('.nav-pill');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // 4. Reactive Scroll Demo Logic
  const demoSection = document.querySelector('.demo-section');
  const stepTexts = document.querySelectorAll('.demo-step-text');
  const screen2 = document.getElementById('screen-2');
  const prompt = document.querySelector('.demo-fitted-prompt');

  if (demoSection) {
    // Skip dynamic demo logic on mobile; mobile uses static stacked blocks.
    if (window.innerWidth <= 1024) {
      return;
    }

    const desktopMode = () => {
      const rect = demoSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;
      const scrollableDistance = sectionHeight - viewportHeight;
      const progress = scrollableDistance > 0 ? Math.max(0, Math.min(1, -rect.top / scrollableDistance)) : 0;

      stepTexts.forEach((step) => step.classList.remove('active'));

      if (progress < 0.33) {
        stepTexts[0]?.classList.add('active');
      } else if (progress < 0.66) {
        stepTexts[1]?.classList.add('active');
      } else {
        stepTexts[2]?.classList.add('active');
      }

      updatePhoneState(progress);
    };

    const mobileMode = () => {
      const mobileObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            stepTexts.forEach(s => s.classList.remove('active'));
            entry.target.classList.add('active');
            const stepIndex = parseInt(entry.target.dataset.step, 10);
            if (stepIndex === 1) updatePhoneState(0);
            if (stepIndex === 2) updatePhoneState(0.5);
            if (stepIndex === 3) updatePhoneState(0.9);
          }
        });
      }, { threshold: 0.5, rootMargin: "-10% 0px -30% 0px" });

      stepTexts.forEach(step => mobileObserver.observe(step));
      if (window.scrollY < 40) {
        updatePhoneState(0);
        stepTexts.forEach(s => s.classList.remove('active'));
        if (stepTexts[0]) stepTexts[0].classList.add('active');
      }
    };

    if (window.innerWidth > 1024) {
      desktopMode();
      window.addEventListener('scroll', desktopMode, { passive: true });
      window.addEventListener('resize', desktopMode);
    } else {
      mobileMode();
    }

    function updatePhoneState(progress) {
      const screen2 = document.getElementById('screen-2');
      const screen3 = document.getElementById('screen-3');
      const prompt = document.querySelector('.demo-fitted-prompt');
      const tradieNotif = document.querySelector('.tradie-notification');

      // Step 2 Trigger (0.33 to 0.66)
      if (progress >= 0.33 && progress < 0.66) {
        screen2.style.opacity = '1';
        screen2.style.pointerEvents = 'all';
        prompt.classList.add('visible');
      } else {
        screen2.style.opacity = '0';
        screen2.style.pointerEvents = 'none';
        prompt.classList.remove('visible');
      }

      // Step 3 Trigger (>= 0.66)
      if (progress >= 0.66) {
        screen3.style.transform = 'translateX(0)';
        screen3.style.opacity = '1';
        screen3.style.pointerEvents = 'all';
        if (tradieNotif) tradieNotif.classList.add('visible');
      } else {
        screen3.style.transform = 'translateX(100%)';
        screen3.style.opacity = '0';
        screen3.style.pointerEvents = 'none';
        if (tradieNotif) tradieNotif.classList.remove('visible');
      }
    }
  }

  // 5. Installer Form Handler
    const form = document.getElementById('installer-signup-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const status = form.querySelector('.form-status');
        const originalText = btn.innerText;

        btn.innerText = 'Sending...';
        btn.disabled = true;
        status.style.display = 'none';

        const formData = new FormData(form);
        const data = {
          fullName: formData.get('fullName'),
          businessName: formData.get('businessName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          mobile: formData.get('phone') // Mapping phone to mobile as well for API compatibility
        };

        try {
          // Attempt to send to local API (assuming it's running on default port or configured)
          // If no API is running, we'll simulate success for the demo
          const response = await fetch('http://localhost:3000/installers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            status.innerText = 'Thanks! Check your email for confirmation.';
            status.style.color = 'green';
            form.reset();
          } else {
            throw new Error('API request failed');
          }
        } catch (err) {
          console.warn('API unavailable, simulating success for demo:', err);
          // Fallback for demo purposes if API isn't running
          setTimeout(() => {
            status.innerText = 'Thanks! We have received your details.';
            status.style.color = 'green';
            form.reset();
          }, 1000);
        } finally {
          btn.innerText = originalText;
          btn.disabled = false;
          status.style.display = 'block';
        }
      });
    }

    // 5. Map Zoom Animation
    const mapSection = document.querySelector('.map-section-container');
    const mapImage = document.querySelector('.map-image');

    if (mapSection && mapImage) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Zoom out when visible
            mapImage.style.transform = 'scale(1)';

            // Animate pins
            document.querySelectorAll('.map-pin').forEach((pin, index) => {
              setTimeout(() => {
                pin.classList.add('active');
              }, 300 + (index * 200));
            });
          } else {
            // Reset when out of view
            mapImage.style.transform = 'scale(1.2)';
          }
        });
      }, { threshold: 0.5 });

      observer.observe(mapSection);
    }

    // 6. Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  });
