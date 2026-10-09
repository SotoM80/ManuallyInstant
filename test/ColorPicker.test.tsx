import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import {
  clickSave,
  fillRequiredCoverFields,
  getColorGroup,
  getHexInput,
  pickSwatch,
  typeHex,
  typeTitle,
} from './coverForm';
import type { ColorField } from './coverForm';

function getPreview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function getPages() {
  return within(getPreview()).getAllByRole('article');
}

function getCover() {
  return within(getPreview()).getByRole('article', { name: 'Cover' });
}

function getCheckedSwatch(field: ColorField) {
  return within(getColorGroup(field))
    .queryAllByRole('radio')
    .find((radio) => (radio as HTMLInputElement).checked);
}

function saveCover() {
  typeTitle('My Brand');
  fillRequiredCoverFields();
  clickSave();
}

// Spec: specs/colorpicker.md, Section 2 — Interface
describe('Color picker – interface', () => {
  it.each([
    ['Typography color', '#000000', 'Black'],
    ['Background color', '#FFFFFF', 'White'],
  ] as const)('%s starts at %s with the %s swatch selected', (field, hex, swatch) => {
    renderApp();

    expect(getHexInput(field)).toHaveValue(hex);
    expect(getCheckedSwatch(field)).toHaveAccessibleName(swatch);
    expect(within(getColorGroup(field)).getAllByRole('radio')).toHaveLength(12);
    expect(within(getColorGroup(field)).getByLabelText(`${field} custom`)).toHaveValue(hex.toLowerCase());
  });
});

// Spec: specs/colorpicker.md, Scenario 1 — Picking a Swatch
describe('Color picker – swatches', () => {
  it('fills the HEX field when a swatch is clicked', () => {
    renderApp();

    pickSwatch('Background color', 'Navy');

    expect(getHexInput('Background color')).toHaveValue('#1A237E');
    expect(getCheckedSwatch('Background color')).toHaveAccessibleName('Navy');
    // The other picker is not touched
    expect(getHexInput('Typography color')).toHaveValue('#000000');
  });
});

// Spec: specs/colorpicker.md, Scenario 2 — Any Color by HEX
describe('Color picker – HEX field', () => {
  it.each([
    ['#2b2d42', '#2B2D42'],
    ['2B2D42', '#2B2D42'],
    ['#abc', '#AABBCC'],
  ])('tidies "%s" into "%s" on blur', (typed, expected) => {
    renderApp();

    typeHex('Typography color', typed);
    fireEvent.blur(getHexInput('Typography color'));

    expect(getHexInput('Typography color')).toHaveValue(expected);
    expect(getHexInput('Typography color')).toHaveAttribute('aria-invalid', 'false');
  });

  it('selects the matching swatch when its HEX is typed, and none for other colors', () => {
    renderApp();

    typeHex('Typography color', '#e53935');
    expect(getCheckedSwatch('Typography color')).toHaveAccessibleName('Red');

    typeHex('Typography color', '#2B2D42');
    expect(getCheckedSwatch('Typography color')).toBeUndefined();
  });

  it('follows the custom (native) picker', () => {
    renderApp();
    const custom = within(getColorGroup('Background color')).getByLabelText('Background color custom');

    fireEvent.change(custom, { target: { value: '#2b2d42' } });

    expect(getHexInput('Background color')).toHaveValue('#2B2D42');
  });
});

// Spec: specs/colorpicker.md, Scenario 3 — Invalid HEX
describe('Color picker – invalid HEX', () => {
  it('shows an error on blur and blocks Save', () => {
    // Given
    renderApp();
    typeTitle('My Brand');
    fillRequiredCoverFields();
    typeHex('Background color', 'blue');

    // When
    fireEvent.blur(getHexInput('Background color'));

    // Then
    expect(getHexInput('Background color')).toHaveAccessibleDescription(
      'Enter a valid HEX color, like #1E88E5',
    );
    expect(getHexInput('Background color')).toHaveStyle({ borderColor: 'red' });

    clickSave();
    expect(getCover()).toHaveTextContent('Your brand manual title');
  });

  it('shows "Required field" when the HEX field is empty on Save', () => {
    renderApp();
    typeTitle('My Brand');
    fillRequiredCoverFields();
    typeHex('Typography color', '');

    clickSave();

    expect(getHexInput('Typography color')).toHaveAccessibleDescription('Required field');
  });
});

// Spec: specs/colorpicker.md, Scenario 4 — Colors on the Manual
describe('Color picker – colors on the manual', () => {
  it('paints the title and "Designed by" with the Typography color and every page with the Background color', () => {
    // Given
    renderApp();
    pickSwatch('Typography color', 'White');
    typeHex('Background color', '#1a237e');

    // When
    saveCover();

    // Then
    expect(within(getCover()).getByText('My Brand')).toHaveStyle({ color: '#FFFFFF' });
    expect(getCover().querySelector('.cover-layout')).toHaveStyle({ color: '#FFFFFF' });
    for (const page of getPages()) {
      expect(page).toHaveStyle({ background: '#1A237E' });
    }
  });

  // Spec: specs/colorpicker.md, Scenario 5 — Colors Wait for Save
  it('does not change the pages before Save', () => {
    renderApp();

    pickSwatch('Background color', 'Navy');

    for (const page of getPages()) {
      expect(page).not.toHaveAttribute('style');
    }
  });
});
