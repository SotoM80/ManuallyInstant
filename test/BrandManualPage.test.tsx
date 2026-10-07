import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';

function getPreview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function getSections() {
  return screen.getByRole('region', { name: 'Manual sections' });
}

function getCover() {
  return within(getPreview()).getByRole('article', { name: 'Cover' });
}

function typeTitle(value: string) {
  fireEvent.change(screen.getByLabelText(/brand title/i), { target: { value } });
}

function clickSubmit() {
  fireEvent.click(screen.getByRole('button', { name: /save|print/i }));
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
    expect(headings).toEqual(['1. Brand title', '2. Logo', '3. Colors', '4. Typography']);

    expect(within(items[0]).queryByText('Coming soon')).not.toBeInTheDocument();
    for (const item of items.slice(1)) {
      expect(within(item).getByText('Coming soon')).toBeInTheDocument();
    }
  });

  it('puts the brand title form inside the Brand title section', () => {
    renderApp('/brand-manual');

    const [brandTitleSection] = within(getSections()).getAllByRole('listitem');
    expect(within(brandTitleSection).getByLabelText(/brand title/i)).toBeInTheDocument();
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
    expect(getCover()).toHaveTextContent('Your brand title');
    typeTitle('My Brand');
    fireEvent.change(screen.getByRole('combobox', { name: 'Font color' }), {
      target: { value: 'Blue' },
    });
    fireEvent.click(screen.getByRole('option', { name: 'Blue' }));

    // When
    clickSubmit();

    // Then
    const title = within(getCover()).getByText('My Brand');
    expect(title).toHaveStyle({ color: '#1E88E5' });
    expect(getCover()).not.toHaveTextContent('Your brand title');
  });

  // Spec: specs/brandmanual.md, Scenario 5 — Preview Waits for Save
  it('does not change the Cover until Save is clicked', () => {
    renderApp('/brand-manual');

    typeTitle('My Brand');

    expect(getCover()).toHaveTextContent('Your brand title');
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
