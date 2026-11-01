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
    init3DCyberChainStage();
    initLenisScroll();
    initGsapAnimations();
    initSkipprSlider();
    initInteractive3DTilt();
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

        // Base luxury midnight dark space
        vec3 color = vec3(0.043, 0.067, 0.125); // #0b1120

        // Subtle slow drifting ambient light positions (smooth lissajous motion)
        vec2 p1 = vec2(0.20 * aspect + sin(t * 0.4) * 0.12, 0.85 + cos(t * 0.3) * 0.08 - scrollOffset * 0.2);
        vec2 p2 = vec2(0.85 * aspect + cos(t * 0.35) * 0.10, 0.78 + sin(t * 0.45) * 0.08);
        vec2 p3 = vec2(0.50 * aspect + sin(t * 0.25) * 0.15, 0.30 + cos(t * 0.35) * 0.10);

        // Soft, elegant atmospheric glows
        float g1 = softGlow(st, p1, 0.55); // Top-left Royal Blue
        float g2 = softGlow(st, p2, 0.48); // Top-right Emerald / Teal
        float g3 = softGlow(st, p3, 0.60); // Mid-bottom Deep Purple
        float gMouse = softGlow(st, mouse, 0.32); // Interactive subtle cursor light

        // Refined, subtle color palette
        vec3 colBlue   = vec3(0.145, 0.388, 0.922); // #2563eb
        vec3 colTeal   = vec3(0.176, 0.831, 0.749); // #2dd4bf
        vec3 colViolet = vec3(0.486, 0.227, 0.929); // #7c3aed
        vec3 colSky    = vec3(0.22, 0.741, 0.973);  // #38bdf8

        // Combine ambient lighting (soft, calm, elegant)
        color += colBlue * g1 * 0.22;
        color += colTeal * g2 * 0.14;
        color += colViolet * g3 * 0.12;
        color += colSky * gMouse * 0.15;

        // Faint, high-end technical dot grid (subtle 36px grid)
        vec2 grid = fract(gl_FragCoord.xy / 36.0) - 0.5;
        float dGrid = length(grid * 36.0);
        float dots = smoothstep(1.4, 0.4, dGrid) * 0.06;
        color += vec3(dots);

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
        window.drawQR(miniCv, 'https://healink.store', '#38bdf8', '#090f22', 48);
      }
    }, 200);

    const wrap = canvas.parentElement;
    if (!wrap) return;

    // Check WebGL support
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return;
    } catch (e) {
      return;
    }

    const width = wrap.clientWidth || 500;
    const height = wrap.clientHeight || 460;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 8.2);

    const stageGroup = new THREE.Group();
    scene.add(stageGroup);

    // 1. Pedestal Base (Concentric Cyber Rings)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.y = -2.1;
    stageGroup.add(pedestalGroup);

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x071126,
      metalness: 0.85,
      roughness: 0.25
    });

    // Tier 1
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.3, 0.45, 48), baseMat);
    pedestalGroup.add(tier1);

    // Tier 2
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.65, 0.4, 48), baseMat);
    tier2.position.y = 0.38;
    pedestalGroup.add(tier2);

    // Tier 3
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.05, 0.35, 48), baseMat);
    tier3.position.y = 0.72;
    pedestalGroup.add(tier3);

    // Neon Glow Rings on Pedestal Tiers
    const ringMatCyan = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    const ringMatLime = new THREE.MeshBasicMaterial({ color: 0xD4FF24 });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.045, 16, 64), ringMatCyan);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.22;
    pedestalGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.055, 16, 64), ringMatCyan);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.56;
    pedestalGroup.add(ring2);

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.065, 16, 64), ringMatLime);
    ring3.rotation.x = Math.PI / 2;
    ring3.position.y = 0.88;
    pedestalGroup.add(ring3);

    // Central Core Disc
    const coreDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.06, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    coreDisc.position.y = 0.9;
    pedestalGroup.add(coreDisc);

    // 2. Interlocking 3D Chain Links
    const chainGroup = new THREE.Group();
    chainGroup.position.y = 0.4;
    stageGroup.add(chainGroup);

    function createChainLink(color, emissive, scaleY) {
      const geo = new THREE.TorusGeometry(1.35, 0.4, 28, 72);
      geo.scale(1.0, scaleY || 1.45, 1.0);
      const mat = new THREE.MeshPhysicalMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: 0.65,
        metalness: 0.6,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.4,
        ior: 1.5
      });
      return new THREE.Mesh(geo, mat);
    }

    // Left Link: Emerald / Lime Green
    const link1 = createChainLink(0x10b981, 0x059669, 1.46);
    link1.position.set(-0.65, 0.05, 0);
    link1.rotation.set(0.42, 0.32, 0.78);
    chainGroup.add(link1);

    // Right Link: Electric Cyan / Neon Blue (Interlocked)
    const link2 = createChainLink(0x00d2ff, 0x0066ff, 1.46);
    link2.position.set(0.65, 0.65, 0);
    link2.rotation.set(-0.38, -0.36, -0.72);
    chainGroup.add(link2);

    // 3. Orbiting Neon Rings in 3D around the links
    const orbit1 = new THREE.Mesh(
      new THREE.TorusGeometry(2.85, 0.028, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    orbit1.rotation.set(1.2, 0.4, 0.2);
    stageGroup.add(orbit1);

    const orbit2 = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.022, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0xD4FF24, transparent: true, opacity: 0.5 })
    );
    orbit2.rotation.set(-0.8, -0.6, 0.8);
    stageGroup.add(orbit2);

    // 4. Floating Cyber Sparkle Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5.0;
      particlePositions[i + 1] = (Math.random() - 0.5) * 4.0 - 0.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 4.0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.065,
      transparent: true,
      opacity: 0.85
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    stageGroup.add(particles);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1a3a, 2.2);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00d2ff, 4, 15);
    cyanLight.position.set(2, 2, 3);
    scene.add(cyanLight);

    const limeLight = new THREE.PointLight(0xD4FF24, 3.5, 15);
    limeLight.position.set(-2.5, 1, 3);
    scene.add(limeLight);

    const bottomSpot = new THREE.SpotLight(0x38bdf8, 5, 10, Math.PI / 4, 0.5);
    bottomSpot.position.set(0, -2, 0);
    bottomSpot.target.position.set(0, 0, 0);
    scene.add(bottomSpot);
    scene.add(bottomSpot.target);

    // Mouse tracking for 3D tactile tilt
    let targetRotX = 0;
    let targetRotY = 0;
    window.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetRotY = x * 0.35;
      targetRotX = y * 0.2;
    });

    // Resize handler
    window.addEventListener('resize', () => {
      if (!wrap) return;
      const w = wrap.clientWidth || 500;
      const h = wrap.clientHeight || 460;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });

    // Render loop
    let clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth floating and gentle oscillation
      chainGroup.position.y = 0.4 + Math.sin(elapsed * 1.5) * 0.12;
      chainGroup.rotation.y = Math.sin(elapsed * 0.6) * 0.1;

      // Orbit rings rotation
      orbit1.rotation.z = elapsed * 0.35;
      orbit2.rotation.z = -elapsed * 0.28;

      // Particles gentle upward drift
      const positions = particleGeo.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.007;
        if (positions[i] > 2.5) positions[i] = -2.0;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Mouse interactive tilt damping
      stageGroup.rotation.y += (targetRotY - stageGroup.rotation.y) * 0.05;
      stageGroup.rotation.x += (targetRotX - stageGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    }
    animate();
  }
})();
