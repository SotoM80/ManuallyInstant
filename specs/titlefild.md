
# Technical Specification: Brand Title Input & Preview

## 1. What it does
Allows the user to enter the project/brand title and instantly display it on the Cover page of the manual preview (see `brandmanual.md`) upon clicking a button, include options to change fonts, colors, or text sizes.

## Out of Scope
Will not save the title to a database or browser storage (localStorage / cookies) for now. Refreshing the page will reset the title to its default state. (Note: This is deferred for a future iteration).
Customization features are deferred for future styling updates.
 
## 2. Interface
### UI Elements
* **Brand Title Field**: A text,color change,font change and size input components.
* **Action Button**: A button labeled "Print" or "Save". It is only as wide as its label (not full width) and sits on the right.
* **Alignment**: All the text in the form (labels, typed values and error messages) is aligned to the right.
* **Cover Preview**: The Cover page of the manual preview (see `brandmanual.md`) shows the saved title. The title is **not** shown in the site header.

### Predefined Options
Each style field is an autocomplete input that starts with its default value already selected.

| Field | Options | Default |
|---|---|---|
| Font Family | Roboto, Open Sans, Lato, Montserrat, Playfair Display (loaded from Google Fonts) | Roboto |
| Font Color | Black `#000000`, White `#FFFFFF`, Red `#E53935`, Blue `#1E88E5`, Green `#43A047`, Yellow `#FDD835`, Gray `#757575` | Black |
| Font Style | Regular, Bold, Italic, Bold Italic | Regular |
| Font Size | Small `24px`, Medium `32px`, Large `48px` | Medium |

* **Font Size** follows the same rules as Font Family, Font Color and Font Style (Failure Modes, Scenarios 3 and 4).
* The explicit error message for an invalid value is: `"Select a valid option"`.
* The selected style is applied to the Cover together with the title when the user clicks the button (not while typing).
* **Font loading**: Each Font Family is requested from Google Fonts with all four variants needed by Font Style: regular 400, bold 700, italic 400 and bold italic 700 (`family=<Font>:ital,wght@0,400;0,700;1,400;1,700`). Each font is requested only once per session.


## 3. Preconditions & Postconditions
* **Preconditions**: The user is on the active single-session workspace. The title input field is rendered and interactive.
* **Postconditions**: Clicking the button validation injects the clean, verified text payload into the Cover page of the manual preview.

## 4. Invariants
* The Cover page keeps its size and position whether it is empty or populated.
* Bold, Italic and Bold Italic must be drawn with the real font files from Google Fonts, never faked by the browser (the app uses `font-synthesis: none`). Choosing any Font Style must visibly change the Cover title compared to Regular.

##  Failure Modes
* **Empty Input on Submit**: If the user clicks the button while the field is blank or contains only spaces, the action is blocked. The input transitions to an error state displaying the explicit text: `"Required field"`.

* **Restricted Input Selection**: The fields for Font Family, Font Color, and Font Style allow users to type only to filter and search the predefined list. Free-text entries that do not match the system options cannot be saved or submitted.

* **Inline Search & Typing Restrictions (Font, Color & Style)**:
• Real-time Filtering: If the user types inside the Font Family, Font Color, or Font Style fields, the dropdown will filter to show only matching options.
• No Match Display: If the typed value does not exist in the predefined list for that specific field, the dropdown displays: "No results found".
• Invalid Value State: If the user presses Enter or clicks outside the field (blur) while an invalid value is typed in any of these three inputs, that specific field immediately transitions to an Error State (the border turns Red and the error message appears below).

## 5. Given-When-Then Test Criteria

### Scenario 1: Successful Title Processing
* **Given**: The user has typed a valid text string (e.g., `"My Brand"`) into the input field.
* **And**: The user has selected a valid option for Font Family, Font Color, and Font Style via the autocomplete dropdowns.
* **When**: The user clicks the submit action button.
* **Then**: No errors are raised, and the text instantly populates the Cover page of the manual preview.

### Scenario 2: Missing Title Validation Failure
* **Given**: The brand title input field is completely empty or contains only whitespace.
* **When**: The user clicks the submit action button.
* **Then**: A validation error is triggered, the input border turns Red, and the text "Required field" is displayed beneath the input.

### Scenario 3: Missing Style Selection Validation Failure
* **Given**: The user has entered a valid title but left one or more style fields (Font Family, Font Color, or Font Style) blank.
* **When**: The user clicks the submit action button.
* **Then**: The action is blocked, the empty style inputs transition to an Error State with a Red border, and the helper text "Required field" appears beneath each affected field.

### Scenario 4: Invalid Style Value on Focus Loss (Blur)
* **Given**: The user types a value into the Font Family, Font Color, or Font Style field that does not match any predefined option.
* **And**: The dropdown displays "No results found".
* **When**: The user presses Enter or clicks outside the field (triggers a blur event).
* **Then**: The field immediately transitions to an Error State, the input border turns Red, and an explicit error message appears below the field.

### Scenario 5: Font Style Is Visibly Applied
* **Given**: The user has typed `"My Brand"`, selected Font Family `"Open Sans"` and Font Style `"Bold Italic"`.
* **When**: The user clicks the submit action button.
* **Then**: The Cover shows the title in bold italic, and the Google Fonts stylesheet for Open Sans includes the bold and italic variants (`ital,wght@0,400;0,700;1,400;1,700`)...