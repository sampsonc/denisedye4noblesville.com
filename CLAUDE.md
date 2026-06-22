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
# Quick git deployment
./deployment/push.sh

# Full production deployment with optimization
./deployment/copysite.sh --deploy
```

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
- `deployment/` - Deployment automation scripts

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
- Separate volunteer.html and contact.html forms
- Form styling uses consistent campaign theme colors

### Color Scheme
Current theme uses black and gray-yellow (#d4af37):
- Primary: #d4af37 (gray-yellow for brand, buttons, headings)
- Primary Light: #e6c866 (hover states)
- Secondary: #1a1a1a (black for text, secondary buttons)
- Background: Clean whites and light grays

## Campaign-Specific Notes

### Content Areas
1. Hero section with candidate cards
2. Detailed candidate profiles with photos and qualifications
3. Three-pillar platform (Prioritizing Education, Protecting Kids, Partnering with Parents)
4. Endorsements section
5. Get involved section with volunteer/contact CTAs
6. Voting information with Hamilton County polling location links

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

The site is designed for static hosting and requires no server-side processing. Deployment scripts handle git commits and can be extended for rsync to production servers. The site is optimized for fast loading and mobile performance.