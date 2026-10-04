import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

function typeTitle(value: string) {
  fireEvent.change(screen.getByLabelText(/brand title/i), { target: { value } });
}

function clickSubmit() {
  fireEvent.click(screen.getByRole('button', { name: /save|print/i }));
}

// Spec: titlefild.md, Scenario 1 — Successful Title Processing
describe('App – brand title preview', () => {
  it('shows the brand title in the top header after a valid submit', () => {
    // Given: the user has typed a valid title
    render(<App />);
    const header = screen.getByRole('banner');
    expect(header.textContent).toBe('');
    typeTitle('  My Brand  ');

    // When: the user clicks the submit action button
    clickSubmit();

    // Then: no error, and the clean title populates the header
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
    expect(header.textContent).toBe('My Brand');
  });

  it('does not update the header while typing, only after clicking', () => {
    // Given
    render(<App />);

    // When: the user types but does not click
    typeTitle('My Brand');

    // Then
    expect(screen.getByRole('banner').textContent).toBe('');
  });

  it('replaces the previous title with a new valid one', () => {
    // Given: a title is already shown
    render(<App />);
    typeTitle('First Brand');
    clickSubmit();

    // When: the user submits a different title
    typeTitle('Second Brand');
    clickSubmit();

    // Then
    expect(screen.getByRole('banner').textContent).toBe('Second Brand');
  });
});

// Spec: titlefild.md, Scenario 2 — Missing Title Validation Failure
describe('App – blank title is blocked', () => {
  it('keeps the header empty when the title is blank', () => {
    render(<App />);

    clickSubmit();

    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.getByRole('banner').textContent).toBe('');
  });

  it('keeps the previous title in the header when a blank title is submitted', () => {
    // Given: a valid title is shown
    render(<App />);
    typeTitle('My Brand');
    clickSubmit();

    // When: the user clears the field and submits
    typeTitle('');
    clickSubmit();

    // Then: the action is blocked and the header is unchanged
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.getByRole('banner').textContent).toBe('My Brand');
  });
});

// Spec: titlefild.md, Section 4 — Invariants
describe('App – header position invariant', () => {
  it('renders the header before the form, both empty and populated', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    const isBeforeForm = () =>
      Boolean(header.compareDocumentPosition(screen.getByRole('main')) & Node.DOCUMENT_POSITION_FOLLOWING);

    // Empty
    expect(header).toBeInTheDocument();
    expect(isBeforeForm()).toBe(true);

    // Populated
    typeTitle('My Brand');
    clickSubmit();
    expect(screen.getByRole('banner')).toBe(header);
    expect(isBeforeForm()).toBe(true);
  });
});

// Spec: titlefild.md, Out of Scope — no persistence
describe('App – title is not persisted', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not write the title to localStorage', () => {
    // Given
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    render(<App />);

    // When
    typeTitle('My Brand');
    clickSubmit();

    // Then
    expect(setItem).not.toHaveBeenCalled();
  });

  it('resets the header after a reload (unmount and mount again)', () => {
    // Given: a title is shown
    const { unmount } = render(<App />);
    typeTitle('My Brand');
    clickSubmit();
    expect(screen.getByRole('banner').textContent).toBe('My Brand');

    // When: the page is "reloaded"
    unmount();
    render(<App />);

    // Then
    expect(screen.getByRole('banner').textContent).toBe('');
  });
});
