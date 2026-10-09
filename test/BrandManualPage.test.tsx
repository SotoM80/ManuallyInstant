import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { clickSave, fillRequiredCoverFields, pickSwatch, typeTitle } from './coverForm';

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
  it('lists every section in order, with the unbuilt ones marked "Coming soon"', () => {
    renderApp('/brand-manual');

    const items = within(getSections()).getAllByRole('listitem');
    const headings = items.map((item) => within(item).getByRole('heading').textContent);
    expect(headings).toEqual(['1. Cover', '2. Logo', '3. Colors', '4. Typography']);

    expect(within(items[0]).queryByText('Coming soon')).not.toBeInTheDocument();
    for (const item of items.slice(1)) {
      expect(within(item).getByText('Coming soon')).toBeInTheDocument();
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
  it('shows the four manual pages in order', () => {
    renderApp('/brand-manual');

    const pages = within(getPreview()).getAllByRole('article');
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual([
      'Cover',
      'Logo',
      'Color palette',
      'Typography',
    ]);
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
    expect(getPageOrientations()).toEqual(['portrait', 'portrait', 'portrait', 'portrait']);
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
    expect(getPageOrientations()).toEqual(['landscape', 'landscape', 'landscape', 'landscape']);
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
    expect(getPageOrientations()).toEqual(['landscape', 'landscape', 'landscape', 'landscape']);
  });
});

// Spec: specs/brandmanual.md, Section 2 — Preview View
describe('Brand Manual – preview view', () => {
  function getViewGroup() {
    return within(getPreview()).getByRole('group', { name: 'Preview view' });
  }

  function selectView(name: 'Grid' | 'Pages') {
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
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual([
      'Cover',
      'Logo',
      'Color palette',
      'Typography',
    ]);
    expect(pages.map((page) => page.getAttribute('data-orientation'))).toEqual([
      'landscape',
      'landscape',
      'landscape',
      'landscape',
    ]);
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
