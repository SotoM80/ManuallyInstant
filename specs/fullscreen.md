# Technical Specification: Full Screen View

## 1. What it does
A **Full screen** button in the preview toolbar shows the whole manual at the size of the screen, without the form: the 10 pages one below the other, on a dark background, with scroll. Each page is drawn at its A4 size, as in the PDF, and scaled so the whole page fits the screen of whoever is looking at it, on any browser or computer.

## Out of Scope
A presentation mode (one page at a time). A book view (two pages side by side). Zooming by hand. Editing from the view. Printing or sharing. Keyboard shortcuts of its own: scrolling with the arrows, Page Up/Down, Space, Home and End is the browser's own.

## 2. Interface
### Button
**Full screen** (with the icon ⤢) in the preview toolbar, after Template (see `brandmanual.md`).

### Opening
* The view asks the browser to go **full screen** (the Fullscreen API), hiding the tabs and the address bar.
* When the browser cannot or will not (see Failure Modes), the view fills the **whole window** instead and works the same way (the *window fallback*).
* It fades in briefly; with reduced motion it appears at once (see `motion.md`).

### The pages
* Every page, in its **natural order** ("1. Cover" to "10. Mockups"), even when an open section moved its pages to the top of the preview.
* With the chosen template, orientation and skin, and only the images already applied (ADRs 0007 and 0020): an image waiting for its Apply is not shown.
* Drawn like the pages of the PDF (see `export.md` and ADR 0012): at A4 size, in the Pages view, with no motion, and with the guides of the Clear space page drawn but not clickable. The view reuses this way of drawing the pages, **not** the off-screen copy made for the PDF, which is hidden on purpose.
* The pages have no view transition names (ADR 0006): the preview stays mounted below, with its own.
* A photo mockup still being composed shows "Preparing…" on its page, as in the preview (ADR 0014); the view opens at once.

### Fitting the screen
* Each page is scaled by the smaller of:
  * (visible width − 2 × 24 px) ÷ the A4 width,
  * (visible height − 2 × 24 px − the height of its caption) ÷ the A4 height.
* There is no fixed maximum: on a large monitor the pages grow, on a laptop they shrink.
* The scale is **worked out again** whenever the size of the window or of the screen changes (turning a tablet, moving the window to another monitor).
* Pages are 24 px apart, plus their caption. Scrolling brings each page into view whole, one after the other.
* **Caption** under each page: its number and name ("6. Correct use"), light on the dark background. It counts in the height above, so a page and its caption always fit together.

### Exit button
* **Exit full screen**, floating on the top right corner, above the pages.
* It fades after 3 seconds without moving the mouse, and comes back when the mouse moves or when it gets the keyboard focus.

### Leaving
* **Full screen**: leaving the browser's full screen **closes the view**, whatever the way: Esc (which the browser keeps for itself), the browser's own gesture, or Exit full screen.
* **Window fallback**: Esc and Exit full screen close the view.
* The focus goes back to the Full screen button. Everything behind is as it was: the open section, the preview view and the scroll.

### While it is open
* The page behind does not move: scrolling stays inside the view, even at its end, and the rest of the app cannot be reached.
* **Accessibility**: the view is a modal dialog labelled "Full screen view". When it opens, the focus is on Exit full screen, and Tab never leaves the view. Each page is an article named after it, as in the preview.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`).
* **Postconditions**: After leaving, the page is as it was before opening the view.

## 4. Invariants
* Each page, with its caption, always fits whole in the visible area, at any size of screen or window.
* Each page looks as in the PDF of the same template and orientation; only its scale changes.
* The view never changes anything in the manual.
* There is never a horizontal scroll.
* The page behind never moves while the view is open.

## Failure Modes
* **Full screen not available or refused** (for example Safari on iPhone, which only allows it for videos, or a browser setting): the view fills the window instead, with no error message.

## 5. Given-When-Then Test Criteria

### Scenario 1: Every Page, in Order
* **Given**: The user is on the Brand Manual page.
* **When**: The user clicks Full screen.
* **Then**: A dialog "Full screen view" shows the 10 pages as articles, from Cover to Mockups, each with its caption ("1. Cover" … "10. Mockups"), and the focus is on Exit full screen.

### Scenario 2: Natural Order With a Section Open
* **Given**: Typography is open, so its page is first in the preview.
* **When**: The user clicks Full screen.
* **Then**: The view shows Cover first and Typography ninth.

### Scenario 3: Template and Orientation
* **Given**: The manual is in Template 3, landscape.
* **When**: The user clicks Full screen.
* **Then**: Every page of the view is in landscape, laid out by Template 3.

### Scenario 4: Leaving the Browser's Full Screen
* **Given**: The view is open in the browser's full screen.
* **When**: The browser leaves full screen (the user pressed Esc).
* **Then**: The view closes and the focus is on the Full screen button.

### Scenario 5: Exit Full Screen
* **Given**: The view is open.
* **When**: The user clicks Exit full screen.
* **Then**: The view closes, leaves the browser's full screen if it was in it, and the focus is on the Full screen button.

### Scenario 6: Window Fallback
* **Given**: The browser does not allow full screen.
* **When**: The user clicks Full screen, then presses Esc.
* **Then**: The view fills the window with every page, then closes.

### Scenario 7: Only Applied Images
* **Given**: A new Cover logo was chosen but "Apply Logo" was not clicked.
* **When**: The user opens the view.
* **Then**: The Cover page shows the logo applied before (or its placeholder), as in the preview.

### Scenario 8: Fitting Another Screen
* **Given**: The view is open in a window 1440 × 900 px.
* **When**: The window becomes 800 × 1200 px.
* **Then**: The pages are scaled again, and each one, with its caption, still fits whole in the window, with no horizontal scroll.

### Scenario 9: A Photo Mockup Still Being Composed
* **Given**: The Mockups page has a photo mockup that is not composed yet.
* **When**: The user opens the view.
* **Then**: The view opens at once; the Mockups page shows "Preparing…", then the photo.
