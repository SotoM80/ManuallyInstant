import { screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import {
  clickApply,
  fillRequiredCoverFields,
  getApplyButton,
  getLogoInput,
  getLogoSizeOption,
  makeLogo,
  pickLogoSize,
  typeDesignedBy,
  typeTitle,
  uploadLogo,
} from './coverForm';

function getCover() {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', {
    name: 'Cover',
  });
}

// Spec: specs/cover.md, Section 2 — Interface (placeholders)
describe('Cover – before anything is typed', () => {
  it('shows the three placeholders, in Template 1', () => {
    renderApp();

    const preview = screen.getByRole('region', { name: 'Manual preview' });
    expect(preview).toHaveAttribute('data-template', 'template1');
    expect(getCover()).toHaveTextContent('Your brand manual title');
    expect(getCover()).toHaveTextContent('Your logo');
    expect(getCover()).toHaveTextContent('Designed by …');
  });

  it('has no Save button', () => {
    renderApp();

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });
});

// Spec: specs/cover.md, Scenario 1 — Live preview
describe('Cover – live preview', () => {
  it('shows the title and Designed by as they are typed, with no button', () => {
    renderApp();

    typeTitle('My Brand');
    typeDesignedBy('  Studio X  ');

    expect(within(getCover()).getByText('My Brand')).toBeInTheDocument();
    expect(within(getCover()).getByText('Designed by Studio X')).toBeInTheDocument();
  });

  it('keeps a placeholder for each field that is still empty', () => {
    renderApp();

    typeTitle('My Brand');

    expect(getCover()).toHaveTextContent('My Brand');
    expect(getCover()).toHaveTextContent('Your logo');
    expect(getCover()).toHaveTextContent('Designed by …');
  });

  it('goes back to the placeholder when a field is emptied', () => {
    renderApp();
    typeTitle('My Brand');

    typeTitle('   ');

    expect(getCover()).toHaveTextContent('Your brand manual title');
  });

  it('shows no "Required field" errors for empty fields', () => {
    renderApp();
    typeTitle('My Brand');
    typeTitle('');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('draws the title at the top, the logo in the middle and "Designed by" at the bottom', () => {
    renderApp();
    typeTitle('My Brand');
    typeDesignedBy('Studio X');
    uploadLogo(makeLogo('brand.png'));
    clickApply();

    const title = within(getCover()).getByText('My Brand');
    const logo = within(getCover()).getByRole('img', { name: 'Logo' });
    const designedBy = within(getCover()).getByText('Designed by Studio X');

    expect(logo).toHaveAttribute('src', 'blob:brand.png');
    expect(title.compareDocumentPosition(logo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(logo.compareDocumentPosition(designedBy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

// Spec: specs/cover.md, Scenario 2 — A new logo waits for Apply
describe('Cover – logo and the Apply button', () => {
  it('starts with Apply disabled', () => {
    renderApp();

    expect(getApplyButton()).toBeDisabled();
  });

  it('turns Apply on when a logo is chosen, but does not show it yet', () => {
    renderApp();

    uploadLogo();

    expect(getApplyButton()).toBeEnabled();
    expect(within(getCover()).queryByRole('img', { name: 'Logo' })).not.toBeInTheDocument();
    expect(getCover()).toHaveTextContent('Your logo');
  });

  it('shows the logo on Apply and turns Apply off again', () => {
    renderApp();
    uploadLogo(makeLogo('brand.png'));

    clickApply();

    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', 'blob:brand.png');
    expect(getApplyButton()).toBeDisabled();
  });

  it('keeps the applied logo until a replacement is applied', () => {
    renderApp();
    uploadLogo(makeLogo('first.png'));
    clickApply();

    uploadLogo(makeLogo('second.png'));

    expect(getApplyButton()).toBeEnabled();
    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', 'blob:first.png');

    clickApply();

    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', 'blob:second.png');
  });
});

// Spec: specs/cover.md, Scenarios 3 and 4 — Wrong File Type / File Too Big
describe('Cover – invalid logo file', () => {
  it.each([
    ['a PDF', makeLogo('logo.pdf', 'application/pdf'), 'Use a PNG, JPG, SVG or WebP image'],
    ['a PNG over 5 MB', makeLogo('big.png', 'image/png', 5 * 1024 * 1024 + 1), 'The logo must be 5 MB or smaller'],
  ])('shows an error as soon as %s is chosen, and keeps Apply off', (_, file, message) => {
    renderApp();

    uploadLogo(file);

    expect(getLogoInput()).toHaveAccessibleDescription(message);
    expect(getApplyButton()).toBeDisabled();
    expect(getCover()).toHaveTextContent('Your logo');
  });

  it('keeps the applied logo when a wrong file is chosen after it', () => {
    renderApp();
    uploadLogo(makeLogo('brand.png'));
    clickApply();

    uploadLogo(makeLogo('logo.pdf', 'application/pdf'));

    expect(getApplyButton()).toBeDisabled();
    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', 'blob:brand.png');
  });

  it.each([
    ['JPG', 'logo.jpg', 'image/jpeg'],
    ['SVG', 'logo.svg', 'image/svg+xml'],
    ['WebP', 'logo.webp', 'image/webp'],
  ])('accepts a %s logo', (_, name, type) => {
    renderApp();
    uploadLogo(makeLogo(name, type));

    clickApply();

    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', `blob:${name}`);
  });
});

// Spec: specs/cover.md, Scenario 5 — Logo Size
describe('Cover – logo size', () => {
  function getCoverLogoArea() {
    return within(getCover()).getByRole('img', { name: 'Logo' }).parentElement as HTMLElement;
  }

  it('starts on Medium', () => {
    renderApp();

    expect(getLogoSizeOption('Medium')).toBeChecked();
  });

  it.each([
    ['Small', '0.5'],
    ['Medium', '0.75'],
    ['Large', '1'],
  ] as const)('draws a %s logo at %s of its area', (size, scale) => {
    renderApp();
    fillRequiredCoverFields();
    clickApply();

    pickLogoSize(size);

    expect(getCoverLogoArea().style.getPropertyValue('--logo-scale')).toBe(scale);
  });

  it('changes the size live, without Apply', () => {
    renderApp();
    fillRequiredCoverFields();
    clickApply();

    pickLogoSize('Small');

    expect(getApplyButton()).toBeDisabled();
    expect(getCoverLogoArea().style.getPropertyValue('--logo-scale')).toBe('0.5');
  });
});
