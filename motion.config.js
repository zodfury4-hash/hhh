/**
 * HEA Link — Central Motion Configuration (motion.config.js)
 * Single Source of Truth for Motion Tokens, Durations, Easings, and Distances.
 * Tune animation speeds and curves across the entire site from this file.
 */

const motionConfig = {
  duration: {
    heroLoad: 500,            // Hero content load entrance (ms)
    reveal: 600,              // Scroll reveal duration (ms)
    stagger: 70,              // Stagger delay between sibling items (ms)
    maxStaggerChildren: 6,    // Max children to stagger
    counter: 900,             // Metric counter count-up duration (ms)
    tabPill: 250,             // Sliding pill indicator transition (ms)
    faq: 250,                 // FAQ accordion grid row transition (ms)
    navHideShow: 280,         // Navbar scroll hide/reveal (ms)
    cardHover: 200,           // Card hover lift transition (ms)
    dashboardPageSwitch: 250, // Dashboard view entrance transition (ms)
    skeletonShimmer: 1500     // Skeleton loading pulse cycle (ms)
  },
  easing: {
    reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',       // Smooth decelerating curve
    counter: 'cubic-bezier(0.33, 1, 0.68, 1)',     // easeOutCubic
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.15)', // Tactile spring
    nav: 'cubic-bezier(0.16, 1, 0.3, 1)',
    tabPill: 'cubic-bezier(0.16, 1, 0.3, 1)',
    faq: 'cubic-bezier(0.16, 1, 0.3, 1)',
    dashboardPage: 'cubic-bezier(0.16, 1, 0.3, 1)'
  },
  distance: {
    revealY: 20,              // Reveal translateY distance (px)
    cardHoverY: -3,           // Card hover translateY lift (px)
    heroParallaxMax: 16,      // Maximum desktop hero parallax shift (px)
    dashboardPageY: 8,        // Dashboard view entrance rise (px)
    navScrolledThreshold: 40, // Scroll distance (px) to activate blurred navbar
    navHideThreshold: 120,    // Scroll distance (px) to begin hiding navbar on scroll down
    stickyShadowScroll: 8     // Scroll distance (px) before sticky header shadow appears
  },
  scroll: {
    lenis: {
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.0,
      smoothTouch: false,     // Native inertial momentum scrolling on phones/tablets
      anchorOffsetExtra: 12   // Extra clearance below sticky navbar for anchors
    },
    observer: {
      threshold: 0.15,
      rootMargin: '0px 0px -8% 0px'
    },
    counterObserver: {
      threshold: 0.5          // Counters trigger when 50% visible
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = motionConfig;
}
if (typeof window !== 'undefined') {
  window.motionConfig = motionConfig;
}
