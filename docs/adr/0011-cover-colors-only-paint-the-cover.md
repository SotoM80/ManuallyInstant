# ADR 0011: The Cover's colors only paint the Cover; the Skin owns its colors

## Status
Proposed — 2026-10-16

## Context
Until now the Cover section had two colors that reached the whole manual: its **Background color** painted every page, and its **Typography color** colored the text of every page (and the lines of the construction grid). The Skin used them too, as the colors that filled in when the palette had none, and its layers could only use palette colors (by id, with Auto).

Designers want the Cover to be its own design: a dark cover with light text should not turn every page of the manual dark. They also want the Skin's colors to be free, not only the palette's, while still being able to take a palette color quickly. And a layer may be wanted on the inner pages only, or on the Cover too.

Options considered for the **Skin's colors**:
* **Keep them linked to the palette** (by id): a change in Colors flows into the Skin, but only palette colors can be used.
* **Free colors, with the palette as a shortcut that copies the value**: any color can be used, and the Skin never changes behind the user's back when the palette is edited.

## Decision
We will make the Cover's Background and Typography colors paint **only the Cover**. The Skin section gets its own **Page background** and **Page text** colors for every other page. Every color of the Skin (the two page colors and the two of each layer) is a plain HEX value, chosen with the same color picker as the Cover, plus chips that **copy** a palette color into it. Each layer has an **Also on the Cover** checkbox, off by default.

## Consequences
* **+** The Cover and the inner pages can look different, which is what most brand manuals do.
* **+** The Skin is easier to understand: what you pick is what is drawn. There is no Auto rule, and no stable palette ids are needed by the Skin.
* **+** A layer can be shared with the Cover on purpose, one by one.
* **−** Changing the brand palette no longer updates the Skin; the user picks the new color again.
* **−** The palette ids added for the Skin (`PaletteColor.id`) are no longer needed by it; they stay, harmless, as the stable key of each color.
* **−** It changes what `colorpicker.md`, `cover.md`, `colorpalette.md`, `typography.md` and `clearspace.md` said, and their tests.
