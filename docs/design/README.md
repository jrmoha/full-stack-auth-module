<!-- docs/design/README.md -->
# Design reference: Auth App v2

Visual source for the M2 frontend tasks. Imported 2026-11-04 from the Claude Design project
"Auth App prototype design" (`https://claude.ai/design/p/f25d6d2d-b7a5-490b-b948-be60ee6a1bbc`,
file `Auth App v2.dc.html`). A copy is kept in [`auth-app-v2.dc.html`](auth-app-v2.dc.html) because
the standalone design tool closes on 2026-12-14. The copy needs the tool's runtime to render.

**Precedence.** The design governs look and layout only. Routes, session handling, copy and validation come from
`docs/architecture.md` (§4, §5, §6, §8). Where the prototype differs, the architecture wins (see "Deviations").

## Theme (implemented in `apps/web/src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `brand` | `#1d5c4c` | Primary buttons, links, focus ring, brand mark |
| `brand-strong` | `#14453a` | Primary hover, link hover, satisfied rule text |
| `brand-deep` | `#173f35` | Hero panel, profile card header |
| `brand-tint` | `#eef4f1` | Ghost button hover (password toggle) |
| `accent` | `#f2c46d` | Brand-mark letter, hero tag, avatar |
| `ink` | `#14211d` | Body text |
| `ink-muted` | `#5b6460` | Subtitles, secondary text |
| `ink-subtle` | `#8a918d` | Placeholders, detail labels |
| `on-deep` / `on-deep-muted` | `#f7f1e3` / `#c9d8d1` | Text on `brand-deep` |
| `canvas` | `#f7f5f0` | App background |
| `surface` | `#ffffff` | Cards, auth screen, header |
| `line` / `line-soft` / `line-faint` | `#e3e0d8` / `#ece9e1` / `#f1eee6` | Input borders / dividers / tab track and row dividers |
| `rule-off` | `#d6d2c7` | Unsatisfied password-rule ring |
| `danger` | `#b0322a` | Error text, form alert text |
| `danger-line` | `#d0574c` | Invalid input border |
| `danger-tint` / `danger-field` | `#fbeeec` / `#fdf6f5` | Form alert background / invalid input background |
| `success` | `#7fd1a8` | "Signed in" dot |

- Font: Plus Jakarta Sans 400 to 800 via `next/font/google` (self-hosted at build, no runtime request to Google).
- Radii: inputs 12 px, alert 10 px, cards 20 px, hero panel 24 px, buttons and tabs fully rounded. Brand mark: rounded on
  three corners, 4 px on the bottom-left (`brand-mark` utility).
- Focus: inputs get a `brand` border plus a 3 px `brand` ring at 14% opacity.

## Screens and where they land

| Design element | Roadmap task | Notes |
|---|---|---|
| Split auth layout: form column plus `brand-deep` hero panel with app mock | 2.4 (introduced), 2.5 (reused) | Hero and mock are decorative (`aria-hidden`); the panel wraps under the form below about 940 px |
| Sign in / Sign up segmented control and the footer switch link | 2.4, 2.5 | Links between `/signin` and `/signup`, not client state (§5) |
| Field: label, input, inline error | 2.4 `form-field.tsx` | Error linked with `aria-describedby`, announced (§8) |
| Password show/hide toggle | 2.4 | Button with an accessible label |
| Live password checklist (4 rules) | 2.4 | Matches §8 "password rules shown as a hint"; rule labels are hints, errors use §4 messages |
| Form alert (`danger-tint`) | 2.4 `form-alert.tsx` | Live region for 401, 429 and 5xx displays (§8) |
| Submit button with spinner and pending label | 2.4, 2.5 | Disabled while pending (§8) |
| `/app` header with brand and logout button | 2.3 | Logout is the client leaf `logout-button.tsx` |
| Greeting, "Welcome to the application." heading, profile card | 2.3 | Card shows `name`, `email`, `id`, `createdAt` from `GET /auth/me` |

**Visual preview (task 2.0b), now connected.** The screens were first built from these components without the API, behind a
"Design preview" banner. Tasks 2.2 to 2.5 connected them (session checks, React Hook Form with the 2.1 schemas, API calls)
and removed the banner and the sample data.

## Deviations from the prototype (architecture wins)

- **Routing:** the prototype switches between auth and app in client state with a fake 900 ms login. The app uses the
  `/signin`, `/signup` and `/app` routes with server-side session checks (§5, §6).
- **Copy:** the 401 message is "Invalid email or password" (§4, §8), not "Incorrect email or password.". A failing password shows
  the first failing §4 message, not "Password doesn't meet all requirements". Email uses the §4 custom rule and every length limit
  (254, 50, 128) applies; the prototype's simpler regex and missing limits are not used.
- **Profile details:** "Signed in at" (render time) and "Session: Active" are not backed by the API and are dropped; the card shows
  the four `user` fields.
- **Deferred** (listed in `docs/future-improvements.md`): the Arabic/RTL language toggle and the post-sign-in toast.
- **Not used:** `image-slot.js` (loaded by the prototype, no slot on the page) and the Google Fonts `<link>` (replaced by `next/font`).
