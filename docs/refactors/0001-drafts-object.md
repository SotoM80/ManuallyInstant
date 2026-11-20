# Refactor 0001 — One `drafts` object in App

- **Date:** 2026-11-06 (prepared on 2026-11-05)
- **Branch:** `refactor/drafts-object`, merged into `main` (fast-forward) and pushed
- **Commits:** `f8865e9` → `89da6e9` (6 commits)
- **Files:** `src/App.tsx`, `src/pages/BrandManualPage.tsx`, `src/utils/drafts.ts` (new)
- **Context:** Week 9, *From Works to Maintainable* (improve the structure of working code without changing what it does)

---

# 🇬🇧 ENGLISH

## 1. Background: what happened before (2026-11-03)

The 5 forms (Cover, Logo, Usage, Colors, Typography) lost what the user typed when going to Home and back.
To fix it, each form's fields became a **draft** that `App` can own, since `App` sits above the routes and is never unmounted.

In commit `d8beefa`, the draft logic that lived inside `BrandForm.tsx` (`useState` + `useRef latest` + `update()`) was **extracted** into a small hook, `src/utils/useDraft.ts`, and every form started using it.

> Honest note: `d8beefa` mixed that extract with a behaviour change (Typography now owned by App). Lesson: commit a refactor separately from a feature.

## 2. The problem (the cost, not the smell)

After 2026-11-03, `App` kept **one state per form** (`coverDraft`, `logoDraft`, `usageDraft`, `colorsDraft`, `typographyDraft`).
`BrandManualPage` received **10 props** (a draft and its setter for each form) only to pass them on. It never read them.

```
App  ──10 props──▶  BrandManualPage  ──▶  5 forms
```

**Cost:** adding or changing a form meant touching 3 files (a `useState` in App, 2 props in the page's type, the hand-off to the form) and re-reading plumbing that does nothing.

## 3. Was it worth doing now?

- **How often it changes:** often. The 5 forms were changed in one day.
- **Time cost:** small each time, but repeated in 3 places.
- **Mistakes it makes likely:** forgetting one of the 2 props, so a form silently stops keeping its fields.
- **Smallest change:** one object instead of 5 states. **Operation:** merge / move.

## 4. Options considered

| | Option 1: one `drafts` object | Option 2: a Context |
|---|---|---|
| What it changes | App keeps `drafts` + `onDraftChange(key, draft)`; the page gets 2 props | A `DraftsProvider`; each form reads its draft with a hook; the page gets 0 props |
| Draft props in the page | 2 | 0 |
| Files to touch for a new form | 2 | 1 |
| Dependency visible in props? | Yes | No |
| Size and risk | Small, mechanical | Medium, more new code |

**Chosen: Option 1.** It removes most of the friction with the least code, keeps `useDraft` and the forms untouched, can be done one form at a time, and keeps the dependency visible in props like the rest of the app.
**Turned down: Option 2** (more code, hidden dependency, harder to check "no behaviour change"), and rewriting the whole module in one go.

## 5. The main risk: ordering and timing

With one shared object, one form's update could overwrite another's if the code built on an old copy.
**Prevention:** every update is `setDrafts(prev => ({ ...prev, [key]: draft }))`, so each one starts from the newest data.
Also checked: `useDraft` only calls `onDraftChange` from event handlers (never inside a `useEffect`), so the new function created on each render changes nothing.

## 6. Baseline (before any change)

- `eslint .` → no errors. `tsc -b` → no errors.
- `npm test` → **514 / 527 passed, 13 failed.** Every failure was `Exceeded timeout`, in the slowest files (`Export`, `CmykValues`, `PhotoMockups`). They are slow and flaky, and unrelated to drafts.
- Manual check: in each form, type something → Home → back → still there.

## 7. Step by step

| Step | Commit | What changed | Checked with |
|---|---|---|---|
| 0 | — | Branch + baseline | lint, tsc, full suite |
| 1 | `f8865e9` | New `src/utils/drafts.ts`: the `Drafts` type, not used yet | tsc, lint |
| 2 | `d1502bc` | Cover moves into `drafts`; the page gets `drafts` / `onDraftChange` | tsc, lint, `NavMenu`, `BrandForm`, `CoverSection`, `BrandManualPage` (41 + 35 tests) |
| 3 | `f3fd7e1` | Logo | `LogoSection`, `NavMenu`, `BrandManualPage` (105 tests) |
| 4 | `72b332a` | Usage | `Usage`, `NavMenu`, `BrandManualPage` (56 tests) |
| 5 | `1f36b95` | Colors | `ColorPalette`, `NavMenu`, `BrandManualPage` (66 tests) |
| 6 | `89da6e9` | Typography; the last draft props are gone | `Typography`, `NavMenu`, `BrandManualPage` (61 tests), full `eslint .` |

The app kept working after every step: the new page props are optional, so the old and new ways lived side by side until the end. Each step removed the type imports it left unused (lint does not allow them), so the planned "cleanup step" was not needed.

## 8. Result

**Before**
```ts
const [coverDraft, setCoverDraft] = useState<CoverDraft>()
const [logoDraft, setLogoDraft] = useState<LogoDraft>()
// … 3 more
<BrandManualPage coverDraft={coverDraft} onCoverDraftChange={setCoverDraft} logoDraft={logoDraft} … />
```

**After**
```ts
const [drafts, setDrafts] = useState<Drafts>({})
const onDraftChange = useCallback(<K extends DraftKey>(key: K, draft: Drafts[K]) => {
  setDrafts((prev) => ({ ...prev, [key]: draft }))
}, [])
<BrandManualPage drafts={drafts} onDraftChange={onDraftChange} … />
```

- Page props for drafts: **10 → 2**. States in App: **5 → 1**.
- 3 files, +53 / −54 lines.
- **Not touched:** `useDraft`, the 5 forms (same `draft` / `onDraftChange` props), any test, the data states (`cover`, `logo`, `palette`…), `guides`.

## 9. Verification

- After every step: tsc, lint and the tests of that form.
- `npm run build` → OK.
- Full suite → **518 / 527 passed** (baseline: 514). The 9 failures are in `Export` (already failing in the baseline), `GeneratedPhoto` and `ImageBackground`. Run alone, those last two pass all 23 tests: timeouts under load.
- **No test file was changed.** The contract was checked by the same tests as before.
- Manual check by me in `npm run dev`: every form keeps what was typed after Home and back. ✅

**What could not be verified:** the slowest test files time out when the whole suite runs, so they prove nothing either way.

## 10. Week 9 checklist

- ☑ Named what the structure costs, not what it looks like
- ☑ Decided whether it was worth doing now, and why
- ☑ Had a baseline before changing anything
- ☑ Made one change at a time (one commit per form)
- ☑ Behaviour is the same, and I can point at what shows it (same tests, manual check)
- ☑ Asked my assistant for options before letting it edit anything
- ☑ Judged the proposed refactoring before applying it
- ☑ Checked whether any test was changed (none)

## 11. Next actions

- Make the slow tests reliable (`Export`, `CmykValues`, `PhotoMockups`, `GeneratedPhoto`, `ImageBackground`): a longer timeout or splitting them, so the suite is a real baseline.
- If a form is ever added: one key in `Drafts` (`src/utils/drafts.ts`) and one line in `sectionForms` (`BrandManualPage.tsx`).
- To undo a single form's step: `git revert <its commit>`.

---

# 🇪🇸 ESPAÑOL

## 1. Antecedentes: lo que pasó antes (3-11-2026)

Los 5 formularios (Portada, Logo, Usos, Colores, Tipografía) perdían lo escrito al ir a Home y volver.
Para arreglarlo, los campos de cada formulario pasaron a ser un **draft** que puede guardar `App`, porque `App` está por encima de las rutas y nunca se desmonta.

En el commit `d8beefa`, la lógica del draft que vivía en `BrandForm.tsx` (`useState` + `useRef latest` + `update()`) se **extrajo** a un hook pequeño, `src/utils/useDraft.ts`, y todos los formularios empezaron a usarlo.

> Nota honesta: `d8beefa` mezcló ese extract con un cambio de comportamiento (App pasó a guardar Tipografía). Lección: hacer el refactor en un commit separado del feature.

## 2. El problema (el costo, no el síntoma)

Después del 3-11, `App` tenía **un estado por formulario** (`coverDraft`, `logoDraft`, `usageDraft`, `colorsDraft`, `typographyDraft`).
`BrandManualPage` recibía **10 props** (un draft y su setter por formulario) solo para pasarlos. Nunca los leía.

```
App  ──10 props──▶  BrandManualPage  ──▶  5 formularios
```

**Costo:** agregar o cambiar un formulario obligaba a tocar 3 archivos (un `useState` en App, 2 props en el tipo de la página y el paso al formulario) y a releer código que solo hace de cartero.

## 3. ¿Valía la pena ahora?

- **Frecuencia de cambio:** alta. Los 5 formularios cambiaron en un solo día.
- **Costo en tiempo:** poco cada vez, pero repetido en 3 lugares.
- **Errores que facilita:** olvidar uno de los 2 props, y que un formulario deje de guardar sus campos sin avisar.
- **Cambio más chico:** un objeto en vez de 5 estados. **Operación:** juntar / mover.

## 4. Opciones evaluadas

| | Opción 1: un objeto `drafts` | Opción 2: un Context |
|---|---|---|
| Qué cambia | App guarda `drafts` + `onDraftChange(key, draft)`; la página recibe 2 props | Un `DraftsProvider`; cada formulario lee su draft con un hook; la página recibe 0 props |
| Props de draft en la página | 2 | 0 |
| Archivos a tocar por formulario nuevo | 2 | 1 |
| ¿Se ve la dependencia en los props? | Sí | No |
| Tamaño y riesgo | Chico, mecánico | Mediano, más código nuevo |

**Elegida: Opción 1.** Elimina casi toda la fricción con el menor código, no toca `useDraft` ni los formularios, se puede hacer de a un formulario y mantiene la dependencia visible en los props, como el resto de la app.
**Descartadas: la Opción 2** (más código, dependencia escondida, más difícil comprobar que no cambió el comportamiento) y reescribir todo el módulo de una vez.

## 5. El riesgo principal: orden y tiempo

Con un solo objeto compartido, el cambio de un formulario podía pisar el de otro si el código usaba una copia vieja.
**Prevención:** cada cambio es `setDrafts(prev => ({ ...prev, [key]: draft }))`, así siempre parte de la versión más nueva.
También se revisó que `useDraft` solo llama a `onDraftChange` al escribir (nunca dentro de un `useEffect`), así que la función nueva en cada render no cambia nada.

## 6. Baseline (antes de cambiar nada)

- `eslint .` → sin errores. `tsc -b` → sin errores.
- `npm test` → **514 / 527 pasan, 13 fallan.** Todos los fallos eran `Exceeded timeout`, en los archivos más lentos (`Export`, `CmykValues`, `PhotoMockups`). Son tests lentos e inestables, y no tienen relación con los drafts.
- Prueba manual: en cada formulario, escribir algo → Home → volver → sigue ahí.

## 7. Paso a paso

| Paso | Commit | Qué cambió | Comprobado con |
|---|---|---|---|
| 0 | — | Rama + baseline | lint, tsc, suite completa |
| 1 | `f8865e9` | Nuevo `src/utils/drafts.ts`: el tipo `Drafts`, todavía sin usar | tsc, lint |
| 2 | `d1502bc` | Portada pasa a `drafts`; la página recibe `drafts` / `onDraftChange` | tsc, lint, `NavMenu`, `BrandForm`, `CoverSection`, `BrandManualPage` (41 + 35 tests) |
| 3 | `f3fd7e1` | Logo | `LogoSection`, `NavMenu`, `BrandManualPage` (105 tests) |
| 4 | `72b332a` | Usos | `Usage`, `NavMenu`, `BrandManualPage` (56 tests) |
| 5 | `1f36b95` | Colores | `ColorPalette`, `NavMenu`, `BrandManualPage` (66 tests) |
| 6 | `89da6e9` | Tipografía; desaparecen los últimos props de draft | `Typography`, `NavMenu`, `BrandManualPage` (61 tests), `eslint .` completo |

La app siguió funcionando después de cada paso: los props nuevos de la página son opcionales, así que la forma vieja y la nueva convivieron hasta el final. Cada paso borró los imports de tipos que dejaba sin usar (el lint no los acepta), por eso no hizo falta el "paso de limpieza" del plan.

## 8. Resultado

**Antes**
```ts
const [coverDraft, setCoverDraft] = useState<CoverDraft>()
const [logoDraft, setLogoDraft] = useState<LogoDraft>()
// … 3 más
<BrandManualPage coverDraft={coverDraft} onCoverDraftChange={setCoverDraft} logoDraft={logoDraft} … />
```

**Después**
```ts
const [drafts, setDrafts] = useState<Drafts>({})
const onDraftChange = useCallback(<K extends DraftKey>(key: K, draft: Drafts[K]) => {
  setDrafts((prev) => ({ ...prev, [key]: draft }))
}, [])
<BrandManualPage drafts={drafts} onDraftChange={onDraftChange} … />
```

- Props de draft en la página: **10 → 2**. Estados en App: **5 → 1**.
- 3 archivos, +53 / −54 líneas.
- **Sin tocar:** `useDraft`, los 5 formularios (mismos props `draft` / `onDraftChange`), ningún test, los estados de datos (`cover`, `logo`, `palette`…), `guides`.

## 9. Verificación

- Después de cada paso: tsc, lint y los tests de ese formulario.
- `npm run build` → OK.
- Suite completa → **518 / 527 pasan** (baseline: 514). Los 9 fallos están en `Export` (ya fallaba en el baseline), `GeneratedPhoto` e `ImageBackground`. Corridos solos, esos dos últimos pasan los 23 tests: son timeouts por carga.
- **No se cambió ningún archivo de tests.** El comportamiento se comprobó con los mismos tests de antes.
- Prueba manual mía en `npm run dev`: cada formulario conserva lo escrito después de ir a Home y volver. ✅

**Lo que no se pudo verificar:** los archivos de tests más lentos se quedan sin tiempo al correr toda la suite, así que no prueban nada ni a favor ni en contra.

## 10. Checklist de la semana 9

- ☑ Nombré lo que me cuesta la estructura, no cómo se ve
- ☑ Decidí si valía la pena ahora, y por qué
- ☑ Tuve un baseline antes de cambiar nada
- ☑ Hice un cambio a la vez (un commit por formulario)
- ☑ El comportamiento es el mismo y puedo mostrar qué lo prueba (mismos tests, prueba manual)
- ☑ Pedí opciones a mi asistente antes de dejarlo editar
- ☑ Evalué el refactor propuesto antes de aplicarlo
- ☑ Revisé si se cambió algún test (ninguno)

## 11. Próximas acciones

- Hacer confiables los tests lentos (`Export`, `CmykValues`, `PhotoMockups`, `GeneratedPhoto`, `ImageBackground`), con más tiempo de espera o dividiéndolos, para que la suite sea un baseline real.
- Si algún día se agrega un formulario: una clave en `Drafts` (`src/utils/drafts.ts`) y una línea en `sectionForms` (`BrandManualPage.tsx`).
- Para deshacer el paso de un solo formulario: `git revert <su commit>`.
