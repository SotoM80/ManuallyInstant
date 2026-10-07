import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';

const EMPTY_COVER = 'Your brand title';

// The saved title is shown on the Cover page of the manual preview.
function getCover() {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', {
    name: 'Cover',
  });
}

function typeTitle(value: string) {
  fireEvent.change(screen.getByLabelText(/brand title/i), { target: { value } });
}

function clickSubmit() {
  fireEvent.click(screen.getByRole('button', { name: /save|print/i }));
}

// Spec: specs/titlefild.md, Scenario 1 — Successful Title Processing
describe('App – brand title preview', () => {
  it('shows the brand title on the Cover after a valid submit', () => {
    // Given: the user has typed a valid title
    renderApp();
    expect(getCover()).toHaveTextContent(EMPTY_COVER);
    typeTitle('  My Brand  ');

    // When: the user clicks the submit action button
    clickSubmit();

    // Then: no error, and the clean title populates the Cover
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
    expect(getCover().textContent).toBe('My Brand');
  });

  it('does not update the Cover while typing, only after clicking', () => {
    // Given
    renderApp();

    // When: the user types but does not click
    typeTitle('My Brand');

    // Then
    expect(getCover()).toHaveTextContent(EMPTY_COVER);
  });

  it('replaces the previous title with a new valid one', () => {
    // Given: a title is already shown
    renderApp();
    typeTitle('First Brand');
    clickSubmit();

    // When: the user submits a different title
    typeTitle('Second Brand');
    clickSubmit();

    // Then
    expect(getCover().textContent).toBe('Second Brand');
  });
});

// Spec: specs/titlefild.md, Scenario 2 — Missing Title Validation Failure
describe('App – blank title is blocked', () => {
  it('keeps the Cover empty when the title is blank', () => {
    renderApp();

    clickSubmit();

    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(getCover()).toHaveTextContent(EMPTY_COVER);
  });

  it('keeps the previous title on the Cover when a blank title is submitted', () => {
    // Given: a valid title is shown
    renderApp();
    typeTitle('My Brand');
    clickSubmit();

    // When: the user clears the field and submits
    typeTitle('');
    clickSubmit();

    // Then: the action is blocked and the Cover is unchanged
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(getCover().textContent).toBe('My Brand');
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
    expect(getCover().textContent).toBe('My Brand');

    // When: the page is "reloaded"
    unmount();
    renderApp();

    // Then
    expect(getCover()).toHaveTextContent(EMPTY_COVER);
  });
});
