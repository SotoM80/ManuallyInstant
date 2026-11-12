# ADR 0033: The construction grid shows only guide lines

## Status
Accepted — 2026-11-12

## Context
The construction grid the app draws in 3.2 (`clearspace.md`) stacks many layers: a line for every module across the whole grid, over the logo too; the logo faded so those lines can be read; a dashed outline around the logo; X, the overall size and the rulers. The user finds the Clear space page noisy and asked for a cleaner grid.

Options considered:
* **Dots**: a small dot at every crossing of the modules instead of lines; the logo at full strength. The modules still show, lighter.
* **Only guide lines**: no modules; the grid's outer edge and four lines along the logo's edges, crossing the whole grid like crop marks; the logo at full strength.
* **Modules in the margin only**: the module lines drawn only in the band of X around the logo, none over it.

## Decision
We will draw **only guide lines**: the outer edge of the grid and four continuous lines along the logo's edges, from edge to edge, at 0.75 px × Technical lines. The module lines and the dashed outline of the logo go, and the logo is no longer faded. X, the overall size, the typed rulers and the clicked guides (still dashed, so they are not mistaken for the logo's lines) stay as they are. Grid modules still sets the size of X and the half-module step guides snap to.

## Consequences
* **+** The cleanest of the three: the logo is seen as it is, and the X of margin reads on all four sides at a glance, as in many printed manuals.
* **+** Less to draw: one path replaces the module lines and the outline.
* **−** The modules are no longer seen, so Grid modules only shows through the size of X; a user who wants the squares must upload their own grid.
* **−** Technical lines has one weight less to scale in 3.2.
