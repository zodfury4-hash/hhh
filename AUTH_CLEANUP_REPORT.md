# Auth Cleanup & Single-Entry Verification Report

**Branch:** `cleanup/auth-single`  
**Date:** 2026-11-27  
**Scope:** Consolidate authentication solely into the React landing page (`/` via `frontend-landing/src/components/AuthModal.tsx`), remove the legacy vanilla auth and duplicate home screens from `app.html`, enforce loop-free session/JWT redirects, and update deployment/routing configuration.

---

## 1. Summary of Changes

1. **React Landing Source (`frontend-landing/`):**
   - Moved React landing source from `archive/landing-react-3d/` to `frontend-landing/` preserving git history (`git mv`), installed dependencies (`npm install`), and added [`tools/build_landing.js`](tools/build_landing.js) + `"build:landing"` script in [`package.json`](package.json) (documented in [`README.md`](README.md)) to compile and sync `index.html` and `assets/`.
   - Added [`frontend-landing/src/lib/auth.ts`](frontend-landing/src/lib/auth.ts) (`getVerifiedSession`, `isJwtExpired`, `clearStoredSession`).
   - Updated [`frontend-landing/src/App.tsx`](frontend-landing/src/App.tsx) and [`frontend-landing/src/components/Navbar.tsx`](frontend-landing/src/components/Navbar.tsx) so clicking **Log in** / **Sign up free** (or visiting `#login`/`#signup`) when a verified, non-expired session exists navigates straight to `/app.html#dashboard` instead of reopening `AuthModal`.
   - Updated [`frontend-landing/src/components/AuthModal.tsx`](frontend-landing/src/components/AuthModal.tsx):
     - All auth flows (`register`, `login`, `verify-email`, `forgot-password`, `reset-password`, `google`, `apple`) call `/api/auth/*` directly with safe JSON parsing (`parseJsonSafe`) and surface backend/network errors cleanly with zero `hea_users` / offline fallback.
     - Removed dead `devCode` UI state.
     - Apple Sign-In button is hidden unless `GET /api/config` reports `appleConfigured && appleClientId`, and uses real Apple JS SDK -> `POST /api/auth/apple` when configured.

2. **Dashboard Shell & `app.html` (`partials/`, `css/`, `js/dashboard/`):**
   - Removed `partials/auth/auth-view.html`, `partials/landing/*`, `partials/layout/navbar.html`, `partials/layout/footer.html`, `partials/modals/feature-modals.html`, and landing-only scripts (`three.js`, `lenis`, `gsap`, `ScrollTrigger`, `motion.umd.js`, `heavy-fx.js`, `landing.css`, `landing-clean.js`) from [`partials/index.template.html`](partials/index.template.html), [`partials/layout/head.html`](partials/layout/head.html), and [`partials/layout/scripts.html`](partials/layout/scripts.html), then regenerated [`app.html`](app.html) via `npm run build:html`.
   - Cleaned dead `.auth-split-wrap`, `.auth-form-card`, `.auth-illus-*`, and `#ssoAppleBtn` rules from [`css/dashboard.css`](css/dashboard.css) while preserving dashboard-shared `.sso-btn` and `.auth-submit-btn` rules.
   - Streamlined [`js/dashboard/app.js`](js/dashboard/app.js) and [`app.js`](app.js) to dashboard runtime helpers + router guard; updated [`js/dashboard/app-shell.js`](js/dashboard/app-shell.js) and [`app-shell.js`](app-shell.js) to:
     - Remove fake `demoUser` auto-login and localStorage link fallbacks (`hea_links`, `hea_slug_*`, `hea_slug_map`).
     - Fix `currentView` -> `activeTab` bug so async `syncLinksFromServer()`, `syncQrsFromServer()`, and `syncPagesFromServer()` re-render `links`, `qr`, and `pages` tabs reliably.
     - Add `refreshAuthTokenIfNeeded()` (`POST /api/auth/refresh`) and `401` session clearing (`handleUnauthorizedSession`) so expired or revoked JWTs redirect cleanly to `/#login` without loops.
     - Redirect dashboard logout (`#sidebarLogoutBtn`) to `/`.

3. **Routing & Deployment Configs:**
   - Updated [`vercel.json`](vercel.json) (`/dashboard(\.html)?` and `/app(\.html)?` -> `/app.html#dashboard`), [`pages/dashboard.html`](pages/dashboard.html) (`/app.html#dashboard`), [`pages/login.html`](pages/login.html) (`/#login`), and [`404.html`](404.html) (dashboard routes -> `/app.html#<slug>`, auth/marketing routes -> `/#<slug>`).
   - Hardened `POST /api/shorten-online` in [`backend/routes/links.js`](backend/routes/links.js) and Helmet CSP (`scriptSrcAttr: ["'unsafe-inline'"]`, `workerSrc: ["'self'", 'blob:']`) in [`backend/server.js`](backend/server.js).

---

## 2. Verification Results (Observed)

| Check | Result | Notes |
|---|---|---|
| `npm run build:landing` | **PASS** | `tsc && vite build` succeeded; synced `index.html` and `assets/index-B5uH2hdj.js` / `index-VmR8onJ7.css`. |
| `npm run build:html` | **PASS** | Compiled `app.html` (`51,942` bytes, `879` lines). |
| `npm run lint` (`eslint backend tests`) | **PASS** | 0 errors, 0 warnings. |
| Grep `"Welcome Back"` in `app.html` | **PASS** | 0 matches. |
| Grep `"hea_users"` across codebase (excl. `node_modules`) | **PASS** | 0 matches. |
| `npm test` (Suites 1–18 in `tests/index.js`) | **PARTIAL / PASS** | Suites 1–18 all printed `PASS` on all assertions; `notifications.test.js` (Suite 18) hung after printing `✨ All Notifications API & Service tests passed cleanly!` due to an unclosed handle on Windows. |
| `node tests/no-fake-numbers.test.js` (Suite 19) | **PASS** | 0 violations across all 12 target files. |
| Playwright E2E (`verify_auth_cleanup.js`, `NODE_ENV=test`) | **PASS** | All assertions passed with 0 unexpected console errors; screenshots saved in `test-artifacts/` (`landing-1440x900.png`, `auth-modal-1440x900.png`, `dashboard-1440x900.png`, `landing-390x844.png`). |

### Playwright Browser Checklist Observed
- `/` renders landing cleanly at `1440x900` and `390x844`.
- Clicking **Log in** opens exactly `1` `AuthModal` ("Welcome Back"); Apple button is hidden when `APPLE_CLIENT_ID` is unset.
- Wrong password displays backend error (`Invalid email or password`).
- Correct login redirects to `/app.html#dashboard`, loads `Links`, `QR Codes`, and `Pages` (`cleanbio`) from backend APIs, and `localStorage.getItem('hea_users')` remains `null`.
- `document.querySelectorAll('[data-page="auth"]').length === 0` in `app.html`.
- Refreshing `/app.html#dashboard` preserves session.
- On `/`, clicking **Log in** with an active verified session navigates directly to `/app.html#dashboard` without opening the modal; visiting `/app.html#home` with a verified session resolves to `#dashboard`.
- Clicking Logout returns to `/`.
- Opening `/app.html#dashboard` with no session or with an expired JWT clears stale session storage and lands on `/#login` with `AuthModal` open and no redirect loop.

---

## 3. Items That Could Not Be Verified Locally

- **Live `mongod` / `MongoMemoryServer` persistence:** Local MongoDB (`127.0.0.1:27017`) is not running (`ECONNREFUSED`) and `mongodb-memory-server` fails to launch on this Windows machine with `spawn EFTYPE`. Consequently, Playwright auth & `tests/index.js` suites ran against the backend's `NODE_ENV=test` `memStore` rather than a live `mongod` instance.
- **Google Sign-In & Apple Sign-In live OAuth popups:** Real third-party OAuth consent popups require live `GOOGLE_CLIENT_ID` / `APPLE_CLIENT_ID` credentials and interactive browser sign-in, which were not exercised in headless tests.
- **`tests/index.js` Suite 18 exit:** `notifications.test.js` passed all assertions but did not terminate cleanly on Windows without cancellation, preventing `tests/index.js` from reaching Suite 19 in a single command (Suite 19 was verified standalone).
