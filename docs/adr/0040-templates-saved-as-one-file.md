# ADR 0040: A mockup template is saved as one file and opened again

## Status
Accepted — 2026-11-23

## Context
A template made in the template editor (a photo, the product's selection, the logo area, its name, group and color) lives only in the session (ADR 0002): a refresh loses it, and the user must upload the photo and mark it again. **Download template** gave two files, a JSON and the photo, meant for developers to copy into `public/mockups/` and `templates.ts` by hand; the app had no way to read them back.

Agencies work per client project. A template made for one client (their mug, their tote bag) is needed again when that project comes back, and not in the next client's project. The app has no projects: every visit starts an empty manual.

Options considered:
* **Two files, copied by hand** into `public/mockups/` and `local-templates.json` (today): works only with `npm run dev`, by hand, and the list is shared by every project.
* **Save to my templates**, only with `npm run dev` (a Vite plugin writes the files): no steps after saving once, but global to the computer, needs a Remove button so old clients' templates do not pile up, and does not work in the published app. Kept for later, for "house" templates reused in every project (PLAN.md).
* **The browser's storage** (IndexedDB): works in the published app, but saves between sessions, against ADR 0002, and is lost when the browser's data is cleared.
* **One file the user keeps, and Open template**: chosen.

## Decision
We will make **Download template** save **one file**, `<name>.template.json`, holding the whole template with its photo and its selection inside (as data URLs), and add **Open template** to the Mockups section, next to Upload your own photo, which reads one or more such files and adds their templates to the session, ready to use, as **Use now** does.

* The file: `{ "app": "ManuallyInstant", "kind": "mockup-template", "version": 1, "template": { …PhotoTemplate, "image": "data:image/…", "maskImage"?: "data:image/png…" } }`. The photo keeps its own type (a PNG keeps its transparency); a template the app ships has its photo read and put inside too.
* Opening checks the file (`app`, `kind`, `version`, a valid template, an image that is a `data:image/png`, `jpeg` or `webp` URL) and refuses it otherwise; it never runs anything from it.
* An opened template gets an id no other template has (as an upload does, scenario 40) and lands where Use now would put a new template: on the Mockups page with none ticked, otherwise on the extra pages (ADR 0036).
* Nothing is saved by the app: the user keeps the file, for example in the client's project folder.

## Consequences
* **+** A template made once can be used again in any later session, in the published app too, with one click.
* **+** Templates live with the client's files, so each project's Mockups list starts clean, and a template can be passed to a colleague.
* **+** Still nothing saved by the app (ADR 0002); the client's photo stays on the user's device.
* **−** The file is about a third larger than the photo (base64), so a 10 MB photo makes a file of about 14 MB; Open template accepts files up to 15 MB.
* **−** The user opens their templates in each session; there is no list that remembers them (option 2, later).
* **−** A developer adding a shipped template now takes the photo out of the file by hand; this is rare.
