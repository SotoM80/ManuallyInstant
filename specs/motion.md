# Technical Specification: Motion (buttons, controls and preview)

## 1. What it does
Buttons and controls react with movement when the user hovers, clicks or chooses something, and the manual preview animates its changes instead of jumping. The style is **playful but soft**: a small overshoot (bounce) and unhurried durations.

## Out of Scope
Moving between pages of the app (Home ↔ Brand Manual). Anything in the exported PDFs. Motion settings inside the app (the system setting is used instead, see Invariants). The native file and color dialogs, which are drawn by the operating system.

## 2. Interface

### Shared motion values (`src/index.css`)
| Token | Value | Used for |
|---|---|---|
| `--ease-bounce` | `cubic-bezier(0.34, 1.2, 0.64, 1)` | everything that grows, pops or glides |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | rings |
| `--ease-smooth` | `cubic-bezier(0.16, 1, 0.3, 1)` | color picker pop-ups and controls: settles slowly, never overshoots |
| `--dur-fast` | 250 ms | hover, press, color changes |
| `--dur` | 450 ms | pops, pop-ups, swatches |
| `--dur-slow` | 600 ms | preview, Apply feedback |

Shared keyframes: `pop` (grows to 1.12 and back), `shake` (left-right, "no"), `pulse` (accent ring that spreads out).

### Buttons and controls
| Element | Motion |
|---|---|
| Nav menu links | hover: lift 2px; press: shrink; the current page's link pops |
| Landing links and buttons (Start your brand manual, See our work, Send) | hover: lift, shadow and grow a little; press: shrink |
| Menu button (mobile) | its three lines turn into an ✕ when open; the menu panel slides down with `--ease-smooth` |
| Apply (above the Cover section) | hover: lift and shadow; press: shrink. **Disabled** → faded, no motion. **Applied** → accent ring pulses twice and a ✓ pops in next to "Apply" (decoration only: the accessible name stays "Apply") |
| Logo "Choose file" | **no motion**: only the border color changes on hover |
| Segmented controls (Orientation, Preview view, Template) | hover tints the options not chosen; press shrinks; the chosen one pops |
| Autocomplete lists (Font family, Font style, Font size, Primary font, Secondary font) | **no bounce**: on open, the floating list fades in, rises 4px and grows from 96% out of the field (`--ease-smooth`, about 0.45 s); it closes at once. Hovering an option tints it |
| Color pickers | **no bounce**: elegant fades and glides with `--ease-smooth`. See `colorpicker.md` (swatches pop-up, name pop-ups, RGB pop-up) |

### Preview
* Changing **Template**, **Page orientation** or **Preview view** makes each page and the cover's title, logo and "Designed by" glide from their old place and size to the new ones (browser View Transitions).
* Each time a new Cover logo is applied, the cover grows into its page. Typing does not replay it.
* Opening or folding a section makes the pages and the sections glide to their new order, softly and with no bounce, like the accordion (500 ms, `--ease-smooth`). Only the two lists move (FLIP with the Web Animations API, `src/utils/useReorderGlide.ts`), not the whole page as a View Transition would, so the accordion keeps unfolding underneath.
* In browsers without View Transitions the preview changes at once, with no animation.

### Landing (Home)
An expressive opening, then subtle motion driven by scrolling (see `landing.md` and ADR 0017). Scrolling itself is the browser's own; menu anchors scroll smoothly.

| Element | Motion |
|---|---|
| Hero studio name | on load, its letters rise into place one after another |
| Marquee | the band of words slides sideways in an endless loop |
| Section labels, blocks, cards and projects | fade in and rise 24px as they enter the screen |
| Manual pages (ManuallyInstant section) | hover: the pages fan out a little more |
| Services cards | hover: lift 4px, the top rule turns to the accent color |
| Work projects | hover: the image grows a little |

* In browsers without scroll-driven animations, the same reveals play once when each element enters the screen.

## 3. Preconditions & Postconditions
* **Preconditions**: none; motion applies on every page of the app.
* **Postconditions**: every animation ends in exactly the same state the app would have without it.

## 4. Invariants
* Motion never changes content or values; it only shows changes.
* **Reduced motion**: when the system asks for reduced motion (`prefers-reduced-motion: reduce`), every animation and transition is instant, View Transitions are skipped and the custom picker does not jump. All features keep working.
* Accessible names never include decorations (the ✓ of Apply, the name pop-ups of the swatches).
* Hidden pop-ups and folded swatches can't be reached with the keyboard or by screen readers (`inert`).

## Failure Modes
* **Browser without View Transitions**: the preview updates instantly; nothing else changes.

## 5. Given-When-Then Test Criteria

### Scenario 1: Apply Disabled
* **Given**: No new image is waiting.
* **When**: The user looks at Apply.
* **Then**: It is disabled and faded, and does not move on hover.

### Scenario 2: Apply
* **Given**: The user chose a new Cover logo.
* **When**: The user clicks Apply.
* **Then**: Apply pulses with a ✓ (`data-feedback="saved"`), its accessible name is still "Apply", and the cover grows into the page with the new logo.

### Scenario 3: Feedback Can Repeat
* **Given**: Apply has just pulsed.
* **When**: Its animation ends.
* **Then**: The button goes back to `data-feedback="idle"`, so the next Apply animates again.

### Scenario 4: Template Change Glides
* **Given**: The Cover is filled in and Template 1 is chosen, in a browser with View Transitions.
* **When**: The user chooses Template 2.
* **Then**: The title, logo and "Designed by" glide to their Template 2 places.

### Scenario 5: Reduced Motion
* **Given**: The system asks for reduced motion.
* **When**: The user changes the template.
* **Then**: The preview changes at once, without a View Transition.
