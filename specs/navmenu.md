# Technical Specification: Navigation Menu

## 1. What it does
Adds a menu to the header so the user can move between the **Home** page and the **Brand Manual** page (the project they are working on).

## Out of Scope
Login. (Note: deferred for future iterations.)
More sections such as **Contact** or **About Us** are not built yet, but the menu is designed to grow (see "Adding Sections" below).
Dedicated mobile and tablet versions are not built yet, but the page is planned to be fully responsive (see "Responsive Design" below).

## 2. Interface
### UI Elements
* **Header layout** (one row): **Logo** on the left · **Main Menu** on the right. The brand title is not shown in the header (it is shown on the Cover of the manual preview, see `brandmanual.md`).
* **Logo**: The ManuallyInstant logo (image with alt text "ManuallyInstant"). It is a link to Home (`/`). Until the final logo is designed, a placeholder image is used (`src/assets/logo.svg`); replacing that file changes the logo everywhere.
* **Main Menu**: A navigation landmark labeled "Main", on the right side of the header.
  * **Home** link → URL `/`
  * **Brand Manual** link → URL `/brand-manual`
  * The link of the current page is highlighted and marked as the current page (`aria-current="page"`).
* **Home Page**: A welcome section with the title "ManuallyInstant", one sentence describing the app, and a link "Start your brand manual" that opens the Brand Manual page.
* **Brand Manual Page**: The brand title form described in `titlefild.md`.

### Adding Sections
The menu is built from a single list of sections (`src/data/navItems.ts`), shown in the same order as the list. Adding a section such as Contact or About Us means:
1. Add `{ label, path }` to the list (e.g. `{ label: 'Contact', path: '/contact' }`).
2. Create its page in `src/pages/` and its styles in `src/css/`.
3. Add its route in `src/App.tsx`.

The menu component itself does not change.

### Responsive Design
The page will be responsive: it will adapt to mobile, tablet and desktop screens.

* **Today**: The logo (left) and the menu (right) stay on one row on every screen size.
* **Future**:
  * **Mobile**: The menu collapses into a "hamburger" button that opens and closes the list of sections, so it keeps working when more sections (Contact, About Us…) are added.
  * **Tablet**: Layout adjusted for medium screens, between mobile and desktop.
  * **Other formats**: The rest of the pages (forms and the 4-page manual template) also adapt to each screen size.
* Whatever the screen size, the menu keeps the same sections from the list, the same order and the same behavior (links, current page highlight).

## 3. Preconditions & Postconditions
* **Preconditions**: The app is open in the browser.
* **Postconditions**: Clicking a menu link changes the URL and shows that page without reloading the browser.

## 4. Invariants
* The header (logo + menu) is visible on every page.
* The menu shows exactly the sections in the list, in the same order.
* A saved brand title and its style are kept when the user moves between pages. They are only reset when the browser page is refreshed (see `titlefild.md`, Out of Scope).

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
* **Given**: The user saved the title "My Brand" on the Brand Manual page.
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
