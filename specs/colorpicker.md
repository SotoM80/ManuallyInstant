# Technical Specification: Color Picker (Typography & Background)

## 1. What it does
A custom color picker that lets the user choose colors for the manual. The Cover section has two of them, chosen separately:
* **Typography color**: the color of the text of the Cover (the brand manual title and "Designed by").
* **Background color**: the background of the Cover. The other pages take their background and text colors from the Skin section (see `skins.md` and ADR 0011).

Each picker combines **quick swatches** (hidden behind one circle that opens them in a floating pop-up) with **any color** (a native color picker, a HEX field and RGB sliders).

## Out of Scope
The brand's color palette (the "Colors" section with names, RGB and CMYK values; see `colorpalette.md`, which reuses this picker). Different colors per page or per text element. Gradients, transparency or background images. Warnings about low contrast between text and background. Saving colors between sessions.

## 2. Interface
Each picker is a group labeled with its name ("Typography color" or "Background color"). Its first row contains, in this order:
1. **Swatches circle**: a round button (labeled "<name> swatches") filled with the current color, or empty with a dashed border while the HEX is not valid. Clicking it opens or closes the swatches pop-up.
2. **Custom color**: the browser's native color picker (labeled "<name> custom"). It swells gently when a swatch is chosen, to show it took that color.
3. **HEX field**: a text field (labeled "<name> HEX") with the color as `#RRGGBB`. It shakes when its value is not valid.
4. **RGB button**: opens the **RGB pop-up** (see below).

The **swatches** open in a floating pop-up under the circle: 12 round color buttons in two rows of six that work as a single choice. Each one has the color's name as its accessible name. Hovering or focusing one pops up a bubble with its name and HEX (e.g. "Blue #1E88E5"); the bubble is decoration only.

   | Name | HEX | Name | HEX | Name | HEX |
   |---|---|---|---|---|---|
   | Black | `#000000` | Red | `#E53935` | Teal | `#00897B` |
   | White | `#FFFFFF` | Orange | `#FB8C00` | Blue | `#1E88E5` |
   | Gray | `#757575` | Yellow | `#FDD835` | Navy | `#1A237E` |
   | Beige | `#F5F0E6` | Green | `#43A047` | Purple | `#8E24AA` |

### Swatches pop-up
* The swatches start **closed**: not visible, not reachable with the keyboard.
* Clicking the swatches circle **opens** a floating card under it, with a small arrow pointing at the circle. It floats above the rest of the form, so nothing below it moves.
* **Motion** (elegant, no bounce): the card fades in while it rises a few pixels and grows from 96% to its size out of the circle, settling slowly (`--ease-smooth`, about 0.5 s). Then the swatches fade up into place one after the other. The chosen one shows an accent ring that sends out a soft pulse.
* Clicking the circle again closes it: the card and its swatches fade out together, a little faster than they came in.
* A **mouse click** on a swatch chooses it and closes the pop-up; the focus goes back to the circle.
* With the **keyboard**, the arrow keys move between swatches and the pop-up stays open.
* **Escape** or a click outside the picker closes it.

### RGB pop-up
* The RGB button opens a pop-up under it that grows out of the button, with the same motion as the swatches pop-up (fade, small rise, 96% → 100%, no bounce). The sliders glide in one after the other. It shows a preview of the color, three sliders **Red**, **Green** and **Blue** (0–255) with their numbers, and the value as `rgb(R, G, B)`.
* Each slider's track shows the colors it can reach with the other two channels as they are.
* Moving a slider changes the color at once, like any other part of the picker.
* When it opens, the Red slider gets the focus. **Escape** (focus goes back to the button), a click outside, or the RGB button again close it.

All the parts always show the same color: clicking a swatch or using the native picker fills the HEX field, and typing a HEX that matches a swatch selects that swatch. A color that is not in the swatches leaves no swatch selected.

| Picker | Default |
|---|---|
| Typography color | Black `#000000` |
| Background color | White `#FFFFFF` |

### On the manual
* The **title** and **"Designed by"** are drawn in the Typography color ("Designed by" a bit softer, 75% opacity). The divider line of Template 3 also uses it, very faint.
* The **Cover** is painted with the Background color. The other pages are not (they use the Skin's Page background).

### HEX field rules
* Accepted: `#RRGGBB` or `#RGB`, with or without `#`, upper or lower case. On blur or Enter the value is tidied to `#RRGGBB` in upper case (e.g. `1e88e5` → `#1E88E5`, `#abc` → `#AABBCC`).
* Anything else is invalid.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Cover section.
* **Postconditions**: As soon as a valid color is picked or typed, the text of the Cover uses the Typography color and the Cover uses the Background color.

## 4. Invariants
* Typography color and Background color are independent: changing one never changes the other.
* Colors reach the manual at once (same rule as the rest of the Cover). While a HEX is half typed or not valid, the manual keeps the last valid color.
* The Typography and Background colors never paint any page but the Cover.
* Colors work the same in every template, orientation and preview view.

## Failure Modes
* **Invalid HEX on blur or Enter**: the HEX field turns red and shows `"Enter a valid HEX color, like #1E88E5"`. The manual keeps the last valid color.
* **Empty HEX**: not an error; the manual keeps the last valid color.

## 5. Given-When-Then Test Criteria

### Scenario 1: Picking a Swatch
* **Given**: The user is in the Cover section, Background color is White.
* **When**: The user opens the Background color swatches and clicks "Navy".
* **Then**: The Background color HEX field shows `#1A237E`, Navy is selected, and Typography color is unchanged.

### Scenario 2: Any Color by HEX
* **Given**: The user is in the Cover section.
* **When**: The user types `#2b2d42` in the Typography color HEX field and leaves the field.
* **Then**: The field shows `#2B2D42`, no error is shown and no swatch is selected.

### Scenario 3: Invalid HEX
* **Given**: The user typed `blue` in the Background color HEX field.
* **When**: The user leaves the field.
* **Then**: The field shows "Enter a valid HEX color, like #1E88E5" with a red border, and the pages keep their last valid background.

### Scenario 4: Colors on the Manual
* **Given**: The user typed a title in the Cover section.
* **When**: The user chooses White as Typography color and `#1A237E` as Background color.
* **Then**: At once, the title and "Designed by" are white and the Cover has the `#1A237E` background; the other pages do not change.

### Scenario 5: Colors Are Live
* **Given**: The user is on the Brand Manual page.
* **When**: The user picks Navy as Background color.
* **Then**: The Cover gets the `#1A237E` background at once, with no button.

### Scenario 6: Swatches Pop-up
* **Given**: The Typography color swatches are closed.
* **When**: The user clicks the swatches circle and then clicks "Blue".
* **Then**: The swatches pop-up opens, then closes; the circle and the HEX field show `#1E88E5`, and the focus is on the circle.

### Scenario 7: RGB Sliders
* **Given**: Background color is White (`#FFFFFF`).
* **When**: The user opens the RGB pop-up and moves Red to 0.
* **Then**: The HEX field shows `#00FFFF` and the pop-up shows `rgb(0, 255, 255)`.
