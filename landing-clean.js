/* =========================================================
   HEA Link — Clean & Minimal Premium Landing Page JavaScript
   Phase 4 Motion & Scroll Animation Suite (Performance-First)
   ========================================================= */

(function () {
  'use strict';

  // 1. Mark JS enabled on root element for graceful progressive enhancement
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.add('js-enabled');
  }

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktopFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllMotion);
  } else {
    initAllMotion();
  }

  function initAllMotion() {
    initHeroLoadEntrance();
    initNavbarScroll();
    initScrollProgressBar();
    initScrollRevealEngine();
    initAnimatedCounters();
    initTabsSlidingPill();
    initHeroParallax();
    initCarouselMotionSync();
    initProductMockupSparkline();
    initCopyFeedbackHooks();
    initMobileNavDrawer();
    initActiveNavSectionWatcher();
    initFooterAccordion();
  }

  /* ---------------------------------------------------------
     1. Hero Content Entrance on Load (500ms, not on scroll)
     --------------------------------------------------------- */
  function initHeroLoadEntrance() {
    const heroElements = document.querySelectorAll(
      '.hero-title, .hero-col-left .lead, .hero-col-left .lead2, .hero-pills, .hero-shorten-box, .hero-hud-row, .hero-visual, .hero-badges'
    );
    if (!heroElements.length) return;

    if (isReduced) {
      heroElements.forEach((el) => {
        el.classList.add('is-revealed');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    // Apply 500ms smooth entrance on page load
    requestAnimationFrame(() => {
      heroElements.forEach((el, index) => {
        el.style.transition = 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transitionDelay = `${index * 40}ms`;
        el.classList.add('is-revealed');

        el.addEventListener('transitionend', () => {
          el.style.willChange = 'auto';
        }, { once: true });
      });
    });
  }

  /* ---------------------------------------------------------
     2. Sticky Navbar: 40px Blur / Border + Hide on Scroll Down (after 120px)
     --------------------------------------------------------- */
  function initNavbarScroll() {
    const nav = document.querySelector('header.nav');
    if (!nav) return;

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let ticking = false;

    const updateNavbar = () => {
      const currentScrollY = window.scrollY || window.pageYOffset || 0;

      // After 40px: blurred white + border + soft shadow
      if (currentScrollY > 40) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }

      // After 120px: hide on scroll down, show on scroll up (never hide when mobile drawer is open)
      if (currentScrollY > 120 && !nav.classList.contains('open')) {
        const delta = currentScrollY - lastScrollY;
        if (delta > 4) {
          // Scrolling down -> hide navbar
          nav.classList.add('nav-hidden');
        } else if (delta < -4) {
          // Scrolling up -> reveal navbar
          nav.classList.remove('nav-hidden');
        }
      } else {
        nav.classList.remove('nav-hidden');
      }

      lastScrollY = Math.max(0, currentScrollY);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }, { passive: true });

    updateNavbar();
  }

  /* ---------------------------------------------------------
     3. Scroll Reading Progress Bar (Top 2px Line)
     --------------------------------------------------------- */
  function initScrollProgressBar() {
    let bar = document.getElementById('scrollProgressBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollProgressBar';
      bar.className = 'scroll-progress-bar';
      document.body.prepend(bar);
    }

    let ticking = false;
    const updateProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalH > 0 ? Math.min(1, Math.max(0, scrollY / totalH)) : 0;
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, { passive: true });

    updateProgress();
  }

  /* ---------------------------------------------------------
     4. Reveal on Scroll via ONE Shared IntersectionObserver
     --------------------------------------------------------- */
  function initScrollRevealEngine() {
    const revealElements = document.querySelectorAll('[data-reveal], [data-reveal-group]');
    if (!revealElements.length) return;

    if (isReduced || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => {
        el.classList.add('is-revealed');
        el.style.willChange = 'auto';
        if (el.dataset.revealGroup !== undefined) {
          Array.from(el.children).forEach((ch) => ch.classList.add('is-revealed'));
        }
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;

          // If element is a group container, stagger reveal its children
          if (el.dataset.revealGroup !== undefined || el.hasAttribute('data-reveal-group')) {
            const children = Array.from(el.children).slice(0, 6);
            children.forEach((child, idx) => {
              child.classList.add('data-reveal-child');
              child.style.transitionDelay = `${idx * 70}ms`;
              requestAnimationFrame(() => {
                child.classList.add('is-revealed');
              });
              child.addEventListener('transitionend', () => {
                child.style.willChange = 'auto';
              }, { once: true });
            });
            el.classList.add('is-revealed');
          } else {
            const delay = el.dataset.revealDelay;
            if (delay) {
              el.style.transitionDelay = `${delay}ms`;
            }
            el.classList.add('is-revealed');
            el.addEventListener('transitionend', () => {
              el.style.willChange = 'auto';
            }, { once: true });
          }

          obs.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------
     5. Real-Time Telemetry Counters (900ms easeOutCubic at 50% Visible)
     --------------------------------------------------------- */
  function initAnimatedCounters() {
    if (isReduced || !('IntersectionObserver' in window)) return;

    const counterElements = document.querySelectorAll(
      '#hudCountVal, .chart-total-clicks, [data-counter], [data-count-target]'
    );
    if (!counterElements.length) return;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const duration = 900;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          obs.unobserve(el);

          const raw = el.dataset.target || el.dataset.count || el.dataset.counter || el.textContent.replace(/[^0-9.]/g, '');
          const targetVal = parseFloat(raw);
          if (isNaN(targetVal)) return;

          const hasPercent = el.textContent.includes('%') || (el.dataset.suffix === '%');
          const prefix = el.dataset.prefix || (el.textContent.includes('↗ +') ? '↗ +' : (el.textContent.includes('+') ? '+' : ''));
          const suffix = el.dataset.suffix || (hasPercent ? '%' : '');

          let startTime = null;
          const animateCount = (now) => {
            if (!startTime) startTime = now;
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const currentVal = targetVal * easeOutCubic(progress);

            if (hasPercent) {
              el.textContent = `${prefix}${Math.round(currentVal)}${suffix}`;
            } else if (targetVal >= 1000) {
              el.textContent = `${prefix}${Math.round(currentVal).toLocaleString('en-US')}${suffix}`;
            } else {
              el.textContent = `${prefix}${Math.round(currentVal)}${suffix}`;
            }

            if (progress < 1) {
              requestAnimationFrame(animateCount);
            }
          };

          requestAnimationFrame(animateCount);
        }
      });
    }, {
      threshold: 0.5 // Count up once at 50% visible
    });

    counterElements.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------
     6. Hero Tabs: Sliding Pill Indicator (250ms, Recalculated on Resize)
     --------------------------------------------------------- */
  function initTabsSlidingPill() {
    const heroTabs = document.getElementById('heroTabs');
    if (!heroTabs) return;

    let pill = heroTabs.querySelector('.tab-slider-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'tab-slider-pill';
      heroTabs.prepend(pill);
    }

    const updatePill = () => {
      const activeBtn = heroTabs.querySelector('button.on') || heroTabs.querySelector('button.active');
      if (!activeBtn) return;

      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;

      pill.style.transform = `translateX(${left}px)`;
      pill.style.width = `${width}px`;
    };

    setTimeout(updatePill, 60);

    heroTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      setTimeout(updatePill, 20);
    });

    window.addEventListener('resize', updatePill, { passive: true });

    const observer = new MutationObserver(updatePill);
    observer.observe(heroTabs, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  /* ---------------------------------------------------------
     7. Desktop Hero Image Parallax (Max 16px, Desktop Only)
     --------------------------------------------------------- */
  function initHeroParallax() {
    if (!isDesktopFine || isReduced) return;

    const heroVisual = document.querySelector('.hero-visual, .hero-mockup-wrap, .hero-col-right');
    if (!heroVisual) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset || 0;
          if (scrollY < 900) {
            // Max 16px parallax translation
            const offset = Math.min(16, scrollY * 0.035);
            heroVisual.style.transform = `translateY(${offset}px)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     8. Feature Carousel Motion & Touch Sync
     (Active slide full, others scale .96 / opacity .7)
     --------------------------------------------------------- */
  function initCarouselMotionSync() {
    const track = document.querySelector('.skipper-track');
    const slides = document.querySelectorAll('.skipper-slide');
    const dots = document.querySelectorAll('.skipper-pagination .dot');
    if (!track || !slides.length) return;

    const updateSlides = (activeIdx) => {
      slides.forEach((slide, idx) => {
        if (idx === activeIdx) {
          slide.classList.add('active');
          slide.style.transform = 'scale(1)';
          slide.style.opacity = '1';
        } else {
          slide.classList.remove('active');
          slide.style.transform = 'scale(0.96)';
          slide.style.opacity = '0.7';
        }
      });
      dots.forEach((dot, idx) => {
        dot.classList.toggle('on', idx === activeIdx);
      });
    };

    updateSlides(0);

    // Track scroll events on mobile
    track.addEventListener('scroll', () => {
      const scrollLeft = track.scrollLeft;
      const slideWidth = track.clientWidth;
      if (!slideWidth) return;
      const activeIdx = Math.round(scrollLeft / slideWidth);
      updateSlides(activeIdx);
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     9. Product Mockup Self-Drawing Sparkline Chart
     --------------------------------------------------------- */
  function initProductMockupSparkline() {
    const stroke = document.getElementById('heroChartStroke');
    if (!stroke) return;

    if (isReduced) {
      stroke.classList.add('drawn');
      return;
    }

    setTimeout(() => {
      stroke.classList.add('drawn');
    }, 400);
  }

  /* ---------------------------------------------------------
     10. Copy Feedback Hooks
     --------------------------------------------------------- */
  function initCopyFeedbackHooks() {
    const mockupCopy = document.getElementById('mockupCopyPill');
    if (mockupCopy) {
      mockupCopy.addEventListener('click', () => {
        navigator.clipboard.writeText('https://hea.link/summer26').catch(() => {});
        const origHtml = mockupCopy.innerHTML;
        mockupCopy.innerHTML = `<span>✓ Copied!</span>`;
        mockupCopy.style.background = '#10b981';
        setTimeout(() => {
          mockupCopy.innerHTML = origHtml;
          mockupCopy.style.background = '';
        }, 1800);
      });
    }

    const heroRes = document.getElementById('heroRes');
    if (heroRes) {
      const resObserver = new MutationObserver(() => {
        const copyBtn = heroRes.querySelector('#rCopy');
        if (copyBtn && !copyBtn._cleanEnhanced) {
          copyBtn._cleanEnhanced = true;
          const origClick = copyBtn.onclick;
          copyBtn.onclick = (e) => {
            if (typeof origClick === 'function') origClick(e);
            copyBtn.style.transition = 'all 0.2s ease';
            copyBtn.style.background = '#10b981';
            copyBtn.textContent = '✓ Copied!';
            setTimeout(() => {
              copyBtn.style.background = '#0070f3';
              copyBtn.textContent = '📋 Copy';
            }, 2000);
          };
        }
      });
      resObserver.observe(heroRes, { childList: true, subtree: true });
    }
  }

  /* ---------------------------------------------------------
     11. Mobile Landing Navbar Drawer (<1024px)
     --------------------------------------------------------- */
  function initMobileNavDrawer() {
    const burger = document.getElementById('burger');
    const nav = document.querySelector('header.nav');
    const navCollapse = document.getElementById('navCollapse');
    if (!burger || !nav || !navCollapse) return;

    let backdrop = document.getElementById('navBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'navBackdrop';
      backdrop.className = 'nav-backdrop';
      document.body.appendChild(backdrop);
    }

    const openDrawer = () => {
      nav.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      backdrop.classList.add('active');
    };

    const closeDrawer = () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      backdrop.classList.remove('active');
    };

    burger.onclick = (e) => {
      e.stopPropagation();
      nav.classList.contains('open') ? closeDrawer() : openDrawer();
    };

    backdrop.onclick = closeDrawer;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeDrawer();
      }
    });

    navCollapse.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button:not(.arrow)')) {
        closeDrawer();
      }
    });
  }

  /* ---------------------------------------------------------
     12. Active Nav Section Watcher
     --------------------------------------------------------- */
  function initActiveNavSectionWatcher() {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const navLinks = document.querySelectorAll('#menu a[href^="#"]');
    if (!navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      threshold: 0.3
    });

    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------------------------------------------------
     13. Footer Accordion on Mobile (< 768px)
     --------------------------------------------------------- */
  function initFooterAccordion() {
    const footCols = document.querySelectorAll('.foot > div:not(:first-child)');
    footCols.forEach((col) => {
      const heading = col.querySelector('b');
      if (heading) {
        heading.setAttribute('role', 'button');
        heading.setAttribute('tabindex', '0');
        const toggleCol = () => {
          if (window.innerWidth < 768) {
            col.classList.toggle('footer-open');
          }
        };
        heading.addEventListener('click', toggleCol);
        heading.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCol();
          }
        });
      }
    });
  }
})();
