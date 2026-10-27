# Technical Specification: Navigation Menu

## 1. What it does
Adds a menu to the header so the user can move between the **Home** page and the **Brand Manual** page (the project they are working on).

## Out of Scope
Login. (Note: deferred for future iterations.)
Highlighting the section link of the part of Home being read (scroll spy).
A dedicated tablet layout for the forms and the manual pages.

## 2. Interface
### UI Elements
* **Header layout** (one row): **Logo** on the left · **Main Menu** on the right. The brand title is not shown in the header (it is shown on the Cover of the manual preview, see `brandmanual.md`).
* **Logo**: The ManuallyInstant logo (image with alt text "ManuallyInstant"). It is a link to Home (`/`). Until the final logo is designed, a placeholder image is used (`src/assets/logo.svg`); replacing that file changes the logo everywhere.
* **Main Menu**: A navigation landmark labeled "Main", on the right side of the header.
  * **Home** link → URL `/`
  * **About**, **Services**, **Work**, **Contact** (section links) → `/#about`, `/#services`, `/#work`, `/#contact`: they open Home and scroll to that section (see `landing.md`).
  * **Brand Manual** link → URL `/brand-manual`
  * The link of the current page is highlighted and marked as the current page (`aria-current="page"`). Section links are never marked: they point to a part of Home, not to a page.
* **Home Page**: the studio landing page described in `landing.md`.
* **Brand Manual Page**: The brand title form described in `titlefild.md`.

### Adding Sections
The menu is built from a single list (`src/data/navItems.ts`), shown in the same order as the list. Each item is a **page** or a **section** of Home.
* Adding a **page** (e.g. Pricing):
  1. Add `{ label: 'Pricing', path: '/pricing', kind: 'page' }` to the list.
  2. Create its page in `src/pages/` and its styles in `src/css/`.
  3. Add its route in `src/App.tsx`.
* Adding a **section** of Home: add `{ label, path: '/#<id>', kind: 'section' }` and give the section that `id` on the landing.

The menu component itself does not change.

### Responsive Design
The page will be responsive: it will adapt to mobile, tablet and desktop screens.

* **Wide screens** (more than 768 px): the logo (left) and the menu (right) stay on one row.
* **Narrow screens** (768 px or less): the menu folds into a **Menu** button (three lines) on the right of the header.
  * The button is labelled "Menu" and says whether the list is open (`aria-expanded`).
  * Clicking it opens the list below the header; clicking it again, pressing Esc or choosing a link closes it.
  * While closed, the list cannot be reached with the keyboard or by screen readers.
* Whatever the screen size, the menu keeps the same sections from the list, the same order and the same behavior (links, current page highlight).

## 3. Preconditions & Postconditions
* **Preconditions**: The app is open in the browser.
* **Postconditions**: Clicking a menu link changes the URL and shows that page without reloading the browser.

## 4. Invariants
* The header (logo + menu) is visible on every page.
* The menu shows exactly the sections in the list, in the same order.
* The brand title shown on the Cover and its style are kept when the user moves between pages. They are only reset when the browser page is refreshed (see `titlefild.md`, Out of Scope).

## Failure Modes
* **Unknown URL**: If the user opens a URL that does not exist (e.g. `/does-not-exist`), the app redirects to Home.

## 5. Given-When-Then Test Criteria

### Scenario 1: Opening the App
* **Given**: The user opens the app at `/`.
* **When**: The page loads.
* **Then**: The Home welcome section is shown, and the Home link is marked as the current page.

### Scenario 2: Going to the Brand Manual
* **Given**: The user is on Home.
* **When**: The user clicks "Brand Manual" in the menu.
* **Then**: The brand title form is shown, and the Brand Manual link is marked as the current page.

### Scenario 3: Starting from Home
* **Given**: The user is on Home.
* **When**: The user clicks "Start your brand manual".
* **Then**: The Brand Manual page is shown.

### Scenario 4: Title Is Kept Between Pages
* **Given**: The user typed the title "My Brand" on the Brand Manual page.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: Back on Brand Manual, the Cover of the manual preview still shows "My Brand".

### Scenario 5: Unknown URL
* **Given**: The user opens `/does-not-exist`.
* **When**: The page loads.
* **Then**: The Home page is shown.

### Scenario 6: Logo Goes Home
* **Given**: The user is on the Brand Manual page.
* **When**: The user clicks the logo in the header.
* **Then**: The Home page is shown.

### Scenario 7: Section Link
* **Given**: The user is on the Brand Manual page.
* **When**: The user clicks "Contact" in the menu.
* **Then**: Home is shown, scrolled to the Contact section, and only the Home link is marked as the current page.

### Scenario 8: Menu Button on a Narrow Screen
* **Given**: The screen is 375 px wide and the menu list is closed.
* **When**: The user clicks "Menu", then "Work".
* **Then**: The list opens (`aria-expanded="true"`), then Home scrolls to Work and the list closes again.
