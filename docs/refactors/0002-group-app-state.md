# Refactor 0002 — App's state in three groups

- **Date:** 2026-11-20 (planned on 2026-11-19)
- **Branch:** `refactor/group-app-state`, merged into `main` as `1a32ddb` (--no-ff)
- **Commits:** `2184e21` → `98c9632` (4 commits)
- **Files:** `src/App.tsx`, `src/pages/BrandManualPage.tsx`, `src/utils/appState.ts` (new)
- **Context:** reviewer feedback: *"App.tsx has a lot of states, which could perhaps be grouped together"*

---

# 🇬🇧 ENGLISH

## 1. Background

Refactor 0001 moved the 5 form drafts into one `drafts` object. The other states stayed one by one in `App`.

## 2. The problem (the cost, not the smell)

`App` kept **13 `useState`** and handed **26 props** to `BrandManualPage` (a value and its setter for each).

```
App  ──26 props──▶  BrandManualPage  ──▶  forms and preview
```

**Cost:** adding a section meant touching 3 places (a `useState` in App, 2 props in the page's type, the hand-off). The long prop list hid which values belong together.

## 3. Was it worth doing now?

- **How often it changes:** often. New sections and settings were added almost every week (ADRs 0031–0038).
- **Mistakes it makes likely:** forgetting a prop, so a setting silently stops working.
- **Smallest change:** the same operation as 0001 (merge / move), three times.
- **Honest note:** App was only 116 lines and readable. The gain is order and less plumbing, not a fix.

## 4. Options considered

| | Option 1: 3 objects + `useGroup` | Option 2: `useReducer` | Option 3: a Context |
|---|---|---|---|
| What it changes | 3 state objects, one `change(key, value)` each | One reducer with actions | A provider; the forms read it with hooks |
| Page props | 26 → 8 | 26 → 2 | 26 → 0 |
| Dependency visible in props? | Yes | Yes | No |
| Size and risk | Small, mechanical | Medium (action types) | Medium, hidden dependency |

**Chosen: Option 1.** Same pattern as `drafts`, can be done one group at a time, keeps the dependency visible.

## 5. The groups

| Group | Fields | What it is |
|---|---|---|
| `content` | cover, logo, usage, palette, typography, mockups, guides | what goes into the PDF |
| `design` | template, skin | how the pages look (never the content) |
| `view` | orientation, previewView, followSection | the preview on screen, never exported |
| `drafts` | (from 0001, untouched) | what each form shows |

The types live in `src/utils/appState.ts`, not in `src/types.ts`: `src/skins/types.ts` already imports from `src/types.ts`, so putting `Skin` there would make the two files import each other.

## 6. The main risks

1. **One change undoing another.** Every change goes through `setGroup(prev => ({ ...prev, [key]: value }))`, so it starts from the newest object (as `onDraftChange` does).
2. **Skin updates made from the newest skin.** `onSkinChange(prev => …)` is used for the chip outline and the section backgrounds and spacing (ADR 0025). `useGroup` takes a value **or** a function (`Update<T>`, like React's `setState`). No field holds a function, so a function is always an update.
3. **Callbacks that change identity.** The old setters never changed. `pendingImage.ts` keeps an `onChange` in an effect's dependencies, so the page builds `onCoverChange`, `onSkinChange`… inside `useMemo`, and they stay stable too.

Inside the page, the groups are taken apart into the **same names as before** (`cover`, `onCoverChange`, `onSkinChange`…), so the rest of the page and every child component are unchanged.

## 7. Step by step

| Step | Commit | What changed | Checked with |
|---|---|---|---|
| 1 | `2184e21` | New `src/utils/appState.ts`: types, initial values, `useGroup` (not used yet) | tsc, lint |
| 2 | `a1be247` | Content (7 states → 1) | tsc, lint, full suite |
| 3 | `c2d47d4` | Design (template + skin → 1) | tsc, lint, 17 skin/template files (225 tests) |
| 4 | `98c9632` | View (3 states → 1) | tsc, lint, full suite |

## 8. Result

**Before**
```ts
const [cover, setCover] = useState<CoverData | null>(null)
const [logo, setLogo] = useState<LogoData | null>(null)
// … 11 more
<BrandManualPage cover={cover} onCoverChange={setCover} logo={logo} … /> // 26 props
```

**After**
```ts
const [content, onContentChange] = useGroup(NO_CONTENT)
const [drafts, setDrafts] = useState<Drafts>({})
const [view, onViewChange] = useGroup(DEFAULT_VIEW)
const [design, onDesignChange] = useGroup(DEFAULT_DESIGN)
<BrandManualPage content={content} onContentChange={onContentChange} … /> // 8 props
```

- States in App: **13 → 4**. Page props: **26 → 8**.
- 3 files, +147 / −107 lines (most of the new lines are the types and comments in `appState.ts`).
- **Not touched:** any child component, `drafts`, any test.

## 9. Verification

- After every step: `tsc -b` and `eslint` with no errors.
- Full suite after step 2: 618 / 621; after step 4: 614 / 621. **Every failure was `Exceeded timeout`**, in the slow files already named in 0001 (`Export`, `PhotoMockups`, `SkinImageLayer`). The machine was under heavy load (load average ≈ 18).
- Run alone, those files pass. `Export` and `PhotoMockups` also pass alone on the code **without** the change (23 / 23 both ways). The one `Export` test that failed in a lone run passes when run by itself.
- **No test file was changed.**
- `npm run test:e2e` → **3 / 3 passed** (every page in every view, 3 templates, Landscape and Portrait; extra mockup pages).
- Manual check by me in `npm run dev`: forms kept after Home and back, template, skin, view settings, both PDFs. ✅

**What could not be verified:** the slow files time out under load, so the full suite proves nothing about them either way.

## 10. Checklist

- ☑ Named what the structure costs, not what it looks like
- ☑ Decided whether it was worth doing now, and said honestly that the gain is moderate
- ☑ Made one change at a time (one commit per group)
- ☑ Behaviour is the same, shown by the same tests
- ☑ Checked whether any test was changed (none)
- ☑ e2e (3 / 3)
- ☑ Manual check

## 11. Next actions

- Make the slow tests reliable (still open from 0001).
- A new section: one field in `ManualContent` and its initial value in `NO_CONTENT` (`src/utils/appState.ts`).
- To undo: `git revert -m 1 1a32ddb`.

---

# 🇪🇸 ESPAÑOL

## 1. Antecedentes

El Refactor 0001 juntó los 5 drafts de los formularios en un objeto `drafts`. Los demás estados siguieron sueltos en `App`.

## 2. El problema (el costo, no el síntoma)

`App` tenía **13 `useState`** y pasaba **26 props** a `BrandManualPage` (un valor y su setter por cada uno).

```
App  ──26 props──▶  BrandManualPage  ──▶  formularios y vista previa
```

**Costo:** agregar una sección obligaba a tocar 3 lugares (un `useState` en App, 2 props en el tipo de la página y el paso de las props). La lista larga escondía qué valores van juntos.

## 3. ¿Valía la pena ahora?

- **Frecuencia de cambio:** alta. Casi cada semana se agregaron secciones y ajustes (ADR 0031–0038).
- **Errores que facilita:** olvidar una prop, y que un ajuste deje de funcionar sin avisar.
- **Cambio más chico:** la misma operación que en el 0001 (juntar / mover), tres veces.
- **Nota honesta:** App tenía solo 116 líneas y se leía bien. La ganancia es orden y menos plumbing, no un arreglo.

## 4. Opciones evaluadas

| | Opción 1: 3 objetos + `useGroup` | Opción 2: `useReducer` | Opción 3: un Context |
|---|---|---|---|
| Qué cambia | 3 objetos de estado, cada uno con `change(key, value)` | Un reducer con acciones | Un provider; los formularios lo leen con hooks |
| Props de la página | 26 → 8 | 26 → 2 | 26 → 0 |
| ¿Se ve la dependencia en los props? | Sí | Sí | No |
| Tamaño y riesgo | Chico, mecánico | Mediano (tipos de acción) | Mediano, dependencia escondida |

**Elegida: Opción 1.** Mismo patrón que `drafts`, se puede hacer de a un grupo y mantiene visible la dependencia.

## 5. Los grupos

| Grupo | Campos | Qué es |
|---|---|---|
| `content` | cover, logo, usage, palette, typography, mockups, guides | lo que sale en el PDF |
| `design` | template, skin | cómo se ven las páginas (nunca el contenido) |
| `view` | orientation, previewView, followSection | la vista previa en pantalla, nunca se exporta |
| `drafts` | (del 0001, sin tocar) | lo que muestra cada formulario |

Los tipos están en `src/utils/appState.ts` y no en `src/types.ts`: `src/skins/types.ts` ya importa de `src/types.ts`, así que poner `Skin` ahí haría que los dos archivos se importen el uno al otro.

## 6. Los riesgos principales

1. **Que un cambio pise a otro.** Todo cambio pasa por `setGroup(prev => ({ ...prev, [key]: value }))`, así parte siempre del objeto más nuevo (como `onDraftChange`).
2. **Cambios del skin hechos desde el skin más nuevo.** `onSkinChange(prev => …)` se usa para el contorno de los chips y para los fondos y el espaciado por sección (ADR 0025). `useGroup` acepta un valor **o** una función (`Update<T>`, como el `setState` de React). Ningún campo guarda una función, así que una función es siempre un cambio.
3. **Callbacks que cambian de identidad.** Los setters de antes nunca cambiaban. `pendingImage.ts` tiene un `onChange` en las dependencias de un efecto, así que la página crea `onCoverChange`, `onSkinChange`… dentro de `useMemo`, y también se mantienen estables.

Dentro de la página, los grupos se separan en **los mismos nombres de antes** (`cover`, `onCoverChange`, `onSkinChange`…), así el resto de la página y todos los componentes hijos quedan igual.

## 7. Paso a paso

| Paso | Commit | Qué cambió | Comprobado con |
|---|---|---|---|
| 1 | `2184e21` | Nuevo `src/utils/appState.ts`: tipos, valores iniciales, `useGroup` (sin usar) | tsc, lint |
| 2 | `a1be247` | Contenido (7 estados → 1) | tsc, lint, suite completa |
| 3 | `c2d47d4` | Diseño (template + skin → 1) | tsc, lint, 17 archivos de skin/plantillas (225 tests) |
| 4 | `98c9632` | Vista (3 estados → 1) | tsc, lint, suite completa |

## 8. Resultado

**Antes**
```ts
const [cover, setCover] = useState<CoverData | null>(null)
const [logo, setLogo] = useState<LogoData | null>(null)
// … 11 más
<BrandManualPage cover={cover} onCoverChange={setCover} logo={logo} … /> // 26 props
```

**Después**
```ts
const [content, onContentChange] = useGroup(NO_CONTENT)
const [drafts, setDrafts] = useState<Drafts>({})
const [view, onViewChange] = useGroup(DEFAULT_VIEW)
const [design, onDesignChange] = useGroup(DEFAULT_DESIGN)
<BrandManualPage content={content} onContentChange={onContentChange} … /> // 8 props
```

- Estados en App: **13 → 4**. Props de la página: **26 → 8**.
- 3 archivos, +147 / −107 líneas (la mayoría de las nuevas son tipos y comentarios en `appState.ts`).
- **Sin tocar:** ningún componente hijo, `drafts`, ningún test.

## 9. Verificación

- Después de cada paso: `tsc -b` y `eslint` sin errores.
- Suite completa después del paso 2: 618 / 621; después del paso 4: 614 / 621. **Todos los fallos fueron `Exceeded timeout`**, en los archivos lentos ya nombrados en el 0001 (`Export`, `PhotoMockups`, `SkinImageLayer`). La máquina estaba muy cargada (carga media ≈ 18).
- Corridos solos, esos archivos pasan. `Export` y `PhotoMockups` también pasan solos con el código **sin** el cambio (23 / 23 en los dos casos). El único test de `Export` que falló corriendo el archivo solo pasa al correrlo aislado.
- **No se cambió ningún archivo de tests.**
- `npm run test:e2e` → **3 / 3 pasan** (todas las páginas en todas las vistas, 3 plantillas, horizontal y vertical; páginas extra de mockups).
- Prueba manual mía en `npm run dev`: formularios conservados al ir a Home y volver, plantilla, skin, ajustes de vista, los 2 PDF. ✅

**Lo que no se pudo verificar:** los archivos lentos se quedan sin tiempo con carga, así que la suite completa no prueba nada sobre ellos ni a favor ni en contra.

## 10. Checklist

- ☑ Nombré lo que cuesta la estructura, no cómo se ve
- ☑ Decidí si valía la pena ahora, y dije con honestidad que la ganancia es moderada
- ☑ Hice un cambio a la vez (un commit por grupo)
- ☑ El comportamiento es el mismo, y lo prueban los mismos tests
- ☑ Revisé si se cambió algún test (ninguno)
- ☑ e2e (3 / 3)
- ☑ Prueba manual

## 11. Próximas acciones

- Hacer confiables los tests lentos (sigue abierto desde el 0001).
- Una sección nueva: un campo en `ManualContent` y su valor inicial en `NO_CONTENT` (`src/utils/appState.ts`).
- Para deshacer: `git revert -m 1 1a32ddb`.
