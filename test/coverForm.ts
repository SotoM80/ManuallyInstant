import { screen, fireEvent, within } from '@testing-library/react';

// Helpers to fill the Cover section form (spec: specs/cover.md).

export function typeTitle(value: string) {
  fireEvent.change(screen.getByLabelText('Brand manual title'), { target: { value } });
}

export function typeDesignedBy(value: string) {
  fireEvent.change(screen.getByLabelText('Designed by'), { target: { value } });
}

export function makeLogo(name = 'logo.png', type = 'image/png', bytes = 1) {
  return new File([new Uint8Array(bytes)], name, { type });
}

// `selector`: the preview also has a page labeled "Logo", so only look at inputs.
export function getLogoInput() {
  return screen.getByLabelText('Logo', { selector: 'input' });
}

export function uploadLogo(file: File = makeLogo()) {
  fireEvent.change(getLogoInput(), { target: { files: [file] } });
}

export function getLogoSizeOption(size: 'Small' | 'Medium' | 'Large') {
  const group = screen.getByRole('group', { name: 'Logo size' });
  return within(group).getByRole('radio', { name: size });
}

export function pickLogoSize(size: 'Small' | 'Medium' | 'Large') {
  fireEvent.click(getLogoSizeOption(size));
}

// Fills Designed by and chooses a logo (the logo still waits for Apply).
export function fillRequiredCoverFields() {
  typeDesignedBy('Studio X');
  uploadLogo();
}

export type ColorField = 'Title color' | 'Text color' | 'Background color';

export function getColorGroup(field: ColorField) {
  return screen.getByRole('group', { name: field });
}

// Clicks a quick swatch ("Blue", "Navy", …) of a color picker.
export function pickSwatch(field: ColorField, name: string) {
  fireEvent.click(within(getColorGroup(field)).getByRole('radio', { name }));
}

export function getHexInput(field: ColorField) {
  return screen.getByRole('textbox', { name: `${field} HEX` });
}

export function typeHex(field: ColorField, value: string) {
  fireEvent.change(getHexInput(field), { target: { value } });
}

// The Apply button of the preview: it shows the images chosen since the last Apply.
export function getApplyButton() {
  return screen.getByRole('button', { name: 'Apply' });
}

export function clickApply() {
  fireEvent.click(getApplyButton());
}
