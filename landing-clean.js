/* =========================================================
   HEA Link — Clean & Minimal Premium Landing Page JavaScript
   Step 1: Navbar Scroll, Hero Reveal, Sliding Pill, Sparkline & Counters
   ========================================================= */

(function () {
  'use strict';

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStep1);
  } else {
    initStep1();
  }

  function initStep1() {
    initNavbarScroll();
    initHeroHeadlineReveal();
    initTabsSlidingPill();
    initProductMockupSparkline();
    initAnimatedCounters();
    initCopyFeedbackHooks();
  }

  /* ---------------------------------------------------------
     1. Sticky Navbar Dynamic Scroll State
     --------------------------------------------------------- */
  function initNavbarScroll() {
    const nav = document.querySelector('header.nav');
    if (!nav) return;

    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      if (scrollY > 40) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* ---------------------------------------------------------
     2. Hero Headline Line-by-Line Reveal & Accent Underline
     --------------------------------------------------------- */
  function initHeroHeadlineReveal() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    if (isReduced || typeof gsap === 'undefined') {
      heroTitle.classList.add('revealed');
      return;
    }

    const lineInners = heroTitle.querySelectorAll('.hero-line-inner');
    if (!lineInners.length) {
      heroTitle.classList.add('revealed');
      return;
    }

    // GSAP clean entrance: rises 24px and fades in smoothly
    gsap.fromTo(
      lineInners,
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out',
        onComplete: () => {
          heroTitle.classList.add('revealed');
        },
      }
    );
  }

  /* ---------------------------------------------------------
     3. Hero Tabs Sliding Pill Indicator
     --------------------------------------------------------- */
  function initTabsSlidingPill() {
    const heroTabs = document.getElementById('heroTabs');
    if (!heroTabs) return;

    // Create pill element if not already in DOM
    let pill = heroTabs.querySelector('.tab-slider-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'tab-slider-pill';
      heroTabs.prepend(pill);
    }

    const updatePill = () => {
      const activeBtn = heroTabs.querySelector('button.on');
      if (!activeBtn) return;

      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;

      pill.style.transform = `translateX(${left}px)`;
      pill.style.width = `${width}px`;
    };

    // Update initially after layout
    setTimeout(updatePill, 50);

    // Update on click on any tab button
    heroTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      setTimeout(updatePill, 20);
    });

    // Update on window resize
    window.addEventListener('resize', updatePill, { passive: true });

    // MutationObserver to track class changes ('on')
    const observer = new MutationObserver(updatePill);
    observer.observe(heroTabs, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  /* ---------------------------------------------------------
     4. Product Mockup Self-Drawing Sparkline Chart
     --------------------------------------------------------- */
  function initProductMockupSparkline() {
    const stroke = document.getElementById('heroChartStroke');
    if (!stroke) return;

    if (isReduced) {
      stroke.classList.add('drawn');
      return;
    }

    // Trigger stroke animation
    setTimeout(() => {
      stroke.classList.add('drawn');
    }, 400);
  }

  /* ---------------------------------------------------------
     5. Real-Time Telemetry Smooth Counters
     --------------------------------------------------------- */
  function initAnimatedCounters() {
    if (isReduced || typeof gsap === 'undefined') return;

    // 1. HUD Analytics +245%
    const hudVal = document.getElementById('hudCountVal');
    if (hudVal) {
      const target = parseInt(hudVal.dataset.target || '245', 10);
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.6,
        delay: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          hudVal.textContent = `↗ +${Math.round(obj.val)}%`;
        },
      });
    }

    // 2. Mockup Total Clicks (14,820)
    const clicksEl = document.querySelector('.chart-total-clicks');
    if (clicksEl) {
      const targetClicks = parseInt(clicksEl.dataset.count || '14820', 10);
      const clickObj = { val: 8000 };
      gsap.to(clickObj, {
        val: targetClicks,
        duration: 1.8,
        delay: 0.4,
        ease: 'power2.out',
        onUpdate: () => {
          clicksEl.textContent = Math.round(clickObj.val).toLocaleString('en-US');
        },
      });
    }
  }

  /* ---------------------------------------------------------
     6. Copy Button Feedback & Interaction Enhancements
     --------------------------------------------------------- */
  function initCopyFeedbackHooks() {
    // 1. Mockup Copy Button
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

    // 2. Observe #heroRes to enhance the dynamic copy button
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
})();
