import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrandForm } from '../src/components/BrandForm';
import { renderApp } from './renderApp';
import { pickSwatch, typeTitle } from './coverForm';

// The title color is now the Typography color picker (see ColorPicker.test.tsx).
const FIELDS = ['Font family', 'Font style', 'Font size'];

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

// Spec: specs/titlefild.md, Section 2 — Interface + Predefined Options
describe('Title style – interface', () => {
  it('renders the three style fields with their default values', () => {
    render(<BrandForm />);

    expect(getField('Font family')).toHaveValue('Roboto');
    expect(getField('Font style')).toHaveValue('Regular');
    expect(getField('Font size')).toHaveValue('Medium');
  });
});

// Spec: specs/titlefild.md, Failure Modes — Inline Search & Typing Restrictions
describe('Title style – real-time filtering', () => {
  it('shows only the options that match what the user types', () => {
    // Given
    render(<BrandForm />);

    // When: the user types "bold" in Font style
    typeInto('Font style', 'bol');

    // Then: only Bold and Bold Italic are listed
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['Bold', 'Bold Italic']);
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

// Spec: specs/titlefild.md, Scenario 4 — Invalid Style Value on Focus Loss (Blur)
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

// Spec: specs/titlefild.md, Scenario 3 — A blank style field keeps the last valid option
describe('Title style – blank field', () => {
  it.each(FIELDS)('%s: blank is not an error, and the Cover keeps the last option', (name) => {
    const onChange = jest.fn();
    render(<BrandForm onChange={onChange} />);
    typeTitle('My Brand');

    typeInto(name, '');
    fireEvent.blur(getField(name));

    expect(getField(name)).toHaveAttribute('aria-invalid', 'false');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: { fontFamily: 'Roboto', fontStyle: 'Regular', fontSize: 'Medium' },
      }),
    );
  });
});

// Spec: specs/titlefild.md, Scenario 1 — Live title style
describe('Title style – live changes', () => {
  it('sends the title together with the selected style', () => {
    const onChange = jest.fn();
    render(<BrandForm onChange={onChange} />);
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    pickOption('Font style', 'Bold Italic');
    pickOption('Font size', 'Large');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: 'My Brand',
        style: { fontFamily: 'Open Sans', fontStyle: 'Bold Italic', fontSize: 'Large' },
      }),
    );
  });
});

// The title is drawn on the Cover page of the manual preview.
function getCoverTitle() {
  const preview = screen.getByRole('region', { name: 'Manual preview' });
  return within(within(preview).getByRole('article', { name: 'Cover' })).getByText('My Brand');
}

// Spec: specs/titlefild.md, Scenario 1 — the Cover shows the style as it changes
// The Cover is a thumbnail, so the title is drawn at half its real size (Large 48px → 24px).
describe('Title style – cover preview', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[href*="fonts.googleapis.com"]').forEach((l) => l.remove());
  });

  it('applies the style to the Cover as soon as it is picked', () => {
    renderApp();
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    pickSwatch('Typography color', 'Blue');
    pickOption('Font style', 'Bold Italic');
    pickOption('Font size', 'Large');

    const title = getCoverTitle();
    expect(title).toHaveStyle({
      color: '#1E88E5',
      fontWeight: 'bold',
      fontStyle: 'italic',
      fontSize: '24px',
    });
    expect(title.style.fontFamily).toContain('Open Sans');
  });

  it('keeps the last valid option while a field is half typed', () => {
    renderApp();
    typeTitle('My Brand');
    pickOption('Font size', 'Large');

    typeInto('Font size', 'Sma');

    // Still Large (48px → 24px on the thumbnail)
    expect(getCoverTitle()).toHaveStyle({ fontSize: '24px' });
  });

  // Spec: specs/titlefild.md, Scenario 5 — Font Style Is Visibly Applied
  it('requests the bold and italic font files so the style is really drawn', () => {
    // Given
    renderApp();
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');

    // When
    pickOption('Font style', 'Bold Italic');

    // Then: the Cover title is bold italic...
    expect(getCoverTitle()).toHaveStyle({ fontWeight: 'bold', fontStyle: 'italic' });

    // ...and Google Fonts is asked for the bold and italic variants
    const link = document.head.querySelector('link[href*="family=Open+Sans"]:not([href*="text="])');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('family=Open+Sans:ital,wght@0,400;0,700;1,400;1,700'),
    );
  });

  it('loads the font from Google Fonts only once', () => {
    renderApp();
    typeTitle('My Brand');
    pickOption('Font family', 'Open Sans');
    typeTitle('My Brand 2');
    typeTitle('My Brand');

    const links = document.head.querySelectorAll('link[href*="family=Open+Sans"]:not([href*="text="])');
    expect(links).toHaveLength(1);
  });
});
