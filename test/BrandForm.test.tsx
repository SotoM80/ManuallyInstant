import { fireEvent, render, screen } from '@testing-library/react';
import { BrandForm } from '../src/components/BrandForm';
import { DEFAULT_TITLE_STYLE } from '../src/data/titleOptions';
import { clickSave, fillRequiredCoverFields, typeTitle } from './coverForm';

function getInput() {
  return screen.getByLabelText('Brand manual title');
}

// Designed by and Logo are required too, so they are filled before every Save:
// these tests only look at the title.
function clickSubmit() {
  fillRequiredCoverFields();
  clickSave();
}

function sentTitle(title: string) {
  return expect.objectContaining({ title, style: DEFAULT_TITLE_STYLE });
}

// Spec: specs/titlefild.md, Section 2 — Interface
describe('BrandForm – interface', () => {
  it('renders an empty, enabled brand title field and a Save/Print button', () => {
    render(<BrandForm />);

    expect(getInput()).toHaveValue('');
    expect(getInput()).toBeEnabled();
    expect(screen.getByRole('button', { name: /save|print/i })).toBeInTheDocument();
  });
});

// Spec: specs/titlefild.md, Scenario 2 — Missing Title Validation Failure
describe('BrandForm – brand title validation', () => {
  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
    ['tabs and line breaks', '\t\n '],
  ])('shows "Required field" when the title is %s and the user submits', (_, value) => {
    // Given: the brand title input is empty or contains only whitespace
    render(<BrandForm />);
    const input = getInput();
    typeTitle(value);
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();

    // When: the user clicks the submit action button
    clickSubmit();

    // Then: the "Required field" validation error is displayed
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(input).toBeEnabled();
  });

  it('blocks the action: onSubmit is not called when the title is blank', () => {
    // Given
    const onSubmit = jest.fn();
    render(<BrandForm onSubmit={onSubmit} />);
    typeTitle('   ');

    // When
    clickSubmit();

    // Then
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the error beneath the input as an accessible alert', () => {
    // Given
    render(<BrandForm />);
    const input = getInput();

    // When
    clickSubmit();

    // Then
    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent('Required field');
    expect(input.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

// Spec: specs/titlefild.md, Scenario 1 — Successful Title Processing (postcondition: clean text)
describe('BrandForm – clean title submission', () => {
  it('calls onSubmit once with the trimmed title', () => {
    // Given
    const onSubmit = jest.fn();
    render(<BrandForm onSubmit={onSubmit} />);
    typeTitle('  My Brand  ');

    // When
    clickSubmit();

    // Then
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(sentTitle('My Brand'));
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
  });

  it.each([
    ['inner spaces', 'My   Brand'],
    ['accents', 'Café Ñandú'],
    ['symbols and emoji', 'Brand & Co. 🚀'],
  ])('keeps %s untouched', (_, value) => {
    // Given
    const onSubmit = jest.fn();
    render(<BrandForm onSubmit={onSubmit} />);
    typeTitle(value);

    // When
    clickSubmit();

    // Then
    expect(onSubmit).toHaveBeenCalledWith(sentTitle(value));
  });

  it('clears the error once the user fixes the title and submits again', () => {
    // Given: the error is visible
    const onSubmit = jest.fn();
    render(<BrandForm onSubmit={onSubmit} />);
    clickSubmit();
    expect(screen.getByText('Required field')).toBeInTheDocument();

    // When: the user types a valid title and submits again
    typeTitle('My Brand');
    clickSubmit();

    // Then: the error is gone and the title is sent
    expect(screen.queryByText('Required field')).not.toBeInTheDocument();
    expect(getInput()).toHaveAttribute('aria-invalid', 'false');
    expect(onSubmit).toHaveBeenCalledWith(sentTitle('My Brand'));
  });
});

// Motion: the Save button shakes when the form is not valid and pulses with a check when it is.
// jsdom does not run CSS animations, so the tests check the state the CSS reads.
describe('BrandForm – Save feedback', () => {
  function getSave() {
    return screen.getByRole('button', { name: /save|print/i });
  }

  it('starts idle', () => {
    render(<BrandForm />);

    expect(getSave()).toHaveAttribute('data-feedback', 'idle');
  });

  it('shakes when the form is not valid', () => {
    // Given: the title is empty
    render(<BrandForm />);

    // When
    clickSubmit();

    // Then
    expect(getSave()).toHaveAttribute('data-feedback', 'error');
  });

  it('pulses when the cover is saved, and keeps the name "Save"', () => {
    // Given
    render(<BrandForm onSubmit={jest.fn()} />);
    typeTitle('My Brand');

    // When
    clickSubmit();

    // Then: the check is decoration only, the accessible name does not change
    expect(getSave()).toHaveAttribute('data-feedback', 'saved');
    expect(getSave()).toHaveAccessibleName('Save');
  });

  it('goes back to idle when the animation ends, so the next Save animates again', () => {
    // Given
    render(<BrandForm />);
    clickSubmit();

    // When
    fireEvent.animationEnd(getSave());

    // Then
    expect(getSave()).toHaveAttribute('data-feedback', 'idle');
  });
});
