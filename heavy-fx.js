'use strict';

/* =========================================================
   HEA Link — Heavy FX & Motion Engine
   WebGL GLSL Shader, Lenis Smooth Scroll, GSAP Choreography
   & Interactive Skippr Feature Showcase Carousel
   ========================================================= */

(function () {
  // Wait until DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  function initAll() {
    initShaderBackground();
    initLenisScroll();
    initGsapAnimations();
    initSkipprSlider();
    initInteractive3DTilt();
    initAmbientSpotlight();
  }

  /* ---------------------------------------------------------
     1. THREE.JS & REAL-TIME WEBGL GLSL SHADER BACKGROUND
     --------------------------------------------------------- */
  function initShaderBackground() {
    const canvas = document.getElementById('webgl-bg');
    if (!canvas || typeof THREE === 'undefined') return;

    // Check WebGL support
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return;
    } catch (e) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_scroll: { value: 0.0 }
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform float u_scroll;
      varying vec2 vUv;

      // Simplex 2D noise implementation
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        st.x *= aspect;

        vec2 m = u_mouse * vec2(aspect, 1.0);
        float distToMouse = length(st - m);

        float t = u_time * 0.16;
        float scrollWave = u_scroll * 0.0006;

        // Multi-layered organic fluid motion
        vec2 q = vec2(0.0);
        q.x = snoise(st * 0.9 + vec2(t * 0.25, scrollWave));
        q.y = snoise(st * 0.9 + vec2(t * 0.18, t * 0.12));

        vec2 r = vec2(0.0);
        r.x = snoise(st * 1.6 + 1.2 * q + vec2(1.7, 9.2) + 0.12 * t);
        r.y = snoise(st * 1.6 + 1.2 * q + vec2(8.3, 2.8) + 0.09 * t);

        // Fluid distortion toward mouse
        float mouseField = smoothstep(0.75, 0.0, distToMouse);
        r += (st - m) * mouseField * 0.25;

        float f = snoise(st * 1.3 + r);

        // Color Palette corresponding to HEA Link Glassmorphism Theme
        vec3 darkVoid   = vec3(0.043, 0.067, 0.125); // #0b1120 deep navy
        vec3 navyGlow   = vec3(0.082, 0.153, 0.322); // #152752 deep blue
        vec3 royalBlue  = vec3(0.145, 0.388, 0.922); // #2563eb bright cobalt
        vec3 electricSky = vec3(0.22, 0.741, 0.973);  // #38bdf8 sky blue
        vec3 luminousTeal = vec3(0.176, 0.831, 0.749); // #2dd4bf teal
        vec3 cosmicViolet = vec3(0.486, 0.227, 0.929); // #7c3aed violet
        vec3 acidLime    = vec3(0.831, 1.0, 0.141);   // #D4FF24 brand lime

        // Interpolation
        vec3 color = mix(darkVoid, navyGlow, clamp((st.y + 0.2), 0.0, 1.0));
        color = mix(color, royalBlue, clamp(f * f * 2.2, 0.0, 1.0) * 0.7);
        color = mix(color, cosmicViolet, clamp(length(q) * 0.65, 0.0, 1.0) * 0.45);
        color = mix(color, luminousTeal, clamp(length(r.x) * 0.55, 0.0, 1.0) * 0.5);

        // Acid Lime accents and highlights
        float limeSparks = pow(clamp(f * 0.88 + mouseField * 0.45, 0.0, 1.0), 3.8);
        color += acidLime * limeSparks * 0.25;

        // Interactive cursor spotlight highlight
        color += electricSky * mouseField * 0.22;

        // Subtle micro-grain for analogue film depth
        float grain = fract(sin(dot(gl_FragCoord.xy + vec2(u_time * 4.0), vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - 0.5) * 0.02;

        gl_FragColor = vec4(color, 0.95);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: uniforms,
      depthWrite: false,
      depthTest: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse & scroll tracking with smooth interpolation
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let currentMouseX = 0.5;
    let currentMouseY = 0.5;
    let targetScroll = 0;
    let currentScroll = 0;

    window.addEventListener('mousemove', (e) => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = 1.0 - (e.clientY / window.innerHeight);
    }, { passive: true });

    window.addEventListener('scroll', () => {
      targetScroll = window.scrollY || window.pageYOffset || 0;
    }, { passive: true });

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w * dpr, h * dpr);
    }, { passive: true });

    const clock = new THREE.Clock();
    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      uniforms.u_time.value += delta;

      // Smooth lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;
      uniforms.u_mouse.value.set(currentMouseX, currentMouseY);

      currentScroll += (targetScroll - currentScroll) * 0.05;
      uniforms.u_scroll.value = currentScroll;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ---------------------------------------------------------
     2. LENIS SMOOTH MOMENTUM SCROLLING
     --------------------------------------------------------- */
  function initLenisScroll() {
    if (typeof Lenis === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1.0
    });

    window.lenis = lenis;

    // Connect Lenis to GSAP ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      if (typeof gsap !== 'undefined') {
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    // Smooth scroll for in-page anchors
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#go-')) return;

      const targetEl = document.querySelector(href);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -80, duration: 1.2 });
      }
    });
  }

  /* ---------------------------------------------------------
     3. GSAP + SCROLLTRIGGER CHOREOGRAPHY
     --------------------------------------------------------- */
  function initGsapAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Entrance Animation
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.0 } });

    if (document.querySelector('.hero .pill')) {
      heroTl.from('.hero .pill', {
        y: -30,
        opacity: 0,
        scale: 0.9,
        duration: 0.8
      });
    }

    if (document.querySelector('.hero h1')) {
      heroTl.from('.hero h1', {
        y: 40,
        opacity: 0,
        duration: 1.1,
        filter: 'blur(8px)'
      }, '-=0.5');
    }

    if (document.querySelector('.hero .lead')) {
      heroTl.from('.hero .lead', {
        y: 30,
        opacity: 0,
        duration: 0.9
      }, '-=0.7');
    }

    if (document.querySelector('.hero .hero-card')) {
      heroTl.from('.hero .hero-card', {
        y: 50,
        opacity: 0,
        scale: 0.95,
        duration: 1.1,
        boxShadow: '0 0 0 rgba(0,0,0,0)'
      }, '-=0.7');
    }

    // 2. Section Headers Reveal on Scroll
    gsap.utils.toArray('.eyebrow').forEach((eyebrow) => {
      gsap.from(eyebrow, {
        scrollTrigger: {
          trigger: eyebrow,
          start: 'top 88%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 20,
        letterSpacing: '0.25em',
        duration: 0.7,
        ease: 'power3.out'
      });
    });

    gsap.utils.toArray('h2').forEach((h2) => {
      // Exclude hero card or headers inside hidden sections
      if (h2.closest('.hero')) return;
      gsap.from(h2, {
        scrollTrigger: {
          trigger: h2,
          start: 'top 88%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 35,
        duration: 0.9,
        ease: 'power3.out'
      });
    });

    // 3. Features Cards Stagger
    ScrollTrigger.batch('#features .fc', {
      start: 'top 85%',
      onEnter: (batch) => {
        gsap.from(batch, {
          opacity: 0,
          y: 50,
          scale: 0.92,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out'
        });
      },
      once: true
    });

    // 4. Advanced Split Section Cards
    ScrollTrigger.batch('#adv .fc', {
      start: 'top 85%',
      onEnter: (batch) => {
        gsap.from(batch, {
          opacity: 0,
          x: 40,
          stagger: 0.12,
          duration: 0.85,
          ease: 'power3.out'
        });
      },
      once: true
    });

    // 5. Steps Cards Sequential Cascade
    ScrollTrigger.batch('#steps .fc', {
      start: 'top 85%',
      onEnter: (batch) => {
        gsap.from(batch, {
          opacity: 0,
          y: 45,
          stagger: 0.15,
          duration: 0.9,
          ease: 'power3.out'
        });
      },
      once: true
    });

    // 6. Pricing Plans Cards Scale-in
    ScrollTrigger.batch('#plans .card', {
      start: 'top 85%',
      onEnter: (batch) => {
        gsap.from(batch, {
          opacity: 0,
          y: 55,
          scale: 0.92,
          stagger: 0.15,
          duration: 0.9,
          ease: 'back.out(1.4)'
        });
      },
      once: true
    });

    // 7. FAQ Accordion Items
    ScrollTrigger.batch('#faq details', {
      start: 'top 90%',
      onEnter: (batch) => {
        gsap.from(batch, {
          opacity: 0,
          y: 25,
          stagger: 0.08,
          duration: 0.6,
          ease: 'power2.out'
        });
      },
      once: true
    });

    // Refresh ScrollTrigger when dynamic DOM content renders
    window.addEventListener('load', () => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 800);
  }

  /* ---------------------------------------------------------
     4. SKIPPR FEATURE SHOWCASE SLIDER
     --------------------------------------------------------- */
  function initSkipprSlider() {
    const slider = document.getElementById('skipperSlider');
    if (!slider) return;

    const track = slider.querySelector('.skipper-track');
    const slides = slider.querySelectorAll('.skipper-slide');
    const prevBtn = slider.querySelector('.skipper-btn.prev');
    const nextBtn = slider.querySelector('.skipper-btn.next');
    const dots = slider.querySelectorAll('.skipper-pagination .dot');

    if (!slides.length) return;

    let currentIndex = 0;
    const total = slides.length;
    let timer = null;

    function goToSlide(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      currentIndex = index;

      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('on', i === currentIndex);
      });
    }

    function nextSlide() {
      goToSlide(currentIndex + 1);
    }

    function prevSlide() {
      goToSlide(currentIndex - 1);
    }

    function startAutoPlay() {
      stopAutoPlay();
      timer = setInterval(nextSlide, 5000);
    }

    function stopAutoPlay() {
      if (timer) clearInterval(timer);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoPlay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoPlay();
      });
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goToSlide(i);
        startAutoPlay();
      });
    });

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    // Touch / swipe support
    let startX = 0;
    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      stopAutoPlay();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
      startAutoPlay();
    }, { passive: true });

    startAutoPlay();
  }

  /* ---------------------------------------------------------
     5. 3D TACTILE MOUSE PARALLAX TILT ON CARDS
     --------------------------------------------------------- */
  function initInteractive3DTilt() {
    // Only enable on desktop devices with fine pointers
    if (window.matchMedia('(hover: none)').matches) return;

    const cards = document.querySelectorAll('.card, .fc, .hero-card, .skipper-slide');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const maxTilt = 7;
        const rotX = ((y / (rect.height / 2)) * -maxTilt).toFixed(2);
        const rotY = ((x / (rect.width / 2)) * maxTilt).toFixed(2);

        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
        card.style.setProperty('--mouse-x', `${(e.clientX - rect.left)}px`);
        card.style.setProperty('--mouse-y', `${(e.clientY - rect.top)}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------
     6. AMBIENT GLOW SPOTLIGHT CURSOR
     --------------------------------------------------------- */
  function initAmbientSpotlight() {
    if (window.matchMedia('(hover: none)').matches) return;

    let spotlight = document.getElementById('ambient-spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.id = 'ambient-spotlight';
      document.body.appendChild(spotlight);
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currX = targetX;
    let currY = targetY;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      spotlight.style.opacity = '1';
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      spotlight.style.opacity = '0';
    });

    function loop() {
      currX += (targetX - currX) * 0.12;
      currY += (targetY - currY) * 0.12;
      spotlight.style.transform = `translate3d(${currX - 250}px, ${currY - 250}px, 0)`;
      requestAnimationFrame(loop);
    }
    loop();
  }
})();
