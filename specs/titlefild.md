
# Technical Specification: Brand Manual Title Input & Preview

## 1. What it does
Allows the user to enter the brand manual title and instantly display it on the Cover page of the manual preview (see `brandmanual.md`) while it is typed, with no button, and include options to change fonts, font styles, or text sizes. The title's color is the **Typography color** of the Cover (see `colorpicker.md`).

This field is part of the **Cover** section, together with "Designed by" and the logo (see `cover.md`). Where the title sits on the Cover depends on the template; in the default template it is at the top of the page.

## Out of Scope
Will not save the title to a database or browser storage (localStorage / cookies) for now. Refreshing the page will reset the title to its default state. (Note: This is deferred for a future iteration).
Customization features are deferred for future styling updates.
 
## 2. Interface
### UI Elements
* **Brand Manual Title Field**: A text field labeled "Brand manual title", plus font, font style and size input components. While it is empty, the Cover shows the placeholder "Your brand manual title".
* **No Save button**: every change reaches the Cover at once (see ADR 0007).
* **Alignment**: All the text in the form (labels, typed values and error messages) is aligned to the right.
* **Cover Preview**: The Cover page of the manual preview (see `brandmanual.md`) shows the current title. The title is **not** shown in the site header.

### Predefined Options
Each style field is an autocomplete input that starts with its default value already selected. Its list of options **floats** under the field, above the rest of the form, so opening it never pushes anything down. It shows about six options at a time (the rest scroll), scrolls to the chosen option when it opens, and marks the chosen option with ✓ (a decoration: it is not part of the option's accessible name).

| Field | Options | Default |
|---|---|---|
| Font Family | Roboto, Open Sans, Lato, Montserrat, Playfair Display (loaded from Google Fonts) | Roboto |
| Font Style | Regular, Bold, Italic, Bold Italic | Regular |
| Font Size | Small `24px`, Medium `32px`, Large `48px` | Medium |

* **Font Size** follows the same rules as Font Family and Font Style (Failure Modes, Scenarios 3 and 4).
* The old "Font color" field was replaced by the **Typography color** picker (see `colorpicker.md`).
* The explicit error message for an invalid value is: `"Select a valid option"`.
* The selected style is applied to the Cover as soon as a valid option is picked or typed. While a field is half typed or not valid, the Cover keeps the last valid option.
* **Font loading**: Each Font Family is requested from Google Fonts with all four variants needed by Font Style: regular 400, bold 700, italic 400 and bold italic 700 (`family=<Font>:ital,wght@0,400;0,700;1,400;1,700`). Each font is requested only once per session.


## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the active single-session workspace. The title input field is rendered and interactive.
* **Postconditions**: The clean title (spaces trimmed at both ends) is shown on the Cover page of the manual preview on every change.

## 4. Invariants
* The Cover page keeps its size and position whether it is empty or populated.
* Bold, Italic and Bold Italic must be drawn with the real font files from Google Fonts, never faked by the browser (the app uses `font-synthesis: none`). Choosing any Font Style must visibly change the Cover title compared to Regular.

##  Failure Modes
* **Empty Input**: A blank title (or only spaces) is not an error: the Cover shows the placeholder "Your brand manual title". A blank style field is not an error either: the Cover keeps the last valid option.

* **Restricted Input Selection**: The fields for Font Family, Font Style and Font Size allow users to type only to filter and search the predefined list. Free-text entries that do not match the system options never reach the Cover.

* **Inline Search & Typing Restrictions (Font, Style & Size)**:
• Real-time Filtering: If the user types inside the Font Family, Font Style or Font Size fields, the dropdown will filter to show only matching options.
• No Match Display: If the typed value does not exist in the predefined list for that specific field, the dropdown displays: "No results found".
• Invalid Value State: If the user presses Enter or clicks outside the field (blur) while an invalid value is typed in any of these three inputs, that specific field immediately transitions to an Error State (the border turns Red and the error message appears below).

## 5. Given-When-Then Test Criteria

### Scenario 1: Successful Title Processing
* **Given**: The user has typed a valid text string (e.g., `"My Brand"`) into the input field.
* **And**: The user has selected a valid option for Font Family, Font Style and Font Size via the autocomplete dropdowns.
* **When**: The user types or picks them.
* **Then**: No errors are raised, and the text instantly populates the Cover page of the manual preview, with no button.

### Scenario 2: Empty Title
* **Given**: The Cover shows the title "My Brand".
* **When**: The user clears the field (or leaves only spaces).
* **Then**: No error is shown, and the Cover shows the placeholder "Your brand manual title" again.

### Scenario 3: Empty Style Field
* **Given**: The user has entered a valid title.
* **When**: The user clears a style field (Font Family, Font Style or Font Size) and leaves it.
* **Then**: No error is shown, and the Cover keeps the last valid option for that field.

### Scenario 4: Invalid Style Value on Focus Loss (Blur)
* **Given**: The user types a value into the Font Family, Font Style or Font Size field that does not match any predefined option.
* **And**: The dropdown displays "No results found".
* **When**: The user presses Enter or clicks outside the field (triggers a blur event).
* **Then**: The field immediately transitions to an Error State, the input border turns Red, and an explicit error message appears below the field.

### Scenario 5: Font Style Is Visibly Applied
* **Given**: The user has typed `"My Brand"`, selected Font Family `"Open Sans"` and Font Style `"Bold Italic"`.
* **When**: The last option is picked.
* **Then**: The Cover shows the title in bold italic, and the Google Fonts stylesheet for Open Sans includes the bold and italic variants (`ital,wght@0,400;0,700;1,400;1,700`)...