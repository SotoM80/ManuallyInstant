import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrandForm } from '../src/components/BrandForm';
import App from '../src/App';

const FIELDS = ['Font family', 'Font color', 'Font style', 'Font size'];

function getField(name: string) {
  return screen.getByRole('combobox', { name });
}

function typeInto(name: string, value: string) {
  fireEvent.change(getField(name), { target: { value } });
}

function pickOption(name: string, option: string) {
  typeInto(name, option);
  fireEvent.click(screen.getByRole('option', { name: option }));
}

function typeTitle(value: string) {
  fireEvent.change(screen.getByLabelText(/brand title/i), { target: { value } });
}

function clickSubmit() {
  fireEvent.click(screen.getByRole('button', { name: /save|print/i }));
}

// Spec: titlefild.md, Section 2 — Interface + Predefined Options
describe('Title style – interface', () => {
  it('renders the four style fields with their default values', () => {
    render(<BrandForm />);

    expect(getField('Font family')).toHaveValue('Roboto');
    expect(getField('Font color')).toHaveValue('Black');
    expect(getField('Font style')).toHaveValue('Regular');
    expect(getField('Font size')).toHaveValue('Medium');
  });
});

// Spec: titlefild.md, Failure Modes — Inline Search & Typing Restrictions
describe('Title style – real-time filtering', () => {
  it('shows only the options that match what the user types', () => {
    // Given
    render(<BrandForm />);

    // When: the user types "bl" in Font color
    typeInto('Font color', 'bl');

    // Then: only Black and Blue are listed
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Black', 'Blue']);
  });

  it('shows "No results found" when nothing matches', () => {
    render(<BrandForm />);

    typeInto('Font family', 'Comic Sans');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('fills the field when the user clicks an option', () => {
    render(<BrandForm />);

    pickOption('Font style', 'Bold Italic');

    expect(getField('Font style')).toHaveValue('Bold Italic');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

// Spec: titlefild.md, Scenario 4 — Invalid Style Value on Focus Loss (Blur)
describe('Title style – invalid value', () => {
  it.each(FIELDS)('%s: shows an error with a red border on blur', (name) => {
    // Given: an invalid value is typed
    render(<BrandForm />);
    typeInto(name, 'zzz');

    // When: the user clicks outside the field
    fireEvent.blur(getField(name));

    // Then
    expect(getField(name)).toHaveAttribute('aria-invalid', 'true');
    expect(getField(name)).toHaveStyle({ borderColor: 'red' });
    expect(getField(name)).toHaveAccessibleDescription('Select a valid option');
  });

  it('shows the same error when the user presses Enter', () => {
    render(<BrandForm />);
    typeInto('Font size', 'Huge');

    fireEvent.keyDown(getField('Font size'), { key: 'Enter' });

    expect(getField('Font size')).toHaveAccessibleDescription('Select a valid option');
  });

  it('accepts a typed value that matches an option, ignoring case', () => {
    render(<BrandForm />);
    typeInto('Font style', 'bold');

    fireEvent.blur(getField('Font style'));

    expect(getField('Font style')).toHaveValue('Bold');
    expect(getField('Font style')).toHaveAttribute('aria-invalid', 'false');
  });
});

// Spec: titlefild.md, Scenario 3 — Missing Style Selection Validation Failure
describe('Title style – required fields', () => {
  it.each(FIELDS)('%s: blocks submit and shows "Required field" when blank', (name) => {
    // Given: a valid title, but this style field is empty
    const onSubmit = jest.fn();
    render(<BrandForm onSubmit={onSubmit} />);
    typeTitle('My Brand');
    typeInto(name, '');

    // When
    clickSubmit();

    // Then
    expect(onSubmit).not.toHaveBeenCalled();
    expect(getField(name)).toHaveStyle({ borderColor: 'red' });
    expect(getField(name)).toHaveAccessibleDescription('Required field');
  });
});

// Spec: titlefild.md, Scenario 1 — Successful Title Processing
describe('Title style – successful submit', () => {
  it('sends the title together with the selected style', () => {
    // Given
    const onSubmit = jest.fn();
    render(<BrandForm onSubmit={onSubmit} />);
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    pickOption('Font color', 'Blue');
    pickOption('Font style', 'Bold Italic');
    pickOption('Font size', 'Large');

    // When
    clickSubmit();

    // Then
    expect(onSubmit).toHaveBeenCalledWith('My Brand', {
      fontFamily: 'Open Sans',
      color: 'Blue',
      fontStyle: 'Bold Italic',
      fontSize: 'Large',
    });
  });
});

// Spec: titlefild.md, Scenario 1 — the header shows the style after Save
describe('Title style – header preview', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach((l) => l.remove());
  });

  it('applies the style to the header when the user clicks Save', () => {
    render(<App />);
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    pickOption('Font color', 'Blue');
    pickOption('Font style', 'Bold Italic');
    pickOption('Font size', 'Large');

    clickSubmit();

    const title = within(screen.getByRole('banner')).getByRole('heading');
    expect(title).toHaveStyle({
      color: '#1E88E5',
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontSize: '48px',
    });
    expect(title.style.fontFamily).toContain('Open Sans');
  });

  it('does not change the header before Save (not live)', () => {
    render(<App />);
    typeTitle('My Brand');
    clickSubmit();

    pickOption('Font size', 'Large');

    const title = within(screen.getByRole('banner')).getByRole('heading');
    expect(title).toHaveStyle({ fontSize: '32px' });
  });

  // Spec: titlefild.md, Scenario 5 — Font Style Is Visibly Applied
  it('requests the bold and italic font files so the style is really drawn', () => {
    // Given
    render(<App />);
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    pickOption('Font style', 'Bold Italic');

    // When
    clickSubmit();

    // Then: the header is bold italic...
    const title = within(screen.getByRole('banner')).getByRole('heading');
    expect(title).toHaveStyle({ fontWeight: 'bold', fontStyle: 'italic' });

    // ...and Google Fonts is asked for the bold and italic variants
    const link = document.head.querySelector('link[href*="family=Open+Sans"]');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700'),
    );
  });

  it('loads the font from Google Fonts only once', () => {
    render(<App />);
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    clickSubmit();
    clickSubmit();

    const links = document.head.querySelectorAll('link[href*="family=Open+Sans"]');
    expect(links).toHaveLength(1);
  });
});
