# ADR 0035: With Follow section Off, the sections column stays on the screen

## Status
Accepted — 2026-11-12

## Context
With Follow section On (ADR 0032), the open section moves to the top of its column beside its page, so the form and its page are side by side. With Off, nothing moves: the pages and the sections keep their natural order. Then, to look at another page, the user scrolls, and the form they are working in scrolls away with the page. The user wants the sections column (the sidebar) to stay on the screen with Off, and only the pages to move.

Today the **preview** sticks to the screen in Grid and Overview, and scrolls in Pages (`brandmanual.md`); the sections column always scrolls with the page.

Options considered:
* **Stick the column with Off only**, and let the preview scroll in every view.
* **Stick the column always**: it would fight the open section's alignment of On (`--sections-offset`), which pushes the column down to its page.
* A third Follow section option that moves only the pages: tried and not what the user wanted.

## Decision
With Follow section **Off**, on wide screens (two columns), the sections column is **sticky**, 16 px from the top of the screen, at most as tall as the screen, and **scrolls on its own** when its content is taller. The preview then scrolls with the page in every view. With **On** nothing changes. On narrow screens (one column) nothing sticks.

## Consequences
* **+** With Off, the form being worked in stays in view while the user moves through the pages.
* **+** On is untouched, and its alignment of the open section does not meet a sticky column.
* **+** Only CSS, keyed on an attribute of the page for the Follow section choice.
* **−** With Off, a tall form (Logo, Skin) has a scroll of its own inside the column: two scrolls on the screen.
* **−** With Off, in Grid and Overview the preview no longer sticks: the pages scroll instead of the form.
