import { screen, fireEvent, within } from '@testing-library/react';

// Helpers to fill the Cover section form (spec: specs/cover.md).

// Label queries compare every label with every field of the page, so they grow much faster than
// the page itself: a search of the whole app took ~0.8–1.7 s. Searching inside the Cover form
// alone keeps every test that types a title fast.
export function coverForm() {
  return within(screen.getByRole('form', { name: 'Cover' }));
}

export function typeTitle(value: string) {
  fireEvent.change(coverForm().getByLabelText('Brand manual title'), { target: { value } });
}

export function typeDesignedBy(value: string) {
  fireEvent.change(coverForm().getByLabelText('Designed by'), { target: { value } });
}

export function makeLogo(name = 'logo.png', type = 'image/png', bytes = 1) {
  return new File([new Uint8Array(bytes)], name, { type });
}

// `selector`: only the file field, not the "Logo size" group
export function getLogoInput() {
  return coverForm().getByLabelText('Logo', { selector: 'input' });
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
