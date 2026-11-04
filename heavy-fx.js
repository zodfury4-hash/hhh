'use strict';

/* =========================================================
   HEA Link — Heavy FX & Motion Engine
   WebGL GLSL Shader, Lenis Smooth Scroll, GSAP Choreography
   & Interactive Skippr Feature Showcase Carousel
   ========================================================= */

(function () {
  // Universal Text & Page Entrance Animation Engine (Always Keeps Headings 100% Solid & Visible)
  window.animatePageText = function (container, options = {}) {
    try {
      const root = container || document.querySelector('#appShell:not([hidden]) #appMainPane') || document.querySelector('section:not([hidden])') || document;
      if (!root) return;
      // Do not animate inside the app dashboard shell to ensure zero jitter
      if (root.id === 'appMainPane' || root.id === 'appShell' || (root.closest && root.closest('#appShell'))) return;

      // Animate container entrance
      if (root.classList) {
        root.classList.remove('hea-page-animating');
        void root.offsetWidth; // force reflow
        root.classList.add('hea-page-animating');
      }

      const selector = options.selector || 'h1, h2, h3, h4, .lead, .hero-title, .lime-text, .eyebrow, .auth-title, .auth-sub, .dash-header h2, .dash-hero-title, .dash-white-card h3, .dash-white-card h4, .stat-val, .stat-num, .card-title, .page-header-title, .view-header h2, .view-header p, .configure-card h3, .template-card h4, .btn-use-template';
      
      let nodes = [];
      try {
        nodes = Array.from(root.querySelectorAll(selector)).filter(el => {
          return el.offsetParent !== null || (window.getComputedStyle && window.getComputedStyle(el).display !== 'none');
        });
      } catch (e) {
        return;
      }

      if (!nodes.length) return;

      // Ensure all elements are ALWAYS completely solid, visible and never hidden on scroll
      nodes.forEach(el => {
        el.style.opacity = '1';
        el.style.visibility = 'visible';
      });

      // Subtle, safe entrance without ever setting opacity to 0
      if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(nodes);
        gsap.fromTo(nodes,
          { opacity: 0.9, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            stagger: 0.02,
            ease: 'power2.out',
            clearProps: 'all'
          }
        );
        return;
      }
    } catch (err) {
      console.warn('animatePageText notice:', err);
    }
  };

  // Wait until DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  function initAll() {
    initShaderBackground();
    init3DCyberChainStage();
    initLenisScroll();
    initGsapAnimations();
    initSkipprSlider();
    initInteractive3DTilt();
    initFramerMotionEngine();
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

      // Smooth radial Gaussian falloff for clean ambient light nodes
      float softGlow(vec2 st, vec2 center, float radius) {
        float d = length(st - center);
        return exp(- (d * d) / (2.0 * radius * radius));
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        st.x *= aspect;

        vec2 mouse = u_mouse * vec2(aspect, 1.0);
        float t = u_time * 0.22;
        float scrollOffset = u_scroll * 0.0003;

        // Base soft, luminous cloud-blue / ethereal sky palette (Matches reference image)
        vec3 color = vec3(0.945, 0.968, 1.0); // #f1f7ff base

        // Subtle slow drifting ambient light positions (smooth lissajous motion)
        vec2 p1 = vec2(0.20 * aspect + sin(t * 0.4) * 0.12, 0.85 + cos(t * 0.3) * 0.08 - scrollOffset * 0.2);
        vec2 p2 = vec2(0.85 * aspect + cos(t * 0.35) * 0.10, 0.78 + sin(t * 0.45) * 0.08);
        vec2 p3 = vec2(0.50 * aspect + sin(t * 0.25) * 0.15, 0.30 + cos(t * 0.35) * 0.10);

        // Soft, elegant atmospheric glows
        float g1 = softGlow(st, p1, 0.65); // Soft ethereal blue
        float g2 = softGlow(st, p2, 0.55); // Soft ambient sky/cyan
        float g3 = softGlow(st, p3, 0.70); // Pure cloud white ambient
        float gMouse = softGlow(st, mouse, 0.35); // Interactive cursor light

        // Soft, clean cloud-sky palette
        vec3 colBlue  = vec3(0.72, 0.84, 1.0);  // Soft sky blue
        vec3 colCyan  = vec3(0.80, 0.92, 0.98); // Soft cyan
        vec3 colWhite = vec3(1.0, 1.0, 1.0);    // Crisp white cloud
        vec3 colGlow  = vec3(0.86, 0.93, 1.0);  // Subtle blue ambient glow

        // Blend ambient cloud lighting
        color = mix(color, colBlue, g1 * 0.42);
        color = mix(color, colCyan, g2 * 0.28);
        color = mix(color, colWhite, g3 * 0.45);
        color = mix(color, colGlow, gMouse * 0.20);

        // Faint, high-end technical dot grid (ultra subtle 40px grid)
        vec2 grid = fract(gl_FragCoord.xy / 40.0) - 0.5;
        float dGrid = length(grid * 40.0);
        float dots = smoothstep(1.3, 0.3, dGrid) * 0.025;
        color -= vec3(dots * 0.3);

        gl_FragColor = vec4(color, 1.0);
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
      if (!href || href === '#' || href.startsWith('#go-') || href.startsWith('#bio-') || href.includes('/')) return;

      try {
        const targetEl = document.querySelector(href);
        if (targetEl && !targetEl.closest('#appShell')) {
          e.preventDefault();
          lenis.scrollTo(targetEl, { offset: -80, duration: 1.2 });
        }
      } catch (err) {}
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
      heroTl.set('.hero h1, .hero .lead, .hero .hero-card, .hero .pill', { clearProps: 'all' });
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

    // Headings and section titles are kept 100% visible on scroll - never hidden with opacity 0!
    document.querySelectorAll('h1, h2, h3, h4, .hero-title, .eyebrow').forEach(el => {
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });

    // 3. Features Cards Stagger (Unified Row Trigger with Full Props Cleanup)
    if (document.querySelector('#features')) {
      gsap.from('#features .fc', {
        scrollTrigger: {
          trigger: '#features',
          start: 'top 88%',
          once: true
        },
        opacity: 0,
        y: 35,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }

    // 4. Advanced Split Section Cards
    if (document.querySelector('#adv')) {
      gsap.from('#adv .fc', {
        scrollTrigger: {
          trigger: '#adv',
          start: 'top 88%',
          once: true
        },
        opacity: 0,
        x: 35,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }

    // 5. Steps Cards Sequential Cascade (Unified Row Trigger with Full Props Cleanup)
    if (document.querySelector('#steps')) {
      gsap.from('#steps .fc', {
        scrollTrigger: {
          trigger: '#steps',
          start: 'top 88%',
          once: true
        },
        opacity: 0,
        y: 35,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }

    // 6. Pricing Plans Cards Scale-in (Unified Row Trigger with Full Props Cleanup)
    if (document.querySelector('#plans')) {
      gsap.from('#plans .card', {
        scrollTrigger: {
          trigger: '#plans',
          start: 'top 88%',
          once: true
        },
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }

    // 7. FAQ Accordion Items
    if (document.querySelector('#faq')) {
      gsap.from('#faq details', {
        scrollTrigger: {
          trigger: '#faq',
          start: 'top 90%',
          once: true
        },
        opacity: 0,
        y: 20,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }

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
     6. 3D CYBER CHAIN LINKS ON GLOWING PEDESTAL (Hero Stage)
     Matches media_1793564494242_dc725741.png
     --------------------------------------------------------- */
  function init3DCyberChainStage() {
    const canvas = document.getElementById('chain3dCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Mini QR inside HUD card
    setTimeout(() => {
      const miniCv = document.getElementById('stageQrMini');
      if (miniCv && typeof window.drawQR === 'function') {
        window.drawQR(miniCv, 'https://healink.store', '#0070f3', '#ffffff', 48);
      }
    }, 200);

    const wrap = canvas.parentElement;
    if (!wrap) return;

    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return;
    } catch (e) {
      return;
    }

    const width = wrap.clientWidth || 540;
    const height = wrap.clientHeight || 540;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 9.2);
    camera.lookAt(0, 0.05, 0);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // 1. Soft Blue Radial Ground Shadow (Matches reference image depth)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
    sGrad.addColorStop(0, 'rgba(0, 112, 243, 0.32)');
    sGrad.addColorStop(0.35, 'rgba(0, 112, 243, 0.14)');
    sGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.04)');
    sGrad.addColorStop(1, 'rgba(0, 112, 243, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.6), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.15;
    stageGroup.add(shadowPlane);

    // 2. 3D Lemniscate of Bernoulli Curve (Infinity Loop)
    class InfinityCurve extends THREE.Curve {
      constructor(scale = 2.7) {
        super();
        this.scale = scale;
      }
      getPoint(t, optionalTarget = new THREE.Vector3()) {
        const point = optionalTarget;
        const u = t * Math.PI * 2.0;
        const scale = this.scale;
        const denom = 1.0 + Math.sin(u) * Math.sin(u);
        const x = (scale * Math.cos(u)) / denom;
        const y = (scale * Math.sin(u) * Math.cos(u)) / denom * 1.55;
        // Subtle volumetric 3D wave
        const z = Math.sin(u * 2.0) * 0.45;
        return point.set(x, y, z);
      }
    }

    const path = new InfinityCurve(2.7);
    const infinityGeom = new THREE.TubeGeometry(path, 180, 0.48, 36, true);

    // Glossy Electric Blue Physical Material with Clearcoat (Exact match to reference image)
    const infinityMat = new THREE.MeshPhysicalMaterial({
      color: 0x007aff,          // Rich electric sky blue
      emissive: 0x0033aa,       // Subtle deep blue glow
      emissiveIntensity: 0.18,
      roughness: 0.12,
      metalness: 0.10,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.95
    });
    const infinityMesh = new THREE.Mesh(infinityGeom, infinityMat);
    infinityMesh.position.y = 0.05;
    stageGroup.add(infinityMesh);

    // 3. Thin Glowing Orbital Ring tilted around the Infinity Loop
    const ringGeom = new THREE.TorusGeometry(3.35, 0.024, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd0e8ff,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI * 0.36;
    ringMesh.rotation.y = Math.PI * 0.12;
    stageGroup.add(ringMesh);

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 8, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88ccff, 1.6);
    fillLight.position.set(-7, 2, 5);
    scene.add(fillLight);

    const bottomGlow = new THREE.PointLight(0x00aaff, 2.2, 12);
    bottomGlow.position.set(0, -1.8, 3);
    scene.add(bottomGlow);

    // Interactive mouse tilt
    let targetRotX = 0;
    let targetRotY = 0;
    window.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotY = x * 0.25;
      targetRotX = y * 0.15;
    });

    window.addEventListener('resize', () => {
      if (!wrap) return;
      const w = wrap.clientWidth || 540;
      const h = wrap.clientHeight || 540;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });

    // Render loop
    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth floating bob
      infinityMesh.position.y = 0.05 + Math.sin(elapsed * 1.6) * 0.1;
      infinityMesh.rotation.y = Math.sin(elapsed * 0.7) * 0.22;
      infinityMesh.rotation.x = 0.08 + Math.cos(elapsed * 0.5) * 0.06;

      ringMesh.position.y = Math.sin(elapsed * 1.6 + 0.4) * 0.08;
      ringMesh.rotation.z += 0.003;

      // Mouse interactive tilt damping
      stageGroup.rotation.y += (targetRotY - stageGroup.rotation.y) * 0.06;
      stageGroup.rotation.x += (targetRotX - stageGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);
    }
    animate();
  }

  function initFramerMotionEngine() {
    if (typeof window.Motion === 'undefined' || typeof window.Motion.animate !== 'function') return;

    const { animate } = window.Motion;

    // 1. Tactile spring physics on all interactive buttons
    document.querySelectorAll('.btn, .hero-submit-btn, .tabs button, .hero-features-strip .feat-item, .plans .card, .cycle-tab, .checkout-submit-btn').forEach(el => {
      el.addEventListener('pointerdown', () => {
        animate(el, { scale: 0.96 }, { duration: 0.1 });
      });
      el.addEventListener('pointerup', () => {
        animate(el, { scale: 1 }, { duration: 0.25, easing: [0.34, 1.56, 0.64, 1] });
      });
      el.addEventListener('pointerleave', () => {
        animate(el, { scale: 1 }, { duration: 0.2 });
      });
    });

    // 2. Smooth floating spring on floating glass stat badges
    const statCards = document.querySelectorAll('.cyber-float-card');
    statCards.forEach((card, idx) => {
      const delay = idx * 0.4;
      animate(card, {
        y: [-4, 6, -4],
        rotate: [idx === 0 ? -1 : 1, idx === 0 ? 1 : -1, idx === 0 ? -1 : 1]
      }, {
        duration: 4.5 + idx * 0.8,
        delay: delay,
        repeat: Infinity,
        easing: 'ease-in-out'
      });
    });
  }
})();
