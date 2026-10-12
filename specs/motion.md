# Technical Specification: Motion (buttons, controls and preview)

## 1. What it does
Buttons and controls react with movement when the user hovers, clicks or chooses something, and the manual preview animates its changes instead of jumping. The style is **playful but soft**: a small overshoot (bounce) and unhurried durations.

## Out of Scope
The autocomplete lists (Font family, Font style, Font size). Moving between pages of the app (Home ↔ Brand Manual). Anything in the exported PDFs. Motion settings inside the app (the system setting is used instead, see Invariants). The native file and color dialogs, which are drawn by the operating system.

## 2. Interface

### Shared motion values (`src/index.css`)
| Token | Value | Used for |
|---|---|---|
| `--ease-bounce` | `cubic-bezier(0.34, 1.2, 0.64, 1)` | everything that grows, pops or glides |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | rings |
| `--ease-smooth` | `cubic-bezier(0.16, 1, 0.3, 1)` | color picker pop-ups and controls: settles slowly, never overshoots |
| `--dur-fast` | 250 ms | hover, press, color changes |
| `--dur` | 450 ms | pops, pop-ups, swatches |
| `--dur-slow` | 600 ms | preview, Save feedback |

Shared keyframes: `pop` (grows to 1.12 and back), `shake` (left-right, "no"), `pulse` (accent ring that spreads out).

### Buttons and controls
| Element | Motion |
|---|---|
| Nav menu links | hover: lift 2px; press: shrink; the current page's link pops |
| Home "Start" | hover: lift, shadow and grow a little; press: shrink |
| Save | hover: lift and shadow; press: shrink. **Not valid** → shakes. **Saved** → accent ring pulses twice and a ✓ pops in next to "Save" (decoration only: the accessible name stays "Save") |
| Logo "Choose file" | **no motion**: only the border color changes on hover |
| Segmented controls (Orientation, Preview view, Template) | hover tints the options not chosen; press shrinks; the chosen one pops |
| Color pickers | **no bounce**: elegant fades and glides with `--ease-smooth`. See `colorpicker.md` (swatches pop-up, name pop-ups, RGB pop-up) |

### Preview
* Changing **Template**, **Page orientation** or **Preview view** makes each page and the cover's title, logo and "Designed by" glide from their old place and size to the new ones (browser View Transitions).
* After each valid **Save**, the cover grows into its page.
* In browsers without View Transitions the preview changes at once, with no animation.

## 3. Preconditions & Postconditions
* **Preconditions**: none; motion applies on every page of the app.
* **Postconditions**: every animation ends in exactly the same state the app would have without it.

## 4. Invariants
* Motion never changes content, values or what is saved; it only shows changes.
* **Reduced motion**: when the system asks for reduced motion (`prefers-reduced-motion: reduce`), every animation and transition is instant, View Transitions are skipped and the custom picker does not jump. All features keep working.
* Accessible names never include decorations (the ✓ of Save, the name pop-ups of the swatches).
* Hidden pop-ups and folded swatches can't be reached with the keyboard or by screen readers (`inert`).

## Failure Modes
* **Browser without View Transitions**: the preview updates instantly; nothing else changes.

## 5. Given-When-Then Test Criteria

### Scenario 1: Save Not Valid
* **Given**: The Cover title is empty.
* **When**: The user clicks Save.
* **Then**: The Save button shakes (`data-feedback="error"`) and the cover does not change.

### Scenario 2: Save Valid
* **Given**: Every Cover field is valid.
* **When**: The user clicks Save.
* **Then**: The Save button pulses with a ✓ (`data-feedback="saved"`), its accessible name is still "Save", and the cover grows into the page.

### Scenario 3: Feedback Can Repeat
* **Given**: The Save button has just shaken or pulsed.
* **When**: Its animation ends.
* **Then**: The button goes back to `data-feedback="idle"`, so the next Save animates again.

### Scenario 4: Template Change Glides
* **Given**: The user saved a cover and Template 1 is chosen, in a browser with View Transitions.
* **When**: The user chooses Template 2.
* **Then**: The title, logo and "Designed by" glide to their Template 2 places.

### Scenario 5: Reduced Motion
* **Given**: The system asks for reduced motion.
* **When**: The user changes the template.
* **Then**: The preview changes at once, without a View Transition.
