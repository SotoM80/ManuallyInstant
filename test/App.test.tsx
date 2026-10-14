import { screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { clickApply, fillRequiredCoverFields, typeTitle } from './coverForm';

const EMPTY_COVER = 'Your brand manual title';

// The title is shown on the Cover page of the manual preview.
function getCover() {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', {
    name: 'Cover',
  });
}

// The title slot of the Cover (the Cover also shows the logo and "Designed by").
function getCoverTitle() {
  return getCover().querySelector('.cover-title');
}

// Fills Designed by and a logo, and applies the logo (text is already live).
function clickSubmit() {
  fillRequiredCoverFields();
  clickApply();
}

// Spec: specs/titlefild.md, Scenario 1 — Successful Title Processing
describe('App – brand title preview', () => {
  it('shows the clean brand title on the Cover while typing, with no button', () => {
    // Given
    renderApp();
    expect(getCover()).toHaveTextContent(EMPTY_COVER);

    // When: the user types
    typeTitle('  My Brand  ');

    // Then: no error, and the clean title populates the Cover
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
    expect(getCoverTitle()?.textContent).toBe('My Brand');
  });

  it('replaces the previous title with a new one', () => {
    // Given: a title is already shown
    renderApp();
    typeTitle('First Brand');

    // When: the user types a different title
    typeTitle('Second Brand');

    // Then
    expect(getCoverTitle()?.textContent).toBe('Second Brand');
  });
});

// Spec: specs/titlefild.md, Scenario 2 — Blank title
describe('App – blank title', () => {
  it('shows the placeholder again, with no error, when the title is cleared', () => {
    renderApp();
    typeTitle('My Brand');

    typeTitle('');

    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
    expect(getCover()).toHaveTextContent(EMPTY_COVER);
  });
});

// Spec: specs/titlefild.md, Section 2 — Interface (Cover Preview) + Section 4 — Invariants
describe('App – where the title is shown', () => {
  it('never shows the brand title in the site header', () => {
    renderApp();
    typeTitle('My Brand');
    clickSubmit();

    expect(screen.getByRole('banner')).not.toHaveTextContent('My Brand');
  });

  it('keeps the Cover as the first page, both empty and populated', () => {
    renderApp();
    const firstPage = () =>
      within(screen.getByRole('region', { name: 'Manual preview' })).getAllByRole('article')[0];

    // Empty
    expect(firstPage()).toBe(getCover());

    // Populated
    typeTitle('My Brand');
    clickSubmit();
    expect(firstPage()).toBe(getCover());
  });
});

// Spec: specs/titlefild.md, Out of Scope — no persistence
describe('App – title is not persisted', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not write the title to localStorage', () => {
    // Given
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    renderApp();

    // When
    typeTitle('My Brand');
    clickSubmit();

    // Then
    expect(setItem).not.toHaveBeenCalled();
  });

  it('resets the Cover after a reload (unmount and mount again)', () => {
    // Given: a title is shown
    const { unmount } = renderApp();
    typeTitle('My Brand');
    clickSubmit();
    expect(getCoverTitle()?.textContent).toBe('My Brand');

    // When: the page is "reloaded"
    unmount();
    renderApp();

    // Then
    expect(getCover()).toHaveTextContent(EMPTY_COVER);
  });
});
