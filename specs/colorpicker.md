# Technical Specification: Color Picker (Typography & Background)

## 1. What it does
A custom color picker that lets the user choose colors for the manual. The Cover section has two of them, chosen separately:
* **Typography color**: the color of the text on the pages (the brand manual title and "Designed by").
* **Background color**: the background of every page of the manual (the same for all four pages).

Each picker combines **quick swatches** (one click) with **any color** (a native color picker and a HEX field).

## Out of Scope
The brand's color palette (the "Colors" section with names, RGB and CMYK values; it will have its own spec and may reuse this picker). Different colors per page or per text element. Gradients, transparency or background images. Warnings about low contrast between text and background. Saving colors between sessions.

## 2. Interface
Each picker is a group labeled with its name ("Typography color" or "Background color") and contains, in this order:
1. **Swatches**: 12 round color buttons that work as a single choice. Each one has the color's name as its accessible name (shown as a tooltip):

   | Name | HEX | Name | HEX | Name | HEX |
   |---|---|---|---|---|---|
   | Black | `#000000` | Red | `#E53935` | Teal | `#00897B` |
   | White | `#FFFFFF` | Orange | `#FB8C00` | Blue | `#1E88E5` |
   | Gray | `#757575` | Yellow | `#FDD835` | Navy | `#1A237E` |
   | Beige | `#F5F0E6` | Green | `#43A047` | Purple | `#8E24AA` |

2. **Custom color**: the browser's native color picker (labeled "<name> custom").
3. **HEX field**: a text field (labeled "<name> HEX") with the color as `#RRGGBB`.

The three parts always show the same color: clicking a swatch or using the native picker fills the HEX field, and typing a HEX that matches a swatch selects that swatch. A color that is not in the swatches leaves no swatch selected.

| Picker | Default |
|---|---|
| Typography color | Black `#000000` |
| Background color | White `#FFFFFF` |

### On the manual
* The **title** and **"Designed by"** are drawn in the Typography color ("Designed by" a bit softer, 75% opacity). The divider line of Template 3 also uses it, very faint.
* All four **pages** are painted with the Background color.

### HEX field rules
* Accepted: `#RRGGBB` or `#RGB`, with or without `#`, upper or lower case. On blur or Enter the value is tidied to `#RRGGBB` in upper case (e.g. `1e88e5` → `#1E88E5`, `#abc` → `#AABBCC`).
* Anything else is invalid.

## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the Brand Manual page (`/brand-manual`), in the Cover section.
* **Postconditions**: After a valid Save, the text of the Cover uses the Typography color and every page uses the Background color.

## 4. Invariants
* Typography color and Background color are independent: changing one never changes the other.
* Colors are applied to the manual only when the user clicks Save (same rule as the rest of the Cover).
* All four pages always share the same Background color.
* Colors work the same in every template, orientation and preview view.

## Failure Modes
* **Invalid HEX on blur or Enter**: the HEX field turns red and shows `"Enter a valid HEX color, like #1E88E5"`. Save is blocked while it is invalid.
* **Empty HEX on Save**: the HEX field shows `"Required field"` and Save is blocked.

## 5. Given-When-Then Test Criteria

### Scenario 1: Picking a Swatch
* **Given**: The user is in the Cover section, Background color is White.
* **When**: The user clicks the "Navy" swatch in Background color.
* **Then**: The Background color HEX field shows `#1A237E`, Navy is selected, and Typography color is unchanged.

### Scenario 2: Any Color by HEX
* **Given**: The user is in the Cover section.
* **When**: The user types `#2b2d42` in the Typography color HEX field and leaves the field.
* **Then**: The field shows `#2B2D42`, no error is shown and no swatch is selected.

### Scenario 3: Invalid HEX
* **Given**: The user typed `blue` in the Background color HEX field.
* **When**: The user leaves the field, and then clicks Save.
* **Then**: The field shows "Enter a valid HEX color, like #1E88E5" with a red border, and the Cover does not change.

### Scenario 4: Colors on the Manual
* **Given**: The user chose White as Typography color and `#1A237E` as Background color, and filled the rest of the Cover.
* **When**: The user clicks Save.
* **Then**: The title and "Designed by" are white and all four pages have the `#1A237E` background.

### Scenario 5: Colors Wait for Save
* **Given**: The user is on the Brand Manual page.
* **When**: The user picks Navy as Background color without clicking Save.
* **Then**: The pages keep their white background.
