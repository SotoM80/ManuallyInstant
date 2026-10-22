import { fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { getColorGroup, typeHex } from './coverForm';

// The swatches start hidden behind one circle with the current color; a click opens them in a pop-up.

function getToggle() {
  return within(getColorGroup('Title color')).getByRole('button', { name: 'Title color swatches' });
}

function getFan() {
  return document.getElementById(getToggle().getAttribute('aria-controls') as string) as HTMLElement;
}

function getSwatch(name: string) {
  return within(getColorGroup('Title color')).getByRole('radio', { name });
}

describe('Swatches pop-up', () => {
  it('starts folded and shows the current color in the circle', () => {
    renderApp();

    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(getFan()).toHaveAttribute('inert');
    expect(getToggle()).toHaveStyle({ backgroundColor: 'rgb(0, 0, 0)' }); // Black by default
  });

  it('opens with a click on the circle', () => {
    renderApp();

    fireEvent.click(getToggle());

    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(getFan()).not.toHaveAttribute('inert');
  });

  it('folds back after a mouse click on a swatch, and the circle takes that color', () => {
    renderApp();
    fireEvent.click(getToggle());

    fireEvent.click(getSwatch('Blue'), { detail: 1 });

    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(getToggle()).toHaveFocus();
    expect(getToggle()).toHaveStyle({ backgroundColor: 'rgb(30, 136, 229)' });
  });

  it('stays open while the keyboard browses the swatches', () => {
    renderApp();
    fireEvent.click(getToggle());

    // Arrow keys "click" the radios with detail 0
    fireEvent.click(getSwatch('Blue'), { detail: 0 });

    expect(getToggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes with Escape and with a click outside', () => {
    renderApp();
    fireEvent.click(getToggle());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(getToggle());
    fireEvent.pointerDown(document.body);
    expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows no color while the HEX is not valid', () => {
    renderApp();

    typeHex('Title color', '#12');

    expect(getToggle()).toHaveAttribute('data-empty', 'true');
  });
});
