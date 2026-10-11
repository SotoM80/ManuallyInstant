import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { getColorGroup, getHexInput, pickSwatch } from './coverForm';
import { hexToRgb, rgbToHex } from '../src/data/colorPalette';

// RGB pop-up next to each color picker: three sliders to fine-tune the color.

function getRgbButton() {
  return within(getColorGroup('Background color')).getByRole('button', { name: 'Background color RGB' });
}

function getSliders() {
  return screen.getByRole('group', { name: 'Background color RGB sliders' });
}

function getSlider(name: 'Red' | 'Green' | 'Blue') {
  return within(getSliders()).getByRole('slider', { name });
}

describe('RGB conversion', () => {
  it('turns a HEX into its RGB channels and back', () => {
    expect(hexToRgb('#1E88E5')).toEqual({ r: 30, g: 136, b: 229 });
    expect(rgbToHex({ r: 30, g: 136, b: 229 })).toBe('#1E88E5');
    expect(rgbToHex({ r: 0, g: 5, b: 255 })).toBe('#0005FF');
  });
});

describe('RGB pop-up', () => {
  it('starts closed and opens with the RGB button', () => {
    renderApp();
    expect(getRgbButton()).toHaveAttribute('aria-expanded', 'false');
    expect(getSliders()).toHaveAttribute('inert');

    fireEvent.click(getRgbButton());

    expect(getRgbButton()).toHaveAttribute('aria-expanded', 'true');
    expect(getSliders()).not.toHaveAttribute('inert');
    expect(getSlider('Red')).toHaveFocus();
  });

  it('shows the RGB channels of the current color', () => {
    renderApp();

    pickSwatch('Background color', 'Blue');
    fireEvent.click(getRgbButton());

    expect(getSlider('Red')).toHaveValue('30');
    expect(getSlider('Green')).toHaveValue('136');
    expect(getSlider('Blue')).toHaveValue('229');
    expect(getSliders()).toHaveTextContent('rgb(30, 136, 229)');
  });

  it('moving a slider changes the color everywhere', () => {
    // Given: the background starts White (#FFFFFF)
    renderApp();
    fireEvent.click(getRgbButton());

    // When: Red goes to 0
    fireEvent.change(getSlider('Red'), { target: { value: '0' } });

    // Then: the HEX field follows
    expect(getHexInput('Background color')).toHaveValue('#00FFFF');
  });

  it('closes with Escape and gives the focus back to the button', () => {
    renderApp();
    fireEvent.click(getRgbButton());

    fireEvent.keyDown(getSlider('Red'), { key: 'Escape' });

    expect(getRgbButton()).toHaveAttribute('aria-expanded', 'false');
    expect(getRgbButton()).toHaveFocus();
  });

  it('closes with a click outside', () => {
    renderApp();
    fireEvent.click(getRgbButton());

    fireEvent.pointerDown(document.body);

    expect(getRgbButton()).toHaveAttribute('aria-expanded', 'false');
  });
});
