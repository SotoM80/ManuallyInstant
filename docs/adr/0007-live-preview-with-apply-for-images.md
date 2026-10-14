# ADR 0007: Live preview, with one Apply button for new images

## Status
Accepted — 2026-10-14

## Context
Each section (Cover, Logo, Colors, Typography) had its own Save button. The preview only changed after Save, so trying out a font, a color or a title meant clicking Save and scrolling back to the preview every time. The forms are where the whole manual starts, and they have many options that the user wants to compare on the fly.

Options considered:
* **Keep Save per section.** Simple and already built, but slow to try ideas with: the problem we want to fix.
* **Everything live, images too.** No buttons at all. But a new image would swap in as soon as it is chosen, even while the user is still choosing, and every choice would create an object URL.
* **Everything live, except new images, which wait for one Apply button.** Text, colors, styles, sizes and fonts change the preview at once; a new or replaced image waits until the user confirms it.

## Decision
We will send every form change to the preview at once and remove the four Save buttons. New images (the Cover logo and every image of the Logo section) wait for a single **Apply** button at the top of the sections column, above Cover. Apply is disabled until a valid new image is chosen, and disabled again after it is pressed.

How it works (`src/utils/pendingImage.ts`):
* `useLiveData` sends the form's data to `App` each time it changes, starting with the first real change, so an untouched section keeps its placeholders.
* Each image field remembers the file chosen and the Apply count at that moment (`PendingImage`). The image the manual shows is calculated from the count: there is no effect to keep in sync.
* `BrandManualPage` keeps the Apply count and whether the Cover or Logo form has an image waiting.
* While a field is half typed (a HEX or a font name), the preview keeps its last valid value.

## Consequences
* **+** The user sees each change as it happens, with no Save and no scrolling.
* **+** An image is only swapped in when the user says so, and gets one object URL per file.
* **+** "Required field" errors are gone: an empty field shows its placeholder in the preview instead. Wrong values (an invalid HEX, an unknown font or a wrong file type) are still flagged at once.
* **−** Two ways of updating (live and Apply) to explain: the button says what it is for in its tooltip, and only turns on when it is needed.
* **−** The preview can show a half-filled manual (e.g. a title without a logo). This is fine while editing, but the PDF export will need its own check that the manual is complete.
