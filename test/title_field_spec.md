# Test: Brand title field — required text

**Test name:** shows "Required text" error when the Brand title is empty

**Given**
- The page shows the Brand title text field and the Save/Print button.
- The field lets the user type text (it is enabled, not read-only).
- The field is empty.

**When**
- The user does not write anything in the field.
- The user clicks the button.

**Then**
- An error message "Required text" appears near the field.
- No title appears at the top of the page.
- The field stays empty and is still editable.

## Extra cases

1. **Only spaces** — the user types "   " and clicks the button → the "Required text" error still appears (spaces count as empty).
2. **Valid text** — the user types "My Brand" and clicks the button → no error; "My Brand" appears at the top of the page.
3. **Fixing the error** — after the error appears, the user types text and clicks again → the error disappears and the title appears at the top of the page.
