# Technical Specification: Typography (Brand Fonts)

## 1. What it does
The fourth section of the Brand Manual page is **Typography**. The user picks the brand's two fonts from a curated list of Google Fonts: a **Primary font** (for headings) and a **Secondary font** (for body text). As soon as a font is picked, the **Typography** page of the preview shows both fonts with their usage, their name, a large "Aa" and the alphabet with numbers. Where they sit on the page depends on the chosen template.

## Out of Scope
The font of the Cover title, which keeps its own picker (see `titlefild.md`). Using the Primary font on the Cover title is a future idea (see `PLAN.md`). Fonts outside the list below, or typing any Google Font. Font weights, sizes or line heights chosen by the user. Uploading font files. Saving the fonts between sessions.

## 2. Interface
### Section form (inside "4. Typography")
1. **Primary font**: an autocomplete field, like the title's Font family (see `titlefild.md`). Each option in its list is drawn **in its own font**, so the user sees how it looks before choosing. The list floats under the field like every autocomplete list (see `titlefild.md`): about six fonts at a time, with scroll.
2. **Secondary font**: the same, for the body text.

The section has no Save button: every valid font reaches the preview at once.

Both fields start with their default already chosen. The Primary and the Secondary font may be the same.

The form follows the visual rules of the Cover form (text aligned right).

### Fonts
| Category | Fonts |
|---|---|
| Sans | Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Raleway, Nunito, Work Sans, DM Sans |
| Serif | Playfair Display, Merriweather, Lora, Libre Baskerville, Cormorant Garamond |
| Display | Bebas Neue, Abril Fatface, Oswald |
| Mono | JetBrains Mono, Space Mono |

| Field | Default |
|---|---|
| Primary font | Montserrat |
| Secondary font | Open Sans |

### Loading the fonts (see ADR 0005)
* The list of options downloads, in **one** request, only the letters of the font names, enough to draw each name in its font.
* Once picked, each font is downloaded in its **regular** style only (all the Typography page needs). Some fonts have no bold or italic, and asking Google for a style a font does not have would fail.
* Until a font arrives, the browser draws the text with a fallback of the same kind (`sans-serif`, `serif` or `monospace`; Display fonts fall back to `sans-serif`).

### Typography page in the preview
The page shows the heading **"Typography"** and, for each font (Primary first):
* its **usage**: `Primary · Headings` or `Secondary · Body text`;
* its **name**, drawn in the font;
* a large **"Aa"** in the font;
* the **alphabet and numbers** in the font: `ABCDEFGHIJKLMNOPQRSTUVWXYZ`, `abcdefghijklmnopqrstuvwxyz`, `0123456789`.

The text uses the Cover's Typography color (Black until the Cover's color is changed). Until a font is changed, the page shows the placeholder `Your typography`.

### Templates
```
Template 1               Template 2               Template 3
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Typography  │         │Typography    │         │Typo- │Aa      │
│ Primary·Head │         │Aa  Primary   │         │graphy│PRIMARY │
│  Montserrat  │         │    Montserrat│         │      │Montser.│
│      Aa      │         │    ABC abc 12│         │      │────────│
│  ABC abc 123 │         │Aa  Secondary │         │      │Aa      │
│ Second·Body  │         │    Open Sans │         │      │SECONDA.│
│  Open Sans … │         │    ABC abc 12│         │      │Open San│
└──────────────┘         └──────────────┘         └──────┴────────┘
```
* **Template 1**: heading at the top; the two fonts one under the other. Everything centered.
* **Template 2**: heading at the top; one font per row, the large "Aa" on the left and the usage, name and alphabet next to it. Everything aligned left.
* **Template 3**: a side column on the left with the heading, a faint vertical line, and the two fonts one under the other in the wide column on the right, with a faint line between them. Text aligned left.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Typography section.
* **Postconditions**: The Typography page shows the last valid fonts both fonts with their usage, name, "Aa" and alphabet, placed by the current template.

## 4. Invariants
* The Typography page changes at once when a valid font is picked or typed. While a name is half typed or not in the list, the page keeps the last valid font. Editing another section never changes it.
* The Primary font always comes first on the page.
* The fonts are kept when the user moves between pages; refreshing the browser clears them.
* Fonts work the same in every template, orientation and preview view, and always stay inside the page.

## Failure Modes
No field is required: an empty field is not an error, and the page keeps the last valid font. As in `titlefild.md`, a case-insensitive match snaps to the option on blur or Enter (`inter` → `Inter`).
* **A name that is not in the list**: `"Select a valid option"`, with a red border, shown on blur or Enter.

## 5. Given-When-Then Test Criteria

### Scenario 1: Defaults
* **Given**: The user opens the Brand Manual page.
* **When**: The user looks at the Typography section.
* **Then**: Primary font shows "Montserrat", Secondary font shows "Open Sans", and the Typography page shows "Your typography".

### Scenario 2: Options in Their Own Font
* **Given**: The user is in the Typography section.
* **When**: The user types "Play" in Primary font.
* **Then**: The list shows "Playfair Display", drawn in Playfair Display.

### Scenario 3: Live Fonts
* **Given**: The user is in the Typography section.
* **When**: The user picks "Playfair Display" as Primary font and "Inter" as Secondary font.
* **Then**: The page shows at once, with no button, "Primary · Headings" with "Playfair Display", "Secondary · Body text" with "Inter", each with its "Aa" and alphabet drawn in its font.

### Scenario 4: A Font Not in the List
* **Given**: The user is in the Typography section.
* **When**: The user types "Comic Sans" in Primary font and leaves the field.
* **Then**: The field shows "Select a valid option" with a red border, and the page still shows "Your typography".

### Scenario 5: Fonts Change at Once
* **Given**: The page shows "Playfair Display" as Primary font.
* **When**: The user picks "Lora".
* **Then**: The page shows "Lora" at once. While the user is still typing "Lor", it keeps "Playfair Display".

### Scenario 6: Fonts Are Kept Between Pages
* **Given**: The page shows "Playfair Display" as Primary font.
* **When**: The user goes to Home and then back to Brand Manual.
* **Then**: The Typography page still shows "Playfair Display".
