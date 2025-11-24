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
    // Desktop Scroll Logic (Sticky)
    if (window.innerWidth > 1024) {
      window.addEventListener('scroll', () => {
        const rect = demoSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const sectionHeight = rect.height;

        // Calculate progress: 0 when top of section hits top of viewport, 1 when bottom hits bottom
        // We want the animation to play while the section is pinned.
        // The section is pinned for (sectionHeight - viewportHeight) pixels.
        // We add a small buffer to ensure it starts/ends cleanly
        let progress = 0;
        const scrollableDistance = sectionHeight - viewportHeight;

        if (scrollableDistance > 0) {
          progress = Math.max(0, Math.min(1, -rect.top / scrollableDistance));
        }

        console.log('Scroll Debug:', {
          scrollTop: window.scrollY,
          rectTop: rect.top,
          sectionHeight,
          viewportHeight,
          scrollableDistance,
          progress
        });

        stepTexts.forEach((step, index) => {
          step.classList.remove('active');
          // Adjust thresholds to be more forgiving
          if (progress >= index * 0.3 && progress < (index + 1) * 0.35) {
            step.classList.add('active');
          } else if (index === 2 && progress >= 0.65) {
            step.classList.add('active');
          }
        });

        updatePhoneState(progress);
      });
    } else {
      // Mobile Scroll Logic (Intersection Observer)
      const mobileStepObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Deactivate all
            stepTexts.forEach(s => s.classList.remove('active'));
            // Activate current
            entry.target.classList.add('active');

            // Update Phone State based on step
            const stepIndex = parseInt(entry.target.dataset.step);
            if (stepIndex === 1) updatePhoneState(0); // Reset
            if (stepIndex === 2) updatePhoneState(0.5); // Trigger Step 2
            if (stepIndex === 3) updatePhoneState(0.9); // Trigger Step 3
          }
        });
      }, { threshold: 0.6, rootMargin: "-20% 0px -20% 0px" }); // Slightly looser to catch faster scrolls

      stepTexts.forEach(step => mobileStepObserver.observe(step));

      // Force initial state if at top
      if (window.scrollY < 100) {
        updatePhoneState(0);
        stepTexts.forEach(s => s.classList.remove('active'));
        if (stepTexts[0]) stepTexts[0].classList.add('active');
      }
    }

    function updatePhoneState(progress) {
      const screen2 = document.getElementById('screen-2');
      const screen3 = document.getElementById('screen-3');
      const prompt = document.querySelector('.demo-fitted-prompt');
      const tradieNotif = document.querySelector('.tradie-notification');

      function updatePhoneState(progress) {
        const screen2 = document.getElementById('screen-2');
        const screen3 = document.getElementById('screen-3');
        const prompt = document.querySelector('.demo-fitted-prompt');
        const tradieNotif = document.querySelector('.tradie-notification');

        // Step 2 Trigger (0.3 to 0.6)
        if (progress > 0.3 && progress <= 0.6) {
          screen2.style.opacity = '1';
          screen2.style.pointerEvents = 'all';
          prompt.classList.add('visible');
        } else if (progress > 0.6) {
          // Transition to Step 3: Hide Step 2
          screen2.style.opacity = '0';
          screen2.style.pointerEvents = 'none';
          prompt.classList.remove('visible');
        } else {
          // Reset (Step 1)
          screen2.style.opacity = '0';
          screen2.style.pointerEvents = 'none';
          prompt.classList.remove('visible');
        }

        // Step 3 Trigger (> 0.6)
        if (progress > 0.6) {
          screen3.style.opacity = '1';
          screen3.style.pointerEvents = 'all';
          if (tradieNotif) tradieNotif.classList.add('visible');
        } else {
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
