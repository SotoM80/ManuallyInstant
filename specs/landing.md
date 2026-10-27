# Technical Specification: Landing Page (Home)

## 1. What it does
Turns the Home page (`/`) into the landing page of a graphic design studio, in a **mixed** style: an **expressive opening** (the studio name in giant poster type on strong color, then a moving band of words), followed by a **Swiss editorial page** with the clear structure of a product page (a strict 12-column grid, thin rules, plenty of white space, black and white with one accent color, numbered sections, cards and steps) and subtle motion. The studio introduces itself (About), lists what it does (Services), shows its projects (Work) and invites people to write (Contact). ManuallyInstant appears as one of the studio's services and tools, with links to the Brand Manual page.

All the text, numbers, projects, links and the email live in one data file, `src/data/landing.ts`, filled with **placeholders** until the real content is ready. Changing the content never needs a change in the components.

## Out of Scope
A backend or a third-party form service: the contact form only opens the user's email app (ADR 0002). A page per project (case studies). A blog. A second language. A custom cursor, scroll-jacking or smooth-scroll libraries (ADR 0017). An editor for the landing content inside the app.

## 2. Interface

### Sections, in order
Every section with an `id` can be reached with `/#<id>`. About, Services, Work, Tool and Contact are regions named "About", "Services", "Work", "ManuallyInstant" and "Contact"; each also shows a small label in brackets, e.g. "(About us)".

| # | Section | `id` | Content |
|---|---|---|---|
| 1 | **Hero** | `top` | On lime, the full width of the screen: the studio name, as the page's only `h1`, in giant poster type; a claim of one sentence; two links: **See our work** (→ `#work`) and **Start your brand manual** (→ `/brand-manual`) |
| 2 | **Marquee** | — | A black band with the studio's disciplines (Branding · Identity · Packaging · Type · …) in poster type, sliding sideways in a loop. Decoration only: hidden from screen readers |
| 3 | **About** | `about` | The section number and label on the left, a manifesto (2–3 sentences) on the right; 3 numbers (e.g. years, projects, clients) with their labels, separated by rules; the team (initials or photo, name and role) |
| 4 | **Services** | `services` | Numbered cards in a grid ("01 Brand identity", "02 Visual identity manuals"…), each with one short line. Hovering a card lifts it and turns its rule to the accent color. **Visual identity manuals** links to `/brand-manual` |
| 5 | **Work** | `work` | 6 projects in a regular grid (3 columns on wide screens), all images at the same proportion: image, client, title, category and year. Hovering a project grows its image a little |
| 6 | **Tool** | `tool` | "Built in-house: ManuallyInstant": one sentence about the app next to three manual pages drawn in CSS (decoration only), how it works in 3 numbered steps (fill in your brand, choose a template and a skin, export the PDFs), and the link **Try ManuallyInstant** (→ `/brand-manual`) |
| 7 | **Contact** | `contact` | Two columns: "Let's talk" in large type, the studio email and the social networks on the left; the contact form on the right; the studio email as a `mailto:` link; links to the studio's social networks (each opens in a new tab) |
| 8 | **Footer** | — | © year and studio name, links to the sections and **Back to top** (→ `#top`) |

### Contact form
* Fields: **Name**, **Email** and **Message**, all required.
* **Send**: if every field is valid, the browser opens the user's email app with a new message to the studio email:
  * Subject: `New project — <Name>`
  * Body: the message, then a blank line, then `<Name> · <Email>`.
  * Accents, line breaks and symbols such as `&` arrive unchanged.
* After opening it, the form shows "Your email app should open now. If it doesn't, write to <email>."
* Nothing is sent by the app itself; nothing is saved.

### Menu
* The menu gets four section links after Home: **About**, **Services**, **Work**, **Contact** (`/#about`, `/#services`, `/#work`, `/#contact`), then **Brand Manual**. See `navmenu.md`.
* Choosing a section from any page opens Home and scrolls to that section.

### Look
* Two fonts from Google Fonts, each loaded once (ADR 0005): a poster font for the opening (Anton) and a grotesque for the other headings (Inter Tight, bold). Body text keeps the app's font.
* The opening has its own colors (lime, ink) in light and dark mode. From About on, the page uses the app's own background, text and border colors (so it follows light and dark mode), plus **one** accent color (also the stars of the band), defined once as a token.
* Each section starts with its number and label ("01 — About us") over a thin rule.
* Responsive: on mobile the headings shrink with the width of the screen, the Hero, About and Contact become one column, the Work and Services grids become one column and the menu folds into a menu button (see `navmenu.md`).

### Motion
See `motion.md` (Landing) and ADR 0017.

## 3. Preconditions & Postconditions
* **Preconditions**: The app is open in the browser.
* **Postconditions**: Moving from Home to the Brand Manual page and back keeps everything the user filled in the manual (see `navmenu.md`, Scenario 4).

## 4. Invariants
* Every text, number, image, link and email on the landing comes from `src/data/landing.ts`.
* The page has exactly one `h1` (the studio name), and each section has its own heading.
* The page never has a horizontal scroll, whatever the screen size.
* With reduced motion, every piece of content is visible and nothing moves (the band of words stands still).
* All content is visible even when the browser cannot run scroll animations.

## Failure Modes
* **Invalid form**: an empty field or an email without the form `x@y.z` does not open the email app; the field is marked invalid and shows "Please fill in this field" or "Please enter a valid email".
* **No email app configured**: the browser may do nothing; the confirmation line still shows the studio email, so the user can write by hand.
* **Unknown section in the URL** (e.g. `/#nope`): Home is shown from the top.
* **Display font not loaded** (offline): the big type falls back to the app's font.

## 5. Given-When-Then Test Criteria

### Scenario 1: Every Section
* **Given**: The user opens `/`.
* **When**: The page loads.
* **Then**: The studio name is the only `h1`, and the regions About, Services, Work, ManuallyInstant and Contact are shown, in that order.

### Scenario 2: Menu to a Section
* **Given**: The user is on the Brand Manual page.
* **When**: The user clicks **Work** in the menu.
* **Then**: Home is shown and the Work section is scrolled into view.

### Scenario 3: Projects From the Data File
* **Given**: `landing.ts` has 6 projects.
* **When**: The user looks at Work.
* **Then**: 6 projects are shown, each with its client, category and year.

### Scenario 4: Start From the Landing
* **Given**: The user is on Home.
* **When**: The user clicks **Start your brand manual** in the Hero.
* **Then**: The Brand Manual page is shown.

### Scenario 5: Contact With Valid Data
* **Given**: The user typed Name "Ana", Email "ana@studio.com" and Message "Hola & gracias".
* **When**: The user clicks Send.
* **Then**: The browser goes to a `mailto:` link to the studio email with the subject "New project — Ana" and the message unchanged, and the confirmation line is shown.

### Scenario 6: Contact With an Invalid Email
* **Given**: The user typed Email "ana@".
* **When**: The user clicks Send.
* **Then**: The email app does not open, and the Email field is marked invalid with "Please enter a valid email".

### Scenario 7: Reduced Motion
* **Given**: The system asks for reduced motion.
* **When**: The user scrolls the landing.
* **Then**: All content is visible at once, without rising into view, and the band of words does not move.
