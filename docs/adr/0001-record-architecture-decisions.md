# ADR 0001: Record architecture decisions

## Status
Accepted — 2026-10-11

## Context
The project's key decisions (frontend only, approximate CMYK, layout-only templates) were written as single sentences in `CLAUDE.md`, without the reasons or the trade-offs behind them. Months from now, nobody will remember why the app works this way, and the same discussions will start again.

## Decision
We will record every significant architecture decision as an ADR in `docs/adr/`, using the short format by Michael Nygard (Status, Context, Decision, Consequences) from [template.md](template.md).

## Consequences
* **+** The reasons behind the design live next to the code and in its git history.
* **+** New contributors (and AI assistants) can read why things are the way they are.
* **−** Writing an ADR is a small extra step every time an important decision is made.
