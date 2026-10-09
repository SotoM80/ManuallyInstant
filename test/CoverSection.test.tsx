import { screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import {
  clickSave,
  getLogoInput,
  makeLogo,
  typeDesignedBy,
  typeTitle,
  uploadLogo,
} from './coverForm';

function getCover() {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', {
    name: 'Cover',
  });
}

function getDesignedByInput() {
  return screen.getByLabelText('Designed by');
}

// Spec: specs/cover.md, Section 2 — Interface (placeholders)
describe('Cover – before the first Save', () => {
  it('shows the three placeholders, in Template 1', () => {
    renderApp();

    const preview = screen.getByRole('region', { name: 'Manual preview' });
    expect(preview).toHaveAttribute('data-template', 'template1');
    expect(getCover()).toHaveTextContent('Your brand manual title');
    expect(getCover()).toHaveTextContent('Your logo');
    expect(getCover()).toHaveTextContent('Designed by …');
  });
});

// Spec: specs/cover.md, Scenario 1 — Successful Save
describe('Cover – successful save', () => {
  it('shows the title at the top, the logo in the middle and "Designed by" at the bottom', () => {
    // Given
    renderApp();
    typeTitle('My Brand');
    typeDesignedBy('  Studio X  ');
    uploadLogo(makeLogo('brand.png'));

    // When
    clickSave();

    // Then
    const title = within(getCover()).getByText('My Brand');
    const logo = within(getCover()).getByRole('img', { name: 'Logo' });
    const designedBy = within(getCover()).getByText('Designed by Studio X');

    expect(logo).toHaveAttribute('src', 'blob:brand.png');
    expect(title.compareDocumentPosition(logo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(logo.compareDocumentPosition(designedBy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// Spec: specs/cover.md, Scenario 2 — Designed By Is Required
describe('Cover – Designed by is required', () => {
  it.each([
    ['empty', ''],
    ['only spaces', '   '],
  ])('blocks Save when Designed by is %s', (_, value) => {
    // Given
    renderApp();
    typeTitle('My Brand');
    uploadLogo();
    typeDesignedBy(value);

    // When
    clickSave();

    // Then
    expect(getDesignedByInput()).toHaveAccessibleDescription('Required field');
    expect(getDesignedByInput()).toHaveStyle({ borderColor: 'red' });
    expect(getCover()).toHaveTextContent('Your brand manual title');
  });
});

// Spec: specs/cover.md, Scenario 3 — Logo Is Required
describe('Cover – logo is required', () => {
  it('blocks Save when no logo is chosen', () => {
    // Given
    renderApp();
    typeTitle('My Brand');
    typeDesignedBy('Studio X');

    // When
    clickSave();

    // Then
    expect(getLogoInput()).toHaveAccessibleDescription('Required field');
    expect(getLogoInput()).toHaveAttribute('aria-invalid', 'true');
    expect(getCover()).toHaveTextContent('Your logo');
  });
});

// Spec: specs/cover.md, Failure Modes — all errors at the same time
describe('Cover – every missing field at once', () => {
  it('shows "Required field" for the title, Designed by and Logo together', () => {
    renderApp();

    clickSave();

    expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
      'Required field',
      'Required field',
      'Required field',
    ]);
  });
});

// Spec: specs/cover.md, Scenarios 4 and 5 — Wrong File Type / File Too Big
describe('Cover – invalid logo file', () => {
  it.each([
    ['a PDF', makeLogo('logo.pdf', 'application/pdf'), 'Use a PNG, JPG, SVG or WebP image'],
    ['a PNG over 5 MB', makeLogo('big.png', 'image/png', 5 * 1024 * 1024 + 1), 'The logo must be 5 MB or smaller'],
  ])('shows an error as soon as %s is chosen, and blocks Save', (_, file, message) => {
    // Given
    renderApp();
    typeTitle('My Brand');
    typeDesignedBy('Studio X');

    // When
    uploadLogo(file);

    // Then: the error shows before Save...
    expect(getLogoInput()).toHaveAccessibleDescription(message);

    // ...and Save is blocked
    clickSave();
    expect(getCover()).toHaveTextContent('Your brand manual title');
  });

  it.each([
    ['JPG', 'logo.jpg', 'image/jpeg'],
    ['SVG', 'logo.svg', 'image/svg+xml'],
    ['WebP', 'logo.webp', 'image/webp'],
  ])('accepts a %s logo', (_, name, type) => {
    renderApp();
    typeTitle('My Brand');
    typeDesignedBy('Studio X');
    uploadLogo(makeLogo(name, type));

    clickSave();

    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', `blob:${name}`);
  });
});

// Spec: specs/cover.md, Scenario 6 — Cover Waits for Save
describe('Cover – waits for Save', () => {
  it('does not show the logo or Designed by before Save', () => {
    renderApp();

    typeDesignedBy('Studio X');
    uploadLogo();

    expect(within(getCover()).queryByRole('img', { name: 'Logo' })).not.toBeInTheDocument();
    expect(getCover()).toHaveTextContent('Your logo');
    expect(getCover()).toHaveTextContent('Designed by …');
  });
});
