# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML/CSS/JavaScript campaign website for Denise Dye's 2026 Noblesville School Board election, served at denisedye4noblesville.com. The site is built as a single-page application with responsive design and focuses on the candidate profile, platform messaging, and voter engagement.

## Development Commands

### Local Development
```bash
# Open the site locally (no build process required)
open index.html

# Or serve with a simple HTTP server
python3 -m http.server 8000
```

### Deployment
```bash
# The only deploy path. Takes no arguments.
./copysite.sh
```

`copysite.sh` does four things in order: `git add .` + commit (message is always
"changes") + push to `origin main`, rsync to `chs@chs.us:/home/chs/denisedye4noblesville.com`,
then ping IndexNow. Because it stages everything, check `git status` before running it.

### Testing
- No automated tests - manual browser testing required
- Test responsive design at mobile (375px), tablet (768px), and desktop (1200px+) breakpoints
- Verify form validation works without backend

## Architecture

### File Structure
- `index.html` - Single-page site with all content
- `css/main.css` - Complete styling with CSS variables for theming
- `js/main.js` - Interactive functionality (navigation, forms, animations)
- `forms/` - Standalone contact and volunteer forms
- `images/candidates/` - Candidate headshot (denise.jpg)
- `copysite.sh` - The deploy script (commit, push, rsync, IndexNow ping)
- `deployment/nginx/` - Production nginx config, version-controlled here but not deployed by `copysite.sh`

### Styling System
- Uses CSS custom properties (variables) for consistent theming
- Key color variables: `--primary` (#d4af37 gray-yellow), `--secondary` (black), `--accent`
- Mobile-first responsive design with breakpoints at 768px and 480px
- All candidate photos use `object-fit: cover` and `object-position: center center` for consistent circular cropping

### JavaScript Features
- Mobile hamburger menu with smooth animations
- Smooth scrolling navigation with active section highlighting  
- Form validation with real-time feedback
- Intersection Observer for scroll animations
- Accessibility features (skip links, keyboard navigation)

## Key Components

### Candidate Photos
- Hero section: `.candidate-photo` (180px circles)
- Profile section: `.profile-photo` (300px height, responsive)
- Mobile: Responsive sizing with consistent centering
- All photos should be professionally shot and properly centered for circular cropping

### Forms
- Client-side validation only (no backend integration)
- Newsletter signup in main page
- Separate volunteer.html, contact.html, jointeamdenise.html, and yardsign.html forms
- Form styling uses consistent campaign theme colors
- `css/forms.css` holds the shared styling for the standalone form pages (form card, fields,
  checkbox/radio rows, validation errors, the fixed-header top offset). `jointeamdenise.html`
  and `yardsign.html` load it after `main.css`. Older `volunteer.html` and `contact.html` still
  carry their own inline copies.
- `forms/yardsign.html` is the yard sign request form. It posts to the **same Apps Script
  endpoint** as the volunteer signup and sends a hidden `form_type=yard_sign` field; the join
  form should send `form_type=join_team`. The Apps Script must branch on
  `e.parameter.form_type` and write to separate sheets, or yard sign requests land in the
  volunteer sheet with most columns empty. Confirmation page is `thank-you-yardsign.html`.
- Never put page JS in an inline `<script>` on any page: production CSP is
  `script-src 'self' static.getclicky.com` with no `'unsafe-inline'`, so nginx silently blocks
  it and the page loses all behaviour. Page scripts go in their own file under `js/`.
- `forms/jointeamdenise.html` is the current volunteer signup (the `#join` section links to
  it). Its `<form action="">` is deliberately **blank** — no endpoint is wired yet, so a
  valid submit shows a "sign-ups aren't open just yet" notice instead of sending. To
  activate: paste an endpoint URL (e.g. Formspree) into `action` and uncomment the three
  hidden fields directly below the opening tag. The notice removes itself automatically once
  `action` is non-empty; no other edit is needed.
- Its field names are the contract for downstream automation: checkboxes repeat their name
  (`help`, `availability`, `skills`), radios send one value (`frequency`, `sms_consent`).
- The SMS consent wording is generic TCPA language. Name the actual sending program and
  confirm the opt-out text once an SMS provider is chosen — see the TODO in section 5.
- `thank-you.html` (repo root, `noindex`) is the post-submit confirmation page, reached via
  the commented-out `_next` hidden field. It is unreachable until the endpoint is wired.
- `js/main.js` guards every nav/header lookup because the standalone `forms/` pages load it
  without a nav header; before those guards a null dereference aborted the whole
  DOMContentLoaded handler and silently disabled form validation on all form pages.

### Color Scheme
Current theme uses black and gray-yellow (#d4af37):
- Primary: #d4af37 (gray-yellow for brand, buttons, headings)
- Primary Light: #e6c866 (hover states)
- Secondary: #1a1a1a (black for text, secondary buttons)
- Background: Clean whites and light grays

## Campaign-Specific Notes

### Content Areas
Homepage sections, in document order (each is a top-level `<section>` with an `id` matching a nav link):
1. `#home` — Hero with headline and CTA buttons (platform, get involved, Venmo donation)
2. `#about` — Candidate profile with photo, qualifications, and link to denise.html
3. `#platform` — Three-pillar platform (Prioritizing Education, Partnering with Parents, Promoting Financial Responsibility)
4. `#events` — Upcoming campaign events card grid (currently placeholder entries marked with HTML comments — replace with real events)
5. `#endorsements` — Endorsement cards plus a CTA linking to the endorsement Google Form
6. `#join` — Dark "Join Team Denise" CTA band; pitch only, links to `forms/jointeamdenise.html`
7. `#contact` — Email, phone, and mailing address
8. `#vote` — Voting information with Hamilton County polling location links

There was previously a `#get-involved` section between endorsements and vote, holding three
`.involvement-card` blocks (Volunteer / Spread the Word / Stay Informed) that all linked to the
old volunteer Google Form. It was removed on 2026-08-12 once `forms/jointeamdenise.html`
superseded it; the contact block nested inside it was kept and promoted to the `#contact`
section above. Restore the cards from the `pre-remove-get-involved` git tag if needed — their
CSS (`.get-involved`, `.involvement-grid`, `.involvement-card`) is still in main.css, and
`#contact` still uses the `.get-involved` class for its section background.

Nav labels are near the width limit: at 1200px, eight items fit on one line only just. Adding
a ninth item, or lengthening a label, wraps two items onto a second line and grows the fixed
header from 138px to 170px — which in turn pushes content under the header on pages that set a
fixed top offset (see `forms/jointeamdenise.html`). Check the header height after any nav edit.

Adding a new section requires: the `<section id>` in index.html, a nav `<li>` in `ul#nav-menu` (index.html **and** the duplicate nav in denise.html), a footer Quick Links entry, and section CSS. Scroll-spy picks up new sections automatically. Scroll-in animation requires adding the card class to **both** hard-coded lists in `js/main.js` (the observer selector and the injected start-state CSS string) — adding to only the CSS list leaves elements permanently invisible.

### Photo Guidelines
- Candidate photos should be high-quality professional headshots
- Recommended size: 400x400px minimum
- Photos are automatically cropped to circles - ensure subjects are centered
- Current file: `denise.jpg`

### External Links
- Polling locations: Hamilton County Precinct Maps
- Absentee voting: Hamilton County Clerk's office
- All external links open in new tabs

## Deployment Notes

The site is designed for static hosting and requires no server-side processing. `copysite.sh`
handles the git commit and rsyncs to production, excluding `.git`, `.claude`, `*.md`, `*.bak`,
`deployment/`, `backups/`, and the script itself. The site is optimized for fast loading and
mobile performance.

Note that `*.md` is excluded from the rsync, so CLAUDE.md edits never reach the web server —
they only travel through git.