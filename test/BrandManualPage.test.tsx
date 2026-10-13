import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { clickSave, fillRequiredCoverFields, pickSwatch, typeTitle } from './coverForm';

// The manual's pages, in order (the Logo section fills pages 2 to 5)
const ALL_PAGES = [
  'Cover',
  'Brand concept',
  'Anatomy',
  'Logo versions',
  'Clear space',
  'Color palette',
  'Typography',
];

function getPreview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function getSections() {
  return screen.getByRole('region', { name: 'Manual sections' });
}

function getCover() {
  return within(getPreview()).getByRole('article', { name: 'Cover' });
}

// Designed by and Logo are required too, so they are filled before every Save.
function clickSubmit() {
  fillRequiredCoverFields();
  clickSave();
}

// Spec: specs/brandmanual.md, Scenario 1 — Page Layout
describe('Brand Manual – layout', () => {
  it('shows the preview first (left) and the sections second (right)', () => {
    renderApp('/brand-manual');

    const isPreviewFirst =
      getPreview().compareDocumentPosition(getSections()) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(isPreviewFirst).toBeTruthy();
  });
});

// Spec: specs/brandmanual.md, Scenario 2 — All Sections Listed
describe('Brand Manual – sections column', () => {
  it('lists every section in order, all of them built', () => {
    renderApp('/brand-manual');

    const items = within(getSections()).getAllByRole('listitem');
    const headings = items.map((item) => within(item).getByRole('heading').textContent);
    expect(headings).toEqual(['1. Cover', '2. Logo', '3. Colors', '4. Typography']);

    // Built sections open with a click on their title (unbuilt ones have no button)
    for (const [index, item] of items.entries()) {
      expect(within(item).getByRole('button', { name: headings[index] as string })).toBeInTheDocument();
    }
  });

  it('puts the cover form inside the Cover section', () => {
    renderApp('/brand-manual');

    const [coverSection] = within(getSections()).getAllByRole('listitem');
    expect(within(coverSection).getByLabelText('Brand manual title')).toBeInTheDocument();
    expect(within(coverSection).getByLabelText('Designed by')).toBeInTheDocument();
    expect(within(coverSection).getByLabelText('Logo')).toBeInTheDocument();
  });
});

// Spec: specs/brandmanual.md, Scenario 3 — All Pages Previewed
describe('Brand Manual – preview column', () => {
  it('shows the seven manual pages in order', () => {
    renderApp('/brand-manual');

    const pages = within(getPreview()).getAllByRole('article');
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(ALL_PAGES);
  });
});

// Spec: specs/brandmanual.md, Scenario 4 — Cover Shows the Saved Title
describe('Brand Manual – cover preview', () => {
  it('shows the saved title with its style on the Cover', () => {
    // Given
    renderApp('/brand-manual');
    expect(getCover()).toHaveTextContent('Your brand manual title');
    typeTitle('My Brand');
    pickSwatch('Typography color', 'Blue');

    // When
    clickSubmit();

    // Then
    const title = within(getCover()).getByText('My Brand');
    expect(title).toHaveStyle({ color: '#1E88E5' });
    expect(getCover()).not.toHaveTextContent('Your brand manual title');
  });

  // Spec: specs/brandmanual.md, Scenario 5 — Preview Waits for Save
  it('does not change the Cover until Save is clicked', () => {
    renderApp('/brand-manual');

    typeTitle('My Brand');

    expect(getCover()).toHaveTextContent('Your brand manual title');
  });
});

// Spec: specs/brandmanual.md, Section 2 — Page Orientation
describe('Brand Manual – page orientation', () => {
  function getOrientationGroup() {
    return within(getPreview()).getByRole('group', { name: 'Page orientation' });
  }

  function getPageOrientations() {
    return within(getPreview())
      .getAllByRole('article')
      .map((page) => page.getAttribute('data-orientation'));
  }

  it('starts in Portrait', () => {
    renderApp('/brand-manual');

    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Portrait' })).toBeChecked();
    expect(getPageOrientations()).toEqual(Array(ALL_PAGES.length).fill('portrait'));
  });

  // Spec: specs/brandmanual.md, Scenario 6 — Changing the Page Orientation
  it('turns every page landscape when Landscape is selected, without Save', () => {
    // Given
    renderApp('/brand-manual');

    // When
    fireEvent.click(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' }));

    // Then
    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' })).toBeChecked();
    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Portrait' })).not.toBeChecked();
    expect(getPageOrientations()).toEqual(Array(ALL_PAGES.length).fill('landscape'));
  });

  // Spec: specs/brandmanual.md, Scenario 7 — Orientation Is Kept Between Pages
  it('keeps Landscape after going to Home and back', () => {
    // Given
    renderApp('/brand-manual');
    fireEvent.click(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' }));
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    // When
    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    // Then
    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' })).toBeChecked();
    expect(getPageOrientations()).toEqual(Array(ALL_PAGES.length).fill('landscape'));
  });
});

// Spec: specs/brandmanual.md, Section 2 — Preview View
describe('Brand Manual – preview view', () => {
  function getViewGroup() {
    return within(getPreview()).getByRole('group', { name: 'Preview view' });
  }

  function selectView(name: 'Grid' | 'Overview' | 'Pages') {
    fireEvent.click(within(getViewGroup()).getByRole('radio', { name }));
  }

  it('starts in Grid', () => {
    renderApp('/brand-manual');

    expect(within(getViewGroup()).getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'grid');
  });

  // Spec: specs/brandmanual.md, Scenario 8 — Changing the Preview View
  it('shows the pages one below the other when Pages is selected, without Save', () => {
    // Given
    renderApp('/brand-manual');
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));

    // When
    selectView('Pages');

    // Then
    expect(within(getViewGroup()).getByRole('radio', { name: 'Pages' })).toBeChecked();
    expect(within(getViewGroup()).getByRole('radio', { name: 'Grid' })).not.toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'pages');

    const pages = within(getPreview()).getAllByRole('article');
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(ALL_PAGES);
    expect(pages.map((page) => page.getAttribute('data-orientation'))).toEqual(Array(ALL_PAGES.length).fill('landscape'));
  });

  // Spec: specs/brandmanual.md, Scenario 8b — Overview Shows Four Pages Per Row
  it('shows every page in the Overview when it is selected, without Save', () => {
    // Given
    renderApp('/brand-manual');

    // When
    selectView('Overview');

    // Then
    expect(within(getViewGroup()).getByRole('radio', { name: 'Overview' })).toBeChecked();
    expect(within(getViewGroup()).getByRole('radio', { name: 'Grid' })).not.toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'overview');
    expect(
      within(getPreview())
        .getAllByRole('article')
        .map((page) => page.getAttribute('aria-label')),
    ).toEqual(ALL_PAGES);
  });

  // Spec: specs/brandmanual.md, Scenario 9 — Preview View Is Kept Between Pages
  it('keeps Pages after going to Home and back', () => {
    // Given
    renderApp('/brand-manual');
    selectView('Pages');
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    // When
    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    // Then
    expect(within(getViewGroup()).getByRole('radio', { name: 'Pages' })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'pages');
  });
});

// Spec: specs/brandmanual.md, Section 2 — Opening and Folding Sections (Scenarios 10 to 12)
describe('Brand Manual – sections accordion', () => {
  function getToggle(name: string) {
    return within(getSections()).getByRole('button', { name });
  }

  function expanded() {
    return ['1. Cover', '2. Logo', '3. Colors', '4. Typography'].map((name) =>
      getToggle(name).getAttribute('aria-expanded'),
    );
  }

  it('starts with only Cover open', () => {
    renderApp('/brand-manual');

    expect(expanded()).toEqual(['true', 'false', 'false', 'false']);
  });

  it('opens a section with a click on its title and folds the open one', () => {
    renderApp('/brand-manual');

    fireEvent.click(getToggle('3. Colors'));

    expect(expanded()).toEqual(['false', 'false', 'true', 'false']);
    const colorsBody = document.getElementById(getToggle('3. Colors').getAttribute('aria-controls') as string);
    expect(colorsBody).not.toHaveAttribute('inert');
    const coverBody = document.getElementById(getToggle('1. Cover').getAttribute('aria-controls') as string);
    expect(coverBody).toHaveAttribute('inert');
  });

  it('folds every section when the open one is clicked', () => {
    renderApp('/brand-manual');

    fireEvent.click(getToggle('1. Cover'));

    expect(expanded()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('keeps what was typed in a section while it is folded', () => {
    renderApp('/brand-manual');
    typeTitle('My Brand');

    fireEvent.click(getToggle('4. Typography'));
    fireEvent.click(getToggle('1. Cover'));

    expect(screen.getByLabelText('Brand manual title')).toHaveValue('My Brand');
  });
});
