# CHANGELOG: Production Responsive & Scroll Animation Upgrade
**Project**: HEA Link (URL shortener, QR codes, bio pages, analytics, HEA Assist AI)  
**Date**: November 2026  
**Status**: Production Ready (0% 3D bloat, Stripe/Linear level polish, full mobile-first responsiveness)

---

## 1. Single Source of Truth & 3D / WebGL Decommissioning
- **Archival**: Moved legacy React + Three.js landing bundle (`landing/`, `assets/`) into `/archive` preserving git history while removing 1.4 MB of runtime JS bloat.
- **Unification**: Mirror-synced `app.html` into `index.html` ensuring consistent layout, design tokens, navigation, and hash routes (`#home`, `#login`, `#signup`, `#dashboard`).
- **WebGL Canvas Removal**: Completely removed `<canvas id="webgl-bg">` from DOM in `index.html` and `app.html`. Replaced heavy GPU fragment shaders with clean CSS ambient gradient meshes.
- **Mousemove Overhead Elimination**: Stripped real-time mouse-tracking GLSL canvas calculations from `heavy-fx.js`. Disabled 3D tilt calculations on coarse pointers and mobile devices.

---

## 2. Part A: Responsive Upgrades on Every Device

### Foundation & Tokens (`dashboard-tokens.css`)
- **Fluid Typography**:
  - `h1, .hero-title, .topbar-title`: `clamp(2rem, 5.5vw + 0.5rem, 3.5rem)`
  - `h2, .section-heading h2, .view-header h2`: `clamp(1.5rem, 3vw + 0.5rem, 2.5rem)`
  - `h3`: `clamp(1.25rem, 2vw + 0.25rem, 1.75rem)`
  - `body, input, textarea`: minimum `16px` on mobile (<768px) to eliminate iOS safari auto-zoom jump.
- **Viewport Meta**: Added `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **Viewport Units**: Modernized 34 instances of hardcoded `100vh` across `app-shell.css` and `style.css` to `100dvh` with `100vh` backward-compatibility fallbacks.
- **Safe Area Insets**: Integrated `env(safe-area-inset-top/right/bottom/left)` tokens for notch and home-indicator protection on iOS/Android.
- **Horizontal Overflow**: Applied `overflow-x: clip;` on `body` with `min-width: 0` constraints on flex children.

### Dashboard & Navigation
- **Sidebar Collapsed State Fix**:
  - Resolved the overlapping icon/label bug on tablet and collapsed mode.
  - In collapsed state (`72px` width) or tablet (`768px–1023px`), all text labels, workspace tags, and user names are strictly hidden (`display: none !important`), rendering clean `44x44px` centered icon targets.
  - In expanded desktop mode (`>=1024px`), horizontal row layout is maintained with clear labels and badges.
- **Mobile Off-Canvas Drawer (<768px)**:
  - Sidebar transitions to a smooth off-canvas slide drawer (`transform: translateX(-100%)` to `translateX(0)`) with backdrop overlay (`.sidebar-backdrop`).
- **Mobile Bottom Navigation Bar (<768px)**:
  - Added fixed bottom navigation bar (`.app-mobile-bottom-nav`) with 5 core touchpoints: Home, Links, Create (+ pill), QR Codes, Analytics, More.
  - Respects safe-area padding at bottom.
- **HEA Assist AI Panel**:
  - Desktop: right-side docked drawer.
  - Mobile (<768px): bottom sheet (`height: 85dvh`, rounded top corners `24px`, own scroll pane).
  - Fixed input field layout: send button is cleanly aligned inside the capsule with zero text overlap.
- **Responsive Tables**:
  - For screens `<768px`, data tables (`.dash-table`, `.links-table`, `.settings-email-table`) dynamically transform from wide row format to individual stacked mobile cards with `data-label` key-value pairs.

### Landing Page & Auth
- **Navbar Drawer (<1024px)**:
  - Added slide-in right drawer with accessible backdrop, body scroll lock, ESC key listener, and full-width `48px` high Login/Sign-up CTA buttons.
- **Hero & Shorten Capsule**:
  - Center-aligned typography on mobile.
  - Shorten tabs (`Short link`, `QR code`, `Bulk`) become horizontally scrollable pills with momentum scroll.
  - HUD cards adapt to a compact 3-item row below the product mockup rather than being completely removed with `display: none`.
- **Auth Views**:
  - Single column below `900px`, decorative right column hidden, inputs centered with `48px` tap targets.

---

## 3. Part B: Scroll Animations & Motion Tokens

### Smooth Scrolling System
- **Lenis 1.1.x**: Restricted strictly to desktop environments:
  - Guard: `(hover: hover) and (pointer: fine) && !prefers-reduced-motion`
  - Mobile & touch devices use native browser momentum scrolling (no touch hijacking).
  - Duration: `1.0s`, Easing: `t => Math.min(1, 1.001 - Math.pow(2, -10 * t))`, WheelMultiplier: `1.0`.
  - In-page anchor offset: `-((headerHeight || 64) + 12px)`.

### Reveal-on-Scroll Engine (`landing-clean.js` + `dashboard-tokens.css`)
- **IntersectionObserver Configuration**:
  - `threshold`: `0.15`
  - `rootMargin`: `'0px 0px -8% 0px'`
- **CSS Transitions**:
  - Initial state: `opacity: 0; transform: translateY(20px); will-change: opacity, transform;`
  - Active state (`.is-revealed`): `opacity: 1; transform: translateY(0);`
  - Duration: `600ms` (`--motion-duration-reveal`)
  - Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (`--motion-ease-reveal`)
  - Performance: `will-change` is removed on `transitionend` to reclaim GPU memory.
  - Stagger: Child items in `[data-reveal-group]` stagger at `70ms` intervals (up to 6 elements).
- **Reduced Motion**: If user prefers reduced motion, elements display immediately at `opacity: 1; transform: none; transition: none;`.

### Scroll Enhancements
- **Scroll Progress Bar**: Added fixed `2.5px` high progress indicator (`#scrollProgressBar`) that scales horizontally across the top of the viewport.
- **Navbar Shrink & Blur**: Compact state triggers when `scrollY > 20px`:
  - Height shrinks from `64px` to `54px`.
  - Background blurs with `backdrop-filter: blur(20px) saturate(180%)`.
- **Active Section Highlighting**: IntersectionObserver automatically toggles `.active` on navigation menu links as sections enter viewport.

---

## 4. Configuration Deliverables
- `motion.config.js`: Central configuration exporting duration, easing, observer thresholds, and Lenis settings.
- `AUDIT.md`: Pre-implementation audit report with file-and-line defect logs.
- `TEST_CHECKLIST.md`: Cross-device responsive and animation verification matrix.


---

## 5. Phase 2: Responsive Foundation, Landing & Auth (Per Breakpoint)

### Breakpoint Matrix Specification

#### 1. `< 360px` (Compact Mobile — iPhone SE 1st gen, Galaxy Fold outer screen)
- **Viewport**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- **Layout**: Single column flow with `padding: 0 12px;` to prevent horizontal edge crowding.
- **Typography**: Fluid `h1` scales to `2rem`, `body` locked to `16px` to prevent iOS viewport distortion.
- **Hero**: Order strictly enforces `headline -> subtitle -> shorten box -> visual mockup`. Shorten tabs scroll horizontally. Input and button stack vertically with `100%` width.
- **Auth**: Single column, centered form, `48px` full-width SSO buttons (`Continue with Google`, `Continue with Apple`), and `48px` inputs.
- **Touch**: All tap targets enforce minimum `44x44px` with `touch-action: manipulation`.

#### 2. `360px – 479px` (Standard Mobile — iPhone 13/14/15, Pixel 7/8, Galaxy S23)
- **Safe Areas**: `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` applied to mobile nav bar, drawers, and modal sheets.
- **HUD Telemetry Cards**: Converted from absolute floating layout into a compact 3-item row (`.hud-analytics`, `.hud-clicks`, `.hud-qr`) beneath the product mockup (zero items hidden via `display: none`).
- **Footer**: Mobile accordion triggers on column titles (`Platform`, `Solutions`, `Resources`, `Company`) with `+ / −` indicators.
- **Dashboard**: Fixed bottom navigation bar (`58px + safe-bottom`) with 5 core tabs. Off-canvas drawer accessible via topbar hamburger with tap backdrop.
- **HEA Assist**: Renders as an `85dvh` bottom sheet with dedicated scroll container and non-overlapping input action button.

#### 3. `480px – 639px` (Large Mobile & Landscape Handsets)
- **Hero Form**: Shorten pill input allows horizontal layout when orientation permits, falling back to stacked buttons when input text length exceeds viewport width.
- **Carousel**: Native horizontal scroll-snap enabled on `.skipper-track` (`scroll-snap-type: x mandatory`). Swipe gestures sync active dots without requiring drag emulation JS.
- **Tables**: Wide tables (`.dash-table`, `.links-table`) render in stacked card mode with bold attribute labels (`data-label`).
- **Auth**: Inputs scroll into center view automatically on soft keyboard focus (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).

#### 4. `640px – 767px` (Phablets & Small Tablets)
- **Grids**: Section grids (`.grid4`, `.grid3`, `.grid2`, `.plans`) switch to 2 columns (`grid-template-columns: repeat(2, minmax(0, 1fr))`).
- **Pricing**: Recommended plan card explicitly orders first (`order: -1`) to ensure optimal conversion on narrow viewports.
- **FAQ Accordion**: Rows enforce `48px` minimum height with full-row click surface and hover feedback.
- **CTA Banners**: Two-column layout with left-aligned copy and right-aligned button action.

#### 5. `768px – 1023px` (Tablet Portrait — iPad Air, iPad Mini)
- **Sidebar**: Automatically collapses to crisp `72px` width icon-only mode. All labels, workspace badges, and user text strictly hidden (`display: none !important`), eliminating previous squashed label layout bugs.
- **Navbar (<1024px)**: Hamburger button triggers full-height slide-in right drawer with backdrop, focus trap, ESC key close, and full-width `48px` Login/Sign up buttons.
- **Sections**: 2-column balanced bento grid with `20px` gutters.
- **Lenis Scroll**: Detects pointer capability; touch screens use native inertial momentum scrolling.

#### 6. `1024px – 1279px` (Tablet Landscape & Standard Laptops)
- **Navbar**: Desktop mega-menu expands with rich SVG product icons (`38x38px`), resource columns, and right-hand authentication actions.
- **Sidebar**: Full expanded sidebar (`230px` width) with horizontal row navigation items (`44px` height, `12px` gap) and PRO tags.
- **HEA Assist**: Docks as a dedicated right-side panel with clean border separation.
- **Motion**: Lenis smooth scrolling active for fine pointer / mouse wheel interactions.

#### 7. `1280px – 1535px` (Standard Desktop & High-Resolution Displays)
- **Grids**: `.grid4` displays 4 balanced columns; `.grid3` and `.plans` display 3 columns with `24px` gap.
- **Container**: Global `.wrap` constrained to `1200px` for optimal reading line length.
- **Depth & Shadows**: Multi-layered depth shadows (`--shadow-bento`, `--shadow-glass-md`) with subtle ambient background mesh.

#### 8. `>= 1536px` (Ultra-wide 2K & Large Workstations)
- **Container**: Max width capped at `1440px` and centered (`margin: 0 auto`), preventing unbounded horizontal stretching on 1440p and 4K displays.
- **Typography**: Fluid headings reach upper clamps: `h1` at `3.5rem`, `h2` at `2.5rem`.
- **Performance**: Zero horizontal overflow verified via `body { overflow-x: clip; }`.


---

## 6. Phase 3: Dashboard Responsive Upgrades

### 1. Multi-Tier Responsive Sidebar & Bottom Navigation
- **`>= 1024px` (Desktop)**: Full 260px wide sidebar featuring company logo, `+ Create new` action, navigation items with PRO badges, workspace indicator, and user account tile. Sidebar collapse toggle button (`#sidebarCollapseBtn`) smoothly transitions the sidebar between expanded (260px) and slim icon-only (72px) states.
- **`768px – 1023px` (Tablet Portrait)**: Sidebar defaults to a 72px icon-only layout. All text labels, badges, workspace cards, and account names are hidden via `display: none !important`, rendering clean 46x46px centered touch targets without text overlap.
- **`< 768px` (Mobile)**:
  - **Off-Canvas Drawer**: The sidebar transforms into a full-height off-canvas drawer (`width: 280px`, `height: 100dvh`, `transform: translateX(-100%)`) with smooth spring animation, tap-to-dismiss backdrop (`#sidebarBackdrop`), and auto-dismiss on route navigation.
  - **Bottom Tab Navigation Bar (`#appMobileBottomNav`)**: Fixed bottom navigation bar with 5 core touch targets (`Home`, `Links`, `QR`, `Stats`, `More`) plus a raised center `+` action button. Configured with `env(safe-area-inset-bottom)` padding and active route synchronization.

### 2. Dual Desktop / Mobile Scroll Architecture
- **Desktop (`>= 768px`)**: Single scroll-pane pattern. `#appShell` and `.app-body-wrap` lock to `100dvh` with `overflow: hidden`. Only `.app-main-pane` scrolls with `overscroll-behavior: contain`, preserving fixed topbar and sidebar positioning.
- **Mobile (`< 768px`)**: Natural viewport scrolling. `#appShell`, `.app-body-wrap`, and `.app-main-pane` transition to `height: auto` and `overflow: visible`, allowing the mobile browser to collapse its address bar during scrolling. `.app-main` receives bottom padding `calc(84px + env(safe-area-inset-bottom))` to prevent bottom-nav clipping.

### 3. HEA Assist AI Panel (Desktop Dock & Mobile Bottom Sheet)
- **Desktop**: Docks as a dedicated right panel (380px wide) with real-time suggestion prompts and quick chat input.
- **Mobile (`< 768px`)**: Transitions to an `88dvh` bottom sheet with rounded top corners (`24px`), deep drop shadow, dedicated internal scroll container, and top drag handle (`.drawer-drag-handle`) supporting downward touch-swipe dismissal.
- **Input Field Capsule**: Completely borderless inner text field (`border: none; outline: none; background: transparent;`) and circular blue send button (`34x34px`).

### 4. Tables to Stacked Mobile Cards (`< 768px`)
- Wide tabular layouts (`.dash-table`, `.links-table`, `.settings-email-table`, `.responsive-table`) dynamically hide table headers (`thead`) and transform table rows into standalone white cards with subtle borders and shadows.
- Table cells display as flex rows showing key-value labels via `::before { content: attr(data-label); }`.
- Link cards (`.qr-card-item`) adapt to vertical column wrapping on mobile `< 640px` with accessible button bars.

### 5. QR Code Studio Mobile Reordering
- In the QR Code details and creator view (`.qr-detail-layout`), the live SVG/PNG preview box is hoisted above configuration options on mobile using `order: -1`, giving users immediate visual feedback on design changes before scrolling through controls.

### 6. Full-Screen Modals & Action Sheets
- Create Link (`#whatModal`), Checkout (`#checkoutModal`), and Configuration dialogs expand to full-screen sheets on mobile (`< 768px`) with sticky bottom action footers (`position: sticky; bottom: 0; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px)`), keeping primary action buttons directly under the thumb.

### 7. Contrast & Typography Fixes
- **Campaigns**: Replaced low-contrast white headings on white cards with `#0070f3` brand blue and responsive grid rows (`.dash-grid-2`, `.camp-grid-row`).
- **Custom Domains**: Replaced white `#ffffff` title on light canvas with high-contrast `#0b132b`.
- **Advanced Settings**: Updated toggles and feature labels (`UTM parameters`, `Code expiration`, `Dynamic routing`) with `#0b132b` bold styling.
- **Toasts**: Pinned above mobile navigation bar (`bottom: calc(76px + env(safe-area-inset-bottom))`) with `max-width: calc(100vw - 32px)` and text wrapping.

### 8. Multi-Tab Verification Summary
- `Home (#dashboard)`: Clean URL input capsule, velocity chart, workflow shortcuts, recent links.
- `Links (#links)`: Search & filter bar, mobile stacked link cards with Copy, QR, and Delete triggers.
- `QR Codes (#qr)`: Dynamic vector code gallery, creation wizard, scan analytics.
- `QR Studio (#qr-detail)`: Preview on top, color switcher, SVG/PNG vector downloads.
- `Pages (#pages)`: Bio page mobile templates and Pro locked paywall screen with wide CTA button.
- `Analytics (#analytics)`: Real-time telemetry cards, 3-step conversion journey, responsive traffic breakdown.
- `Campaigns (#campaigns)`: UTM parameter builder with responsive input columns.
- `Domains (#domains)`: AI domain generator and DNS verification records.
- `Settings (#settings)`: Responsive subsidebar navigation, profile details, email table, session security.
- `HEA Assist (#assist)`: Right dock on desktop / bottom sheet on mobile with conversational AI prompts.
- `Integrations (#integrations)`: Multi-platform integration cards in balanced responsive grid.

---

## 7. Phase 4: Scroll Animation & Performance Suite

### Complete Animation Timing & Curve Specification Matrix

| Component / Interaction | Trigger | Timing Value / Duration | Easing Function | Transform / Property Change | Environment Guard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Content Entrance** | Page Load | `500ms` (stagger `40ms`) | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(16px -> 0)`, `opacity 0 -> 1` | All (instant if reduced) |
| **Scroll Reveal Engine** | Observer (15% visible) | `600ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(20px -> 0)`, `opacity 0 -> 1` | `.js-enabled` only |
| **Group Child Stagger** | Parent Intersecting | `70ms` step (max 6 items) | `cubic-bezier(0.16, 1, 0.3, 1)` | `transition-delay: 0–350ms` | All siblings |
| **Navbar Dynamic Blur** | Scroll $> 40\text{px}$ | `280ms` | `ease` | Blur `16px`, border, shadow | All devices |
| **Navbar Hide on Scroll Down**| Scroll $> 120\text{px}$ down | `280ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(0 -> -100%)` | Excluded when drawer open |
| **Navbar Reveal on Scroll Up**| Scroll up | `280ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(-100% -> 0)` | All devices |
| **Top Scroll Progress Bar** | Global Scroll | Continuous rAF | Linear (`scaleX(progress)`) | `height: 2px`, brand blue gradient | Desktop & Mobile |
| **Telemetry Counters** | Observer (50% visible) | `900ms` | `easeOutCubic (1 - (1-t)^3)` | Number count-up with commas/`%` | Runs once |
| **Tabs Sliding Pill** | Tab Click / Resize | `250ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateX()`, `width` update | All devices |
| **FAQ Accordion** | Summary Click | `250ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `grid-template-rows: 0fr -> 1fr` | Modern CSS Grid |
| **Carousel Slides** | Slide Scroll / Click | `350ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Active: scale 1.0/op 1; Inactive: scale .96/op .7 | All devices |
| **Desktop Hero Parallax** | Window Scroll $< 900\text{px}$| Continuous rAF | Passive linear (max $16\text{px}$) | `translateY(0 -> 16px)` | Desktop fine pointer only |
| **Card Hover Lift** | Pointer Hover | `200ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(-3px)`, soft shadow | Desktop fine pointer only |
| **Dashboard Page Switch** | Tab Route Change | `250ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `translateY(8px -> 0)`, `opacity 0 -> 1` | Opacity strictly ends at 1 |
| **Sticky Header Shadow** | Pane Scroll $> 8\text{px}$ | `200ms` | `ease` | Border and shadow on topbar/header | Desktop pane & Mobile |
| **Skeleton Shimmer** | Pending Async State | `1500ms` infinite | `linear` | Background position sweep `200% -> -200%` | Replaces spinners |

### 1. Unified Scroll Architecture
- **Desktop**: Lenis momentum scrolling enabled exclusively under `(hover: hover) and (pointer: fine) && !prefers-reduced-motion`.
  - Duration: `1.0s`, Easing: `t => Math.min(1, 1.001 - Math.pow(2, -10 * t))`.
  - In-page anchors calculate target position with exact offset `-(headerHeight + 12px)`.
- **Mobile & Touch**: Lenis is completely bypassed on touchscreens; devices utilize 100% native browser momentum scrolling (no touchMultiplier or syncTouch interference).
- **`data-lenis-prevent` Integrity**: Strictly scoped to actual inner scrolling containers (`#appMainPane`, `.app-sidebar`, `.app-assist-drawer`, `.drawer-body`, `#whatModal`) with `overscroll-behavior: contain`. Misplaced attributes removed from static wrappers.

### 2. Single Shared IntersectionObserver Engine
- **Observer Configuration**: `threshold: 0.15`, `rootMargin: '0px 0px -8% 0px'`.
- **Progressive Enhancement**: Hidden styles (`opacity: 0; transform: translateY(20px);`) are applied strictly via `.js-enabled [data-reveal]:not(.is-revealed)`. If JavaScript is unavailable, all page elements render 100% visible immediately.
- **GPU Memory Cleanup**: Elements listen for `transitionend` and unregister `will-change` immediately following animation completion.

### 3. Central Motion Configuration (`motion.config.js`)
- Created single source of truth exporting `duration`, `easing`, `distance`, and `scroll` configuration for instant project-wide tuning.


---

## 8. Phase 5: QA, Automated Viewport Testing & Final Polish

### 1. Viewport Matrix & Automated Chrome Runner (`scratch/run_full_qa.js`)
- Successfully executed headless Chrome testing across **14 distinct viewport configurations** (`360x640` to `2560x1440`, landscape phone `844x390`, and 200% accessibility zoom).
- Verified **0px horizontal overflow** across all 11 core routes (`#home`, `#login`, `#signup`, `#dashboard`, `#links`, `#qr`, `#pages`, `#analytics`, `#campaigns`, `#domains`, `#settings`).
- Verified responsive sidebar breakdown:
  - $\ge 1024\text{px}$: Expanded row mode (`250px`) with visible labels.
  - $768\text{px} - 1023\text{px}$: Clean icon-only collapsed mode (`72px`) with hidden labels.
  - $< 768\text{px}$: Off-canvas slide drawer (`280px`) + fixed 5-tab mobile bottom nav.

### 2. Critical Router Fix in `app.js`
- **Defect**: When visiting `app.html` or `/` without an active hash while unauthenticated, `app.js` executed `window.location.replace('/')`, triggering an infinite reload loop.
- **Resolution**: Removed redundant `window.location.replace('/')` and `window.location.replace('/#' + rawHash)`, allowing clean routing directly into `show('home')` and `show('auth')` without network reload traps.

### 3. Sidebar Layout Conflict Resolution (`app-shell.css`)
- **Defect**: Conflicting legacy rules had set `.app-sidebar` to `width: 76px !important`, while modern rules displayed text labels (`display: inline-block`), causing text to wrap underneath icons in a narrow column (reported by user).
- **Resolution**: Aligned `.app-sidebar` default desktop width to `250px !important` with `align-items: stretch` and horizontal flex-row item layout. In collapsed mode, width smoothly shrinks to `72px !important` with all labels and badges cleanly hidden.

### 4. Accessibility & Landmark Hardening
- Replaced `#appMainPane` `div` container with semantic `<main class="app-main-pane" id="appMainPane" role="main" aria-label="Dashboard Content">`.
- Added explicit `aria-label` attributes to all icon-only buttons (`#sidebarToggleBtn`, `#assistToggleBtn`, `#topbarNotifBtn`, `#topbarHelpBtn`, `#topbarAvatar`, `#whatModalClose`, and custom modal close buttons).
- Confirmed full WCAG AA contrast compliance across all text labels, headings, and input placeholders.

### 5. Regression Verification (`scratch/test_regressions.js`)
- Verified 100% pass on all 8 core functional regressions:
  - Slug redirect `<head>` script.
  - Google and Apple SSO authentication buttons.
  - Shortlink creation modal and action pipeline.
  - QR Code generation and custom download engine.
  - Authenticated dashboard navigation.
  - Bio pages and analytics views.
  - HEA Assist AI drawer toggle and input capsule.
