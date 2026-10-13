import { fireEvent, render, screen, within } from '@testing-library/react';
import { LogoForm } from '../src/components/LogoForm';
import { LogoVersionsPage } from '../src/components/pages/LogoVersionsPage';
import { ClearSpacePage } from '../src/components/pages/ClearSpacePage';
import { renderApp } from './renderApp';
import type { LogoData } from '../src/types';
import { clickSave, fillRequiredCoverFields, makeLogo, typeTitle } from './coverForm';

// Spec: specs/logo.md — Logo section form
// Every part on, so the whole form can be tested (the app may still have some off).
const ALL_PARTS = { versions: true, clearSpace: true };

function renderForm() {
  const onSubmit = jest.fn();
  render(<LogoForm onSubmit={onSubmit} parts={ALL_PARTS} />);
  return onSubmit;
}

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

  it('saves everything typed, with the first version as the primary one', () => {
    const onSubmit = renderForm();
    fillValidForm();
    toggleMarkType('Isologo');

    click('Save');

    expect(onSubmit).toHaveBeenCalledWith({
      brandName: 'VOLTA',
      concept: 'Energy that moves cities.',
      marks: [
        { type: 'Imagotype', name: 'Lightning symbol', role: 'Conveys energy', image: null, parts: [] },
        { type: 'Isologo', name: '', role: '', image: null, parts: [] },
      ],
      variants: [
        { name: 'Horizontal', usage: 'for web', image: { url: 'blob:volta-h.png', name: 'volta-h.png' } },
      ],
      clearSpaceUnit: 'the height of the letter X',
      minDigitalPx: 32,
      minPrintMm: 15,
      grid: null,
    });
  });

  it('blocks Save and flags every empty required field', () => {
    const onSubmit = renderForm();

    click('Save');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(within(getForm()).getByLabelText('Brand name')).toHaveAttribute('aria-invalid', 'true');
    expect(within(getForm()).getByLabelText('Concept')).toHaveAttribute('aria-invalid', 'true');
    expect(within(getForm()).getByLabelText('Version 1 name')).toHaveAttribute('aria-invalid', 'true');
    expect(within(getForm()).getByLabelText('Version 1 image', { selector: 'input' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('opens the first version with an error so it can be seen', () => {
    renderForm();
    fillValidForm();
    click('Add version'); // Version 2 opens, Version 1 folds
    click('Version 2'); // fold it too

    click('Save');

    expect(versionHeader(2)).toHaveAttribute('aria-expanded', 'true');
  });

  it('flags a size that is not a number greater than 0', () => {
    const onSubmit = renderForm();
    fillValidForm();
    type('Min print size (mm)', '0');

    click('Save');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(within(getForm()).getByText('Enter a number greater than 0')).toBeInTheDocument();
  });

  it('flags a wrong image as soon as it is chosen', () => {
    renderForm();

    upload('Version 1 image', makeLogo('volta.pdf', 'application/pdf'));

    expect(within(getForm()).getByText('Use a PNG, JPG, SVG or WebP image')).toBeInTheDocument();
  });

  it('saves the optional construction grid when one is chosen', () => {
    const onSubmit = renderForm();
    fillValidForm();
    upload('Construction grid (optional)', makeLogo('grid.png'));

    click('Save');

    expect(onSubmit).toHaveBeenCalledWith(
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
});

// Spec: specs/logo.md — Parts built one at a time
describe('Logo section – parts not built yet', () => {
  it('shows Versions and Clear space as "Coming soon" and saves with the Concept only', () => {
    const onSubmit = jest.fn();
    render(<LogoForm onSubmit={onSubmit} parts={{ versions: false, clearSpace: false }} />);

    for (const name of ['Versions', 'Clear space & size']) {
      const group = within(getForm()).getByRole('group', { name });
      expect(group).toBeDisabled();
      expect(group).toHaveTextContent('Coming soon');
    }
    expect(within(getForm()).queryByLabelText('Version 1 name')).not.toBeInTheDocument();

    fillConcept();
    click('Save');

    expect(onSubmit).toHaveBeenCalledWith(
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
    const onSubmit = jest.fn();
    render(<LogoForm onSubmit={onSubmit} parts={{ versions: false, clearSpace: false }} />);
    fillConcept();
    toggleMarkType('Imagotype');

    click('Save');

    expect(onSubmit).not.toHaveBeenCalled();
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

    click('Save');

    const cards = within(getPage('Anatomy')).getByRole('list', { name: 'Marks of the brand' });
    const imagotype = within(cards).getByRole('listitem', { name: 'Imagotype' });
    expect(imagotype).toHaveTextContent('Lightning symbol');
    expect(imagotype).toHaveTextContent('Conveys energy');
    expect(within(cards).getByRole('img', { name: 'Bolt' })).toHaveAttribute('src', 'blob:symbol.png');
  });

  it('saves a card with nothing filled in, and shows it with its type only', () => {
    renderApp('/brand-manual');
    openLogoSection();
    type('Brand name', 'VOLTA');
    type('Concept', 'Energy that moves cities.');

    click('Save');

    const card = within(getPage('Anatomy')).getByRole('listitem', { name: 'Imagotype' });
    expect(card).toHaveTextContent('Imagotype');
    expect(within(card).queryByRole('img')).not.toBeInTheDocument();
  });

  // Spec: specs/logo.md — Parts of a mark (Isotype + Logotype + Tagline = Imagotype)
  it('adds up to 4 parts to a card, and saves only the ones with something in them', () => {
    const onSubmit = jest.fn();
    render(<LogoForm onSubmit={onSubmit} parts={{ versions: false, clearSpace: false }} />);
    fillConcept();

    click('Add part to Imagotype');
    type('Imagotype part 1 label', 'Isotype');
    upload('Imagotype part 1 image (optional)', makeLogo('symbol.png'));
    click('Add part to Imagotype');
    type('Imagotype part 2 name', 'Energy for all'); // no label → "Part 2"
    click('Add part to Imagotype'); // left empty → not saved
    click('Add part to Imagotype');
    expect(within(getForm()).getByRole('button', { name: 'Add part to Imagotype' })).toBeDisabled();

    click('Save');

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        marks: [
          expect.objectContaining({
            type: 'Imagotype',
            parts: [
              { label: 'Isotype', name: '', role: '', image: { url: 'blob:symbol.png', name: 'symbol.png' } },
              { label: 'Part 2', name: 'Energy for all', role: '', image: null },
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

    click('Save');

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

  it('shows the Brand concept and Anatomy placeholders, and "Coming soon" on the pages not built yet', () => {
    renderApp('/brand-manual');

    expect(getPage('Brand concept')).toHaveTextContent('Your brand concept');
    expect(getPage('Anatomy')).toHaveTextContent('Your anatomy');
    expect(getPage('Logo versions')).toHaveTextContent('Coming soon');
    expect(getPage('Clear space')).toHaveTextContent('Coming soon');
  });

  it('fills the Brand concept page (text) and the Anatomy page (marks) after Save', () => {
    renderApp('/brand-manual');
    openLogoSection();
    fillConcept();

    click('Save');

    const concept = getPage('Brand concept');
    expect(concept).toHaveTextContent('The identity of VOLTA is built on a clear idea:');
    expect(concept).toHaveTextContent('Energy that moves cities.');
    expect(concept).not.toHaveTextContent('Lightning symbol');

    const anatomy = getPage('Anatomy');
    expect(anatomy).toHaveTextContent('VOLTA is an Imagotype');
    expect(within(anatomy).getByText('Lightning symbol')).toBeInTheDocument();
    expect(within(anatomy).getByText('Conveys energy')).toBeInTheDocument();
    expect(getPage('Logo versions')).toHaveTextContent('Coming soon');
  });

  it('shows the Cover logo on the Brand concept page, or a box until the Cover is saved', () => {
    renderApp('/brand-manual');
    typeTitle('VOLTA manual');
    fillRequiredCoverFields(); // uploads logo.png
    openLogoSection();
    fillConcept();
    click('Save');

    // The Cover is filled in but not saved yet
    expect(within(getPage('Brand concept')).getByText('Logo of the Cover')).toBeInTheDocument();

    clickSave(); // the Cover form

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

    click('Save');

    const brand = within(getPage('Brand concept')).getByTitle(longName);
    expect(brand).toHaveClass('logo-cut');
  });
});

// The Logo versions and Clear space pages are ready for when their parts are turned on.
describe('Logo section – pages of the parts not built yet', () => {
  const image = (name: string) => ({ url: `blob:${name}`, name });
  const volta: LogoData = {
    brandName: 'VOLTA',
    concept: 'Energy that moves cities.',
    marks: [{ type: 'Imagotype', name: 'Lightning symbol', role: 'Conveys energy', image: null, parts: [] }],
    variants: [
      { name: 'Horizontal', usage: 'for web', image: image('volta-h.png') },
      { name: 'Symbol only', usage: 'for app icons', image: image('volta-s.png') },
    ],
    clearSpaceUnit: 'the height of the letter X',
    minDigitalPx: 32,
    minPrintMm: 15,
    grid: null,
  };

  it('Logo versions shows every version and its usage rule', () => {
    render(<LogoVersionsPage logo={volta} color="#000000" />);

    expect(screen.getByRole('img', { name: 'Horizontal version' })).toHaveAttribute('src', 'blob:volta-h.png');
    expect(screen.getByRole('img', { name: 'Symbol only version' })).toBeInTheDocument();
    expect(screen.getByText('Use the Symbol only version for app icons.')).toBeInTheDocument();
  });

  it('Clear space draws the diagram and states both minimum sizes', () => {
    const { container } = render(<ClearSpacePage logo={volta} color="#000000" />);

    expect(screen.getByRole('figure', { name: 'Clear space diagram' })).toBeInTheDocument();
    expect(container).toHaveTextContent('which equals the height of the letter X.');
    expect(container).toHaveTextContent('Construction grid'); // placeholder box, no grid uploaded
    expect(container).toHaveTextContent('32 px');
    expect(container).toHaveTextContent('15 mm');
  });
});
