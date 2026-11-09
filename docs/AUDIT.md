# Comprehensive Frontend & Responsive Audit (AUDIT.md)
**Project**: HEA Link (URL shortener, QR codes, bio pages, analytics, AI assist)  
**Date**: 2026-11-09  
**Target Style**: Clean, Minimal, Fast, Stripe/Linear level polish, 0% 3D bloat.

---

## 1. Executive Summary
An in-depth programmatic audit was conducted across the HEA Link frontend codebase (`index.html`, `app.html`, `landing-clean.css`, `app-shell.css`, `style.css`, `dashboard-tokens.css`, `app-shell.js`, `heavy-fx.js`). 

The primary findings identified:
1. **Redundant 3D & WebGL Canvas**: `<canvas id="webgl-bg">` and Three.js runtime initializing WebGL contexts and per-mousemove event listeners, adding significant memory footprint on mobile devices.
2. **Viewport Units (`100vh`)**: 34 instances of hardcoded `100vh` causing vertical jumps and hidden bottom UI elements on mobile browsers (Safari/Chrome navigation bars).
3. **Massive Specificity Wars (`!important`)**: Over 6,200 `!important` declarations, largely due to overrides between `app-shell.css`, `style.css`, and `landing-clean.css`.
4. **Missing Breakpoint Standardization**: Current code contains ad-hoc breakpoints (e.g. 768px, 980px, 1200px) rather than the standard mobile-first matrix (360, 480, 640, 768, 1024, 1280, 1536).
5. **Collapsed Sidebar Layout Breakdown**: When sidebar is collapsed on tablets / narrow screens (768–1023px), icons and text labels overlap and distort.
6. **Mobile Content Concealment**: Excessive `display: none` within mobile media queries (hiding HUD cards, stats, and navigation instead of compact presentation).
7. **Sub-44px Tap Targets**: Several actionable controls (close buttons, icon toggles, pill tabs) under 44px minimum touch target size.
8. **Scroll & Overscroll Conflicts**: Ad-hoc `data-lenis-prevent` tags on containers that are not real scroll panes, and competing wheel listeners.

---

## 2. 100vh Usages & Fixed-Height Containers
Usage of `100vh` ignores mobile address/navigation bar expansion/collapse, resulting in clipped content. All instances need `100dvh` (with `100vh` fallback).

| File | Line | Snippet | Impact / Recommended Fix |
|------|------|---------|--------------------------|
| `app-shell.css` | Line 17 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 18 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 48 | `min-height: 100vh;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 255 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 256 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 265 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 266 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 286 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 287 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 405 | `min-height: 100vh;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 497 | `height: calc(100vh - 60px) !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 498 | `max-height: calc(100vh - 60px) !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 1909 | `min-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 1935 | `min-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 1948 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 1958 | `min-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 1965 | `min-height: calc(100vh - 60px) !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2237 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2238 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2799 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2800 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2807 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2808 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2826 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2827 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2847 | `height: calc(100vh - 64px) !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 2848 | `max-height: calc(100vh - 64px) !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 5025 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 7265 | `height: calc(100vh - 210px);` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 8824 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `app-shell.css` | Line 8825 | `max-height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `style.css` | Line 55 | `min-height: 100vh;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `style.css` | Line 2413 | `max-height: calc(100vh - 75px) !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |
| `style.css` | Line 2799 | `height: 100vh !important;` | Replace with `min-height: 100vh; min-height: 100dvh;` |

---

## 3. Specificity Wars: `!important` Count Per File

| File | `!important` Count | Priority / Action Plan |
|------|--------------------|------------------------|
| `app-shell.css` | 4305 | High. Restructure cascade into tokens -> base -> components -> utilities. Remove unnecessary overrides. |
| `style.css` | 1469 | High. Scope legacy style overrides. |
| `landing-clean.css` | 343 | Medium. Migrate variables to `dashboard-tokens.css`. |
| `app.html` & `index.html` | 78 | Medium. Clean inline style tags. |
| `dashboard-tokens.css` | 6 | Low. Tokens should avoid `!important`. |
| `app-shell.js` | 28 | JS dynamic style injections should use classes. |
| **Total** | **6317** | **Systematic reduction and isolation.** |

---

## 4. Breakpoint Coverage & Matrix Gaps

| Required Standard Breakpoint | Current Status | Coverage in Codebase |
|------------------------------|----------------|----------------------|
| **360px** (Compact Mobile)   | Partial / Missing | Only ad-hoc 320/350px in `app-shell.css`. Needs explicit padding/clamp support. |
| **480px** (Mobile Landscape) | Partial        | Some 480px rules in `style.css`, absent in `landing-clean.css`. |
| **640px** (Phablet / Small Tablet) | Missing  | Replaced arbitrarily with 600px / 650px. Standardize to 640px. |
| **768px** (Tablet Portrait)  | Prevalent      | Used in `landing-clean.css` and `app-shell.css`. Sidebar collapse trigger. |
| **1024px** (Tablet Landscape / Laptop) | Inconsistent | Mixed between 992px, 1024px, and 1080px. Standardize desktop threshold to 1024px. |
| **1280px** (Standard Desktop)| Prevalent     | Container widths max out inconsistently. |
| **1536px** (Wide Screen 2K)  | Missing        | No explicit upper bounds; hero banners stretch without container limit. |

---

## 5. Mobile Display: None Usages (Content Concealment)
Rather than removing components with `display: none`, responsive design requires converting them into compact horizontal scroll or simplified card views:

- **`app-shell.css`** (max-width: 640px): `display: none;`
- **`style.css`** (max-width: 768px): `.hero-br { display: none;`

---

## 6. Tap Targets Under 44px & Accessibility
Actionable elements with sub-standard touch boundaries violate WCAG 2.5.5:

---

## 7. Scroll Systems & Animation Analysis
1. **Lenis & Native Scroll Conflicts**:
   - `heavy-fx.js` initialized Lenis smoothly, but bound directly without checking pointer capability `(pointer: coarse)`.
   - On touch devices, Lenis creates artificial drag resistance or inertial conflicts with native browser momentum scrolling.
   - Recommended: Enable Lenis strictly when `window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
2. **Misplaced `data-lenis-prevent`**:
   - Total 18 instances found.
   - Elements with `data-lenis-prevent` must be limited strictly to real scrolling panes (`.app-main`, `.dashboard-scroll-area`, modals, drawers, HEA Assist message area).
3. **Heavy WebGL Canvas & Mousemove Overhead**:
   - `<canvas id="webgl-bg">` running continuous render loops even when scrolled out of view or obscured.
   - Parallax mousemove on `.hero-visual`, `.glass-card`, tilt cards running without requestAnimationFrame throttling on mobile.
   - Action: Completely remove `#webgl-bg`, Three.js scene graphs, and replace with clean CSS radial-gradient mesh background.

---

## 8. Prioritized Implementation Plan
- **Step 1**: Remove `#webgl-bg` and Three.js canvas from `index.html` and `app.html`. Clean `heavy-fx.js`.
- **Step 2**: Enhance `dashboard-tokens.css` with fluid clamp typography, standardized spacing, and safe-area insets.
- **Step 3**: Fix the collapsed sidebar layout bug (image `media_1794229246900_db52c66c.png`), mobile drawer, and bottom navigation bar.
- **Step 4**: Fix input field overlap and borders (HEA Assist input arrow, shorten URL box).
- **Step 5**: Introduce unified IntersectionObserver scroll reveal system and `motion.config.js`.
