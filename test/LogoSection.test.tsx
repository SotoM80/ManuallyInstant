import { fireEvent, render, screen, within } from '@testing-library/react';
import { LogoForm } from '../src/components/LogoForm';
import { LogoVersionsPage } from '../src/components/pages/LogoVersionsPage';
import { ClearSpacePage } from '../src/components/pages/ClearSpacePage';
import { findVisibleBounds } from '../src/utils/visibleBounds';
import { parseRuler } from '../src/utils/rulers';
import { gapLabel, guideCuts, snapGuide, toggleGuide } from '../src/utils/guides';
import { renderApp } from './renderApp';
import type { LogoData } from '../src/types';
import type { LogoParts } from '../src/data/manualSections';
import { clickApply, fillRequiredCoverFields, getApplyButton, makeLogo, typeTitle, uploadLogo } from './coverForm';

function uploadCoverLogo(name: string) {
  uploadLogo(makeLogo(name));
}

// Spec: specs/logo.md — Logo section form
// Every part on, so the whole form can be tested (the app may still have some off).
const ALL_PARTS = { versions: true, clearSpace: true };

// The Apply buttons of the form that are on: one per image field waiting (ADR 0020)
function applyButtonsOn() {
  return within(getForm())
    .queryAllByRole('button', { name: /^Apply / })
    .filter((button) => !(button as HTMLButtonElement).disabled);
}

// Renders the form alone. `apply()` clicks every Apply that is on, so each test can show all its
// new images at once; `pending()` says whether any image still waits.
function renderForm(parts: LogoParts = ALL_PARTS) {
  const onChange = jest.fn();
  render(<LogoForm onChange={onChange} parts={parts} />);
  function apply() {
    applyButtonsOn().forEach((button) => fireEvent.click(button));
  }
  const pending = () => applyButtonsOn().length > 0;
  return { onChange, pending, apply };
}

const NO_PARTS = { versions: false, clearSpace: false };

function getForm() {
  return screen.getByRole('form', { name: 'Logo' });
}

function type(label: string, value: string) {
  fireEvent.change(within(getForm()).getByLabelText(label), { target: { value } });
}

function upload(label: string, file: File) {
  fireEvent.change(within(getForm()).getByLabelText(label, { selector: 'input' }), {
    target: { files: [file] },
  });
}

function click(name: string) {
  fireEvent.click(within(getForm()).getByRole('button', { name }));
}

function versionHeader(n: number) {
  return within(getForm()).getByRole('button', { name: `Version ${n}` });
}

// Imagotype is ticked by default; its card is optional, but filled here.
function fillConcept() {
  type('Brand name', 'VOLTA');
  type('Concept', 'Energy that moves cities.');
  type('Imagotype name', 'Lightning symbol');
  type('Imagotype role', 'Conveys energy');
}

function toggleMarkType(name: string) {
  const group = within(getForm()).getByRole('group', { name: 'Mark type' });
  fireEvent.click(within(group).getByRole('checkbox', { name }));
}

function fillValidForm() {
  fillConcept();
  type('Version 1 name', 'Horizontal');
  type('Version 1 use for', 'for web');
  upload('Version 1 image', makeLogo('volta-h.png'));
}

describe('Logo section – form', () => {
  it('has a group per page, with Imagotype and the sizes chosen by default', () => {
    renderForm();

    for (const name of ['Concept', 'Anatomy', 'Versions', 'Clear space & size']) {
      expect(within(getForm()).getByRole('group', { name })).toBeInTheDocument();
    }
    const markType = within(getForm()).getByRole('group', { name: 'Mark type' });
    expect(within(markType).getByRole('checkbox', { name: 'Imagotype' })).toBeChecked();
    expect(within(markType).getByRole('checkbox', { name: 'Isotype / Brandmark' })).not.toBeChecked();
    expect(within(getForm()).getByLabelText('Unit X')).toHaveValue('the height of the letter X');
    expect(within(getForm()).getByLabelText('Min digital size (px)')).toHaveValue('32');
    expect(within(getForm()).getByLabelText('Min print size (mm)')).toHaveValue('15');
    expect(versionHeader(1)).toHaveAttribute('aria-expanded', 'true');
  });

  it('sends everything typed at once, and the image after Apply', () => {
    const { onChange, apply } = renderForm();
    fillValidForm();
    toggleMarkType('Isologo');
    apply();

    expect(onChange).toHaveBeenLastCalledWith({
      brandName: 'VOLTA',
      concept: 'Energy that moves cities.',
      marks: [
        { type: 'Imagotype', name: 'Lightning symbol', role: 'Conveys energy', image: null, background: null, parts: [] },
        { type: 'Isologo', name: '', role: '', image: null, background: null, parts: [] },
      ],
      variants: [
        { id: 0, name: 'Horizontal', usage: 'for web', image: { url: 'blob:volta-h.png', name: 'volta-h.png' }, background: null },
      ],
      clearSpaceUnit: 'the height of the letter X',
      minDigitalPx: 32,
      minPrintMm: 15,
      grid: null,
      gridModules: 16,
      gridX: 1,
      rulerTop: [],
      rulerSide: [],
    });
  });

  it('sends the text before Apply, with the new image still waiting', () => {
    const { onChange, pending } = renderForm();

    fillValidForm();

    expect(pending()).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        brandName: 'VOLTA',
        variants: [{ id: 0, name: 'Horizontal', usage: 'for web', image: null, background: null }],
      }),
    );
  });

  it('has nothing pending once its Apply is pressed', () => {
    const { pending } = renderForm();
    upload('Version 1 image', makeLogo('volta-h.png'));

    fireEvent.click(within(getForm()).getByRole('button', { name: 'Apply Version 1 image' }));

    expect(pending()).toBe(false);
  });

  it('shows no "Required field" errors for empty fields', () => {
    renderForm();
    type('Brand name', 'VOLTA');
    type('Brand name', '');

    expect(within(getForm()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('flags a size that is not a number greater than 0, as it is typed', () => {
    renderForm();

    type('Min print size (mm)', '0');

    expect(within(getForm()).getByText('Enter a number greater than 0')).toBeInTheDocument();
  });

  it('flags a wrong image as soon as it is chosen, and does not wait for Apply', () => {
    const { pending } = renderForm();

    upload('Version 1 image', makeLogo('volta.pdf', 'application/pdf'));

    expect(within(getForm()).getByText('Use a PNG, JPG, SVG or WebP image')).toBeInTheDocument();
    expect(pending()).toBe(false);
  });

  it('sends the optional construction grid after Apply', () => {
    const { onChange, apply } = renderForm();
    fillValidForm();
    upload('Construction grid (optional)', makeLogo('grid.png'));

    apply();

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ grid: { url: 'blob:grid.png', name: 'grid.png' } }),
    );
  });

  it('adds versions as an accordion, up to 4', () => {
    renderForm();

    click('Add version');

    expect(versionHeader(1)).toHaveAttribute('aria-expanded', 'false');
    expect(versionHeader(2)).toHaveAttribute('aria-expanded', 'true');

    click('Add version');
    click('Add version');
    expect(within(getForm()).getByRole('button', { name: 'Add version' })).toBeDisabled();
  });

  // Spec: specs/logoversions.md, Invariants — and specs/mockups.md (a mockup points at a version)
  it('keeps the id of every version when another one is removed', () => {
    const { onChange } = renderForm();
    click('Add version');
    click('Add version');
    for (const [n, name] of [[1, 'Horizontal'], [2, 'Negative'], [3, 'Symbol']] as const) {
      fireEvent.change(within(getForm()).getByLabelText(`Version ${n} name`), { target: { value: name } });
    }
    const before = onChange.mock.lastCall[0].variants as { id: number; name: string }[];
    expect(new Set(before.map((variant) => variant.id)).size).toBe(3);

    click('Remove Version 2');

    const after = onChange.mock.lastCall[0].variants as { id: number; name: string }[];
    expect(after.map((variant) => variant.name)).toEqual(['Horizontal', 'Symbol']);
    expect(after.map((variant) => variant.id)).toEqual([before[0].id, before[2].id]);
  });
});

// Spec: specs/logo.md — Parts built one at a time
describe('Logo section – parts not built yet', () => {
  it('shows Versions and Clear space as "Coming soon" and sends the Concept only', () => {
    const { onChange } = renderForm(NO_PARTS);

    for (const name of ['Versions', 'Clear space & size']) {
      const group = within(getForm()).getByRole('group', { name });
      expect(group).toBeDisabled();
      expect(group).toHaveTextContent('Coming soon');
    }
    expect(within(getForm()).queryByLabelText('Version 1 name')).not.toBeInTheDocument();

    fillConcept();

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ brandName: 'VOLTA', variants: [], grid: null }),
    );
  });
});

// Spec: specs/logo.md — Mark types and their cards
describe('Logo section – mark cards', () => {
  function getPage(name: string) {
    const preview = screen.getByRole('region', { name: 'Manual preview' });
    return within(preview).getByRole('article', { name });
  }

  function openLogoSection() {
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
  }

  function cardsInForm() {
    return within(getForm())
      .getAllByRole('group')
      .filter((group) => group.classList.contains('logo-mark-card'))
      .map((group) => group.querySelector('legend')?.textContent);
  }

  it('creates a card for each ticked mark type, in a fixed order', () => {
    render(<LogoForm parts={{ versions: false, clearSpace: false }} />);

    toggleMarkType('Isotype / Brandmark');
    toggleMarkType('Logotype / Wordmark');

    expect(cardsInForm()).toEqual(['Logotype / Wordmark', 'Imagotype', 'Isotype / Brandmark']);

    toggleMarkType('Imagotype');
    expect(cardsInForm()).toEqual(['Logotype / Wordmark', 'Isotype / Brandmark']);
  });

  it('needs at least one mark type', () => {
    renderForm(NO_PARTS);
    fillConcept();

    toggleMarkType('Imagotype');

    expect(within(getForm()).getByText('Choose at least one mark type')).toBeInTheDocument();
  });

  it('keeps what was typed in a card while its type is unticked', () => {
    render(<LogoForm parts={{ versions: false, clearSpace: false }} />);
    type('Imagotype name', 'Lightning symbol');

    toggleMarkType('Imagotype');
    toggleMarkType('Imagotype');

    expect(within(getForm()).getByLabelText('Imagotype name')).toHaveValue('Lightning symbol');
  });

  it('shows a card for each mark type on the page', () => {
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();
    toggleMarkType('Isotype / Brandmark');
    upload('Isotype image (optional)', makeLogo('symbol.png'));
    type('Isotype name', 'Bolt');

    clickApply('Apply Isotype image');

    const cards = within(getPage('Anatomy')).getByRole('list', { name: 'Marks of the brand' });
    const imagotype = within(cards).getByRole('listitem', { name: 'Imagotype' });
    expect(imagotype).toHaveTextContent('Lightning symbol');
    expect(imagotype).toHaveTextContent('Conveys energy');
    expect(within(cards).getByRole('img', { name: 'Bolt' })).toHaveAttribute('src', 'blob:symbol.png');
  });

  it('shows a card with nothing filled in with its type only', () => {
    renderApp('/brand-manual');
    openLogoSection();
    type('Brand name', 'VOLTA');
    type('Concept', 'Energy that moves cities.');

    const card = within(getPage('Anatomy')).getByRole('listitem', { name: 'Imagotype' });
    expect(card).toHaveTextContent('Imagotype');
    expect(within(card).queryByRole('img')).not.toBeInTheDocument();
  });

  // Spec: specs/logo.md — Parts of a mark (Isotype + Logotype + Tagline = Imagotype)
  it('adds up to 4 parts to a card, and sends only the ones with something in them', () => {
    const { onChange, apply } = renderForm(NO_PARTS);
    fillConcept();

    click('Add part to Imagotype');
    type('Imagotype part 1 label', 'Isotype');
    upload('Imagotype part 1 image (optional)', makeLogo('symbol.png'));
    click('Add part to Imagotype');
    type('Imagotype part 2 name', 'Energy for all'); // no label → "Part 2"
    click('Add part to Imagotype'); // left empty → not sent
    click('Add part to Imagotype');
    expect(within(getForm()).getByRole('button', { name: 'Add part to Imagotype' })).toBeDisabled();

    apply();

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        marks: [
          expect.objectContaining({
            type: 'Imagotype',
            parts: [
              { label: 'Isotype', name: '', role: '', image: { url: 'blob:symbol.png', name: 'symbol.png' }, background: null },
              { label: 'Part 2', name: 'Energy for all', role: '', image: null, background: null },
            ],
          }),
        ],
      }),
    );
  });

  it('removes a part', () => {
    render(<LogoForm parts={{ versions: false, clearSpace: false }} />);
    click('Add part to Imagotype');

    click('Remove Imagotype part 1');

    expect(within(getForm()).queryByLabelText('Imagotype part 1 label')).not.toBeInTheDocument();
  });

  it('shows a mark with parts as a sum on the page: parts + … = mark', () => {
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();
    click('Add part to Imagotype');
    type('Imagotype part 1 label', 'Isotype');
    click('Add part to Imagotype');
    type('Imagotype part 2 label', 'Tagline');

    const row = within(getPage('Anatomy')).getByRole('listitem', { name: 'Imagotype' });
    const parts = within(row).getByRole('list', { name: 'Parts of the Imagotype' });
    expect(parts).toHaveTextContent('Isotype');
    expect(parts).toHaveTextContent('+');
    expect(parts).toHaveTextContent('Tagline');
    expect(row).toHaveTextContent('=');
  });

  it('flags a wrong card image as soon as it is chosen', () => {
    render(<LogoForm parts={{ versions: false, clearSpace: false }} />);

    upload('Imagotype image (optional)', makeLogo('mark.pdf', 'application/pdf'));

    expect(within(getForm()).getByText('Use a PNG, JPG, SVG or WebP image')).toBeInTheDocument();
  });
});

// Spec: specs/logo.md — Logo pages in the preview
describe('Logo section – preview pages', () => {
  function getPage(name: string) {
    const preview = screen.getByRole('region', { name: 'Manual preview' });
    return within(preview).getByRole('article', { name });
  }

  function openLogoSection() {
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
  }

  it('shows the placeholder of every Logo page before the section is touched', () => {
    renderApp('/brand-manual');

    expect(getPage('Brand concept')).toHaveTextContent('Your brand concept');
    expect(getPage('Anatomy')).toHaveTextContent('Your anatomy');
    expect(getPage('Logo versions')).toHaveTextContent('Your logo versions');
    expect(getPage('Clear space')).toHaveTextContent('Your clear space');
  });

  it('fills the Brand concept page (text) and the Anatomy page (marks) as it is typed', () => {
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();

    const concept = getPage('Brand concept');
    expect(concept).toHaveTextContent('The identity of VOLTA is built on a clear idea:');
    expect(concept).toHaveTextContent('Energy that moves cities.');
    expect(concept).not.toHaveTextContent('Lightning symbol');

    const anatomy = getPage('Anatomy');
    expect(anatomy).toHaveTextContent('VOLTA is an Imagotype');
    expect(within(anatomy).getByText('Lightning symbol')).toBeInTheDocument();
    expect(within(anatomy).getByText('Conveys energy')).toBeInTheDocument();
  });

  // Spec: specs/logoversions.md
  it('fills the Logo versions page as the versions are typed', () => {
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();

    type('Version 1 name', 'Horizontal');
    type('Version 1 use for', 'for web and long stationery');

    const versions = getPage('Logo versions');
    expect(versions).toHaveTextContent('The Horizontal version is the master configuration of VOLTA.');
    expect(versions).toHaveTextContent('Use the Horizontal version for web and long stationery.');
  });

  it('shows the Cover logo as the Primary version until it has its own image', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();
    type('Version 1 name', 'Horizontal');

    const versions = getPage('Logo versions');
    expect(within(versions).getByRole('img', { name: 'Horizontal version' })).toHaveAttribute('src', 'blob:cover.png');

    upload('Version 1 image', makeLogo('volta-h.png'));
    clickApply('Apply Version 1 image');

    expect(within(versions).getByRole('img', { name: 'Horizontal version' })).toHaveAttribute('src', 'blob:volta-h.png');
  });

  it('shows the Cover logo on the Brand concept page, or a box until it is applied', () => {
    renderApp('/brand-manual');
    typeTitle('VOLTA manual');
    fillRequiredCoverFields(); // chooses logo.png
    openLogoSection();
    fillConcept();

    // The Cover logo is chosen but not applied yet
    expect(within(getPage('Brand concept')).getByText('Logo of the Cover')).toBeInTheDocument();

    clickApply();

    expect(within(getPage('Brand concept')).getByRole('img', { name: 'VOLTA logo' })).toHaveAttribute(
      'src',
      'blob:logo.png',
    );
  });

  it('cuts long names with "…" and keeps the full name in the tooltip', () => {
    const longName = 'VOLTA Energy Solutions International Corporation Worldwide';
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();
    type('Brand name', longName);

    const brand = within(getPage('Brand concept')).getByTitle(longName);
    expect(brand).toHaveClass('logo-cut');
  });
});

// Spec: docs/adr/0020 — one Apply next to each image
describe('Logo section – Apply button', () => {
  it('turns the card\'s Apply on when its image is chosen, and shows it only after it', () => {
    renderApp('/brand-manual');
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
    fillConcept();
    expect(getApplyButton('Apply Imagotype image')).toBeDisabled();

    upload('Imagotype image (optional)', makeLogo('mark.png'));

    const preview = screen.getByRole('region', { name: 'Manual preview' });
    const anatomy = within(preview).getByRole('article', { name: 'Anatomy' });
    expect(getApplyButton('Apply Imagotype image')).toBeEnabled();
    expect(within(anatomy).queryByRole('img')).not.toBeInTheDocument();

    clickApply('Apply Imagotype image');

    expect(within(anatomy).getByRole('img', { name: 'Lightning symbol' })).toHaveAttribute('src', 'blob:mark.png');
    expect(getApplyButton('Apply Imagotype image')).toBeDisabled();
  });
});

// The Logo versions and Clear space pages, drawn on their own
describe('Logo section – Logo versions and Clear space pages', () => {
  const image = (name: string) => ({ url: `blob:${name}`, name });
  const volta: LogoData = {
    brandName: 'VOLTA',
    concept: 'Energy that moves cities.',
    marks: [{ type: 'Imagotype', name: 'Lightning symbol', role: 'Conveys energy', image: null, background: null, parts: [] }],
    variants: [
      { id: 0, name: 'Horizontal', usage: 'for web', image: image('volta-h.png'), background: null },
      { id: 1, name: 'Symbol only', usage: 'for app icons', image: image('volta-s.png'), background: null },
    ],
    clearSpaceUnit: 'the height of the letter X',
    minDigitalPx: 32,
    minPrintMm: 15,
    grid: null,
    gridModules: 16,
    gridX: 1,
    rulerTop: [],
    rulerSide: [],
  };

  it('Logo versions shows every version and its usage rule', () => {
    render(<LogoVersionsPage logo={volta} coverLogo={null} color="#000000" />);

    expect(screen.getByRole('img', { name: 'Horizontal version' })).toHaveAttribute('src', 'blob:volta-h.png');
    expect(screen.getByRole('img', { name: 'Symbol only version' })).toBeInTheDocument();
    expect(screen.getByText('Use the Symbol only version for app icons.')).toBeInTheDocument();
  });

  it('Logo versions never leaves a gap in its sentences while fields are empty', () => {
    const empty: LogoData = {
      ...volta,
      brandName: '',
      variants: [
        { id: 0, name: '', usage: '', image: null, background: null },
        { id: 1, name: '', usage: 'for app icons', image: null, background: null },
      ],
    };
    render(<LogoVersionsPage logo={empty} coverLogo={null} color="#000000" />);

    expect(screen.getByText(/^The Primary version is the master configuration of the brand\./)).toBeInTheDocument();
    expect(screen.getByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('Use the Version 2 version for app icons.')).toBeInTheDocument();
  });

  it('Logo versions shows a placeholder when no version says where it is used', () => {
    const noUsage: LogoData = { ...volta, variants: [{ id: 0, name: 'Horizontal', usage: '', image: null, background: null }] };
    render(<LogoVersionsPage logo={noUsage} coverLogo={null} color="#000000" />);

    expect(screen.getByText('Where each version is used')).toBeInTheDocument();
  });

  it('Clear space draws the diagram and states both minimum sizes', () => {
    const { container } = render(<ClearSpacePage logo={volta} coverLogo={null} color="#000000" />);

    expect(screen.getByRole('figure', { name: 'Clear space diagram' })).toBeInTheDocument();
    expect(container).toHaveTextContent('which equals the height of the letter X.');
    expect(container).toHaveTextContent('Construction grid'); // placeholder box, no grid uploaded
    expect(container).toHaveTextContent('32 px');
    expect(container).toHaveTextContent('15 mm');
  });

  it('Clear space keeps its sentence whole while Unit X is empty', () => {
    const { container } = render(
      <ClearSpacePage logo={{ ...volta, clearSpaceUnit: '  ' }} coverLogo={null} color="#000000" />,
    );

    expect(container).toHaveTextContent('which equals the height of the letter X.');
  });
});

// Spec: specs/clearspace.md
describe('Logo section – Clear space page', () => {
  function getPage() {
    const preview = screen.getByRole('region', { name: 'Manual preview' });
    return within(preview).getByRole('article', { name: 'Clear space' });
  }

  function openLogoSection() {
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
  }

  it('fills the page as the unit and the sizes are typed', () => {
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();

    type('Unit X', 'the width of the symbol');
    type('Min digital size (px)', '48');
    type('Min print size (mm)', '20');

    expect(getPage()).toHaveTextContent('which equals the width of the symbol.');
    expect(getPage()).toHaveTextContent('The minimum size is 48 px high.');
    expect(getPage()).toHaveTextContent('The minimum size is 20 mm high.');
  });

  it('keeps the last valid size while a size is wrong, and flags the field', () => {
    renderApp('/brand-manual');
    openLogoSection();
    type('Min digital size (px)', '48');

    type('Min digital size (px)', '0');

    expect(within(getForm()).getByText('Enter a number greater than 0')).toBeInTheDocument();
    expect(getPage()).toHaveTextContent('The minimum size is 48 px high.');
    expect(getPage()).not.toHaveTextContent('0 px');
  });

  it('draws the Cover logo in the diagram until the Primary version has its own image', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();
    type('Brand name', 'VOLTA');

    const diagram = within(getPage()).getByRole('figure', { name: 'Clear space diagram' });
    expect(within(diagram).getByRole('img', { name: 'Primary version' })).toHaveAttribute('href', 'blob:cover.png');
  });

  it('shows the construction grid only after Apply', () => {
    renderApp('/brand-manual');
    openLogoSection();
    type('Brand name', 'VOLTA');

    upload('Construction grid (optional)', makeLogo('grid.png'));
    expect(within(getPage()).queryByRole('img', { name: 'Construction grid' })).not.toBeInTheDocument();

    clickApply('Apply Construction grid');
    expect(within(getPage()).getByRole('img', { name: 'Construction grid' })).toHaveAttribute('src', 'blob:grid.png');
  });
});

// Spec: specs/clearspace.md — 3.2 Construction grid drawn by the app
describe('Logo section – construction grid', () => {
  function getPage() {
    const preview = screen.getByRole('region', { name: 'Manual preview' });
    return within(preview).getByRole('article', { name: 'Clear space' });
  }

  function openLogoSection() {
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
  }

  // A 4 × 4 image whose only drawn pixels are the 2 × 1 block at columns 1–2, row 2
  function pixels() {
    const data = new Uint8ClampedArray(4 * 4 * 4);
    for (const [x, y] of [[1, 2], [2, 2]]) data[(y * 4 + x) * 4 + 3] = 255;
    return data;
  }

  it('finds the drawn part of a logo, ignoring its transparent margins', () => {
    expect(findVisibleBounds(pixels(), 4, 4)).toEqual({ x: 0.25, y: 0.5, width: 0.5, height: 0.25, ratio: 1 });
  });

  it('uses the whole image when nothing is transparent, or nothing is drawn', () => {
    expect(findVisibleBounds(new Uint8ClampedArray(2 * 1 * 4).fill(255), 2, 1)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      ratio: 2,
    });
    expect(findVisibleBounds(new Uint8ClampedArray(4 * 4 * 4), 4, 4)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      ratio: 1,
    });
  });

  it('draws a grid over the Cover logo when no grid is uploaded, 16 modules by default', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();
    type('Brand name', 'VOLTA');

    const grid = within(getPage()).getByRole('img', { name: 'Generated construction grid' });
    expect(grid).toHaveAttribute('data-modules', '16');
  });

  it('changes the density with Grid modules', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();

    fireEvent.click(within(within(getForm()).getByRole('group', { name: 'Grid modules' })).getByRole('radio', { name: '24' }));

    expect(within(getPage()).getByRole('img', { name: 'Generated construction grid' })).toHaveAttribute(
      'data-modules',
      '24',
    );
  });

  it('prefers an uploaded grid over the drawn one', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();

    upload('Construction grid (optional)', makeLogo('grid.png'));
    clickApply('Apply Construction grid');

    expect(within(getPage()).getByRole('img', { name: 'Construction grid' })).toBeInTheDocument();
    expect(within(getPage()).queryByRole('img', { name: 'Generated construction grid' })).not.toBeInTheDocument();
  });

  it('uses the same X for the grid margin (3.2) and the clear space (3.1)', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();

    fireEvent.click(within(within(getForm()).getByRole('group', { name: 'X (modules)' })).getByRole('radio', { name: '2' }));

    expect(within(getPage()).getByRole('img', { name: 'Generated construction grid' })).toHaveAttribute('data-x', '2');
    // The clear space diagram is drawn in the same modules, with the same X
    const diagram = within(getPage()).getByRole('figure', { name: 'Clear space diagram' });
    expect(diagram.querySelector('svg')).toHaveAttribute('data-x', '2');
    expect(diagram.querySelector('svg')).toHaveAttribute('viewBox', '0 0 20 20');
  });

  it('goes back to the drawn grid when the uploaded one is removed', () => {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    openLogoSection();
    upload('Construction grid (optional)', makeLogo('grid.png'));
    clickApply('Apply Construction grid');

    click('Remove grid');

    expect(within(getPage()).getByRole('img', { name: 'Generated construction grid' })).toBeInTheDocument();
    expect(within(getForm()).queryByRole('button', { name: 'Remove grid' })).not.toBeInTheDocument();
  });

  it('turns Grid modules off while an uploaded grid is shown, and says why', () => {
    renderApp('/brand-manual');
    openLogoSection();
    const modules = within(getForm()).getByRole('group', { name: 'Grid modules' });
    expect(modules).toBeEnabled();
    expect(within(getForm()).getByText('Drawn from your logo (Cover or Version 1). No upload needed.')).toBeInTheDocument();

    upload('Construction grid (optional)', makeLogo('grid.png'));
    expect(within(getForm()).getByText('Click Apply to show this grid instead of the one drawn from your logo.')).toBeInTheDocument();

    clickApply('Apply Construction grid');
    expect(modules).toBeDisabled();
    expect(within(getForm()).getByText(/Your uploaded grid is shown/)).toBeInTheDocument();

    click('Remove grid');
    expect(modules).toBeEnabled();
  });

  it('shows the striped placeholder when there is no logo at all', () => {
    renderApp('/brand-manual');
    openLogoSection();
    type('Brand name', 'VOLTA');

    expect(within(getPage()).queryByRole('img', { name: 'Generated construction grid' })).not.toBeInTheDocument();
    expect(getPage()).toHaveTextContent('Construction grid');
  });
});

// Spec: specs/clearspace.md — rulers of the construction grid
describe('Logo section – grid rulers', () => {
  function getPage() {
    const preview = screen.getByRole('region', { name: 'Manual preview' });
    return within(preview).getByRole('article', { name: 'Clear space' });
  }

  function getGrid() {
    return within(getPage()).getByRole('img', { name: 'Generated construction grid' });
  }

  function setup() {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
  }

  it('reads a sequence of steps in X', () => {
    expect(parseRuler('X 1.5X X 1.5X X')).toEqual([1, 1.5, 1, 1.5, 1]);
    expect(parseRuler('  2x · 0,5X ')).toEqual([2, 0.5]);
    expect(parseRuler('')).toEqual([]);
    expect(parseRuler('X 1.5Y')).toBeNull();
    expect(parseRuler('0X')).toBeNull();
  });

  it('draws the top ruler with a label for each step', () => {
    setup();

    type('Top ruler', 'X 1.5X X');

    const ruler = getGrid().querySelector('[data-ruler="top"]') as SVGElement;
    expect(Array.from(ruler.querySelectorAll('text')).map((t) => t.textContent)).toEqual(['X', '1.5X', 'X']);
  });

  it('makes the rulers follow X', () => {
    setup();
    type('Side ruler', 'X 1.5X');
    // How long the side ruler is, in modules
    const length = () => Number(getGrid().querySelector('[data-ruler="side"]')?.getAttribute('data-length'));
    expect(length()).toBe(2.5); // X = 1 module: 1 + 1.5

    fireEvent.click(within(within(getForm()).getByRole('group', { name: 'X (modules)' })).getByRole('radio', { name: '2' }));

    expect(length()).toBe(5); // X = 2 modules: the same steps, twice as long
  });

  it('flags a step it cannot read, and keeps the last valid ruler', () => {
    setup();
    type('Top ruler', 'X 2X');

    type('Top ruler', 'X 2Y');

    expect(within(getForm()).getByText('Use steps like X, 1.5X or 2X, separated by spaces')).toBeInTheDocument();
    const ruler = getGrid().querySelector('[data-ruler="top"]') as SVGElement;
    expect(Array.from(ruler.querySelectorAll('text')).map((t) => t.textContent)).toEqual(['X', '2X']);
  });

  it('draws no ruler while its field is empty', () => {
    setup();
    type('Brand name', 'VOLTA');

    expect(getGrid().querySelector('[data-ruler="top"], [data-ruler="side"]')).toBeNull();
  });
});

// Experiment (option 3): guides clicked on the construction grid
describe('Logo section – clicked guides', () => {
  function getGrid() {
    const preview = screen.getByRole('region', { name: 'Manual preview' });
    const page = within(preview).getByRole('article', { name: 'Clear space' });
    return within(page).getByRole('img', { name: 'Generated construction grid' });
  }

  function labels(ruler: 'top' | 'side' | 'width' | 'height') {
    return Array.from(getGrid().querySelectorAll(`[data-ruler="${ruler}"] text`)).map((t) => t.textContent);
  }

  // jsdom has no layout: each band is placed on screen 0–160px wide (and tall)
  function clickBand(band: 'top' | 'side', at: number) {
    const element = getGrid().querySelector(`[data-band="${band}"]`) as SVGRectElement;
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 160, height: 160 }) as DOMRect;
    fireEvent.click(element, band === 'top' ? { clientX: at } : { clientY: at });
  }

  function setup() {
    renderApp('/brand-manual');
    uploadCoverLogo('cover.png');
    clickApply();
    const sections = screen.getByRole('region', { name: 'Manual sections' });
    fireEvent.click(within(sections).getByRole('button', { name: '2. Logo' }));
    type('Brand name', 'VOLTA');
  }

  it('snaps a guide to half modules and labels each gap in X', () => {
    expect(snapGuide(3.3, 16)).toBe(3.5);
    expect(snapGuide(-2, 16)).toBe(0);
    expect(toggleGuide([2], 6)).toEqual([2, 6]);
    expect(toggleGuide([2, 6], 2)).toEqual([6]);
    expect(guideCuts([4, 10], 16, 1)).toEqual([1, 5, 11, 17]);
    expect(gapLabel(3, 2)).toBe('1.5X');
    expect(gapLabel(2, 2)).toBe('X');
  });

  it('adds a guide where the top band is clicked, and labels the gaps of the logo in X', () => {
    setup();

    // The 16-module band is 160px wide: a click at 40px is 4 modules from the logo's left edge
    clickBand('top', 40);

    expect(labels('top')).toEqual(['4X', '12X']);
  });

  it('relabels the gaps when X changes, with the guide in the same place', () => {
    setup();
    clickBand('top', 40);

    fireEvent.click(within(within(getForm()).getByRole('group', { name: 'X (modules)' })).getByRole('radio', { name: '2' }));

    expect(labels('top')).toEqual(['2X', '6X']);
  });

  it('shows the logo\'s overall width and height in X outside the grid', () => {
    setup();

    // jsdom reads no pixels, so the logo is taken as square: 16 modules wide and tall
    expect(labels('width')).toEqual(['16X']);
    expect(labels('height')).toEqual(['16X']);

    fireEvent.click(within(within(getForm()).getByRole('group', { name: 'X (modules)' })).getByRole('radio', { name: '2' }));

    expect(labels('width')).toEqual(['8X']);
  });

  it('removes a guide when it is clicked', () => {
    setup();
    clickBand('top', 40);

    fireEvent.click(getGrid().querySelector('[data-guide="vertical"]') as Element);

    expect(getGrid().querySelector('[data-ruler="top"]')).toBeNull();
  });
});

// Spec: specs/brandmanual.md, Scenario 5b — each Apply shows only its image (ADR 0020)
describe('Logo section – one Apply per image', () => {
  it('shows only the image of the Apply clicked', () => {
    const { onChange } = renderForm();
    fireEvent.click(within(getForm()).getByRole('button', { name: 'Add version' }));
    upload('Version 1 image', makeLogo('volta-h.png'));
    upload('Version 2 image', makeLogo('volta-v.png'));
    const versionImages = () => (onChange.mock.lastCall![0] as LogoData).variants.map((variant) => variant.image?.name ?? null);

    fireEvent.click(within(getForm()).getByRole('button', { name: 'Apply Version 1 image' }));

    expect(versionImages()).toEqual(['volta-h.png', null]);
    expect(within(getForm()).getByRole('button', { name: 'Apply Version 1 image' })).toBeDisabled();
    expect(within(getForm()).getByRole('button', { name: 'Apply Version 2 image' })).toBeEnabled();

    fireEvent.click(within(getForm()).getByRole('button', { name: 'Apply Version 2 image' }));

    expect(versionImages()).toEqual(['volta-h.png', 'volta-v.png']);
  });

  it('keeps every Apply off until its field has a new valid image', () => {
    renderForm();

    upload('Construction grid (optional)', makeLogo('grid.pdf', 'application/pdf'));

    expect(within(getForm()).getByRole('button', { name: 'Apply Construction grid' })).toBeDisabled();
    expect(within(getForm()).getByRole('button', { name: 'Apply Imagotype image' })).toBeDisabled();
    expect(within(getForm()).getByRole('button', { name: 'Apply Version 1 image' })).toBeDisabled();
  });

  it('turns the Apply off again when the image shown is chosen once more', () => {
    renderForm();
    const grid = makeLogo('grid.png');
    upload('Construction grid (optional)', grid);
    fireEvent.click(within(getForm()).getByRole('button', { name: 'Apply Construction grid' }));

    upload('Construction grid (optional)', makeLogo('other.png'));
    upload('Construction grid (optional)', grid);

    expect(within(getForm()).getByRole('button', { name: 'Apply Construction grid' })).toBeDisabled();
  });
});
