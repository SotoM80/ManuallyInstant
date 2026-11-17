import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { uploadLogo } from './coverForm';
import { clampPlacement, orientedLogo } from '../src/mockups/geometry';
import { DEFAULT_MOCKUPS, DEFAULT_PLACEMENT, setMockupOrientation, setMockupPlacement } from '../src/mockups/mockups';
import { MOCKUP_PRODUCTS } from '../src/mockups/products';

// Spec: specs/mockups.md, Orientation (ADR 0037)
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(async () => {}) }));
jest.setTimeout(20000);

const WIDE_AREA = { x: 0, y: 0, width: 400, height: 200 };

describe('the logo turned vertical', () => {
  it('is fitted turned: its width runs along the area height, a quarter turn to the left', () => {
    // A 2:1 logo in a 2:1 area: horizontal it fills it, vertical it is 200 long and 100 thick
    expect(orientedLogo(WIDE_AREA, 2, 1)).toEqual({ width: 400, height: 200, turn: 0 });
    expect(orientedLogo(WIDE_AREA, 2, 1, 'vertical')).toEqual({ width: 200, height: 100, turn: -90 });
    // In a tall area (the side of a mug), a wide logo turned is large
    expect(orientedLogo({ x: 0, y: 0, width: 100, height: 400 }, 4, 1, 'vertical')).toMatchObject({ width: 400, height: 100 });
  });

  it('stays inside its area when moved, measured turned', () => {
    // Vertical, the 100-wide turned logo can move 150 px each way: 0.375 of the width
    const moved = clampPlacement(WIDE_AREA, 2, { ...DEFAULT_PLACEMENT, x: 1, orientation: 'vertical' });
    expect(moved.x).toBeCloseTo(0.375);
    expect(moved).not.toHaveProperty('orientation');
    // Horizontal it fills the width and cannot move
    expect(clampPlacement(WIDE_AREA, 2, { ...DEFAULT_PLACEMENT, x: 1 }).x).toBe(0);
  });

  it('centers the logo again when the orientation changes, keeping Size and Rotation', () => {
    const placed = setMockupPlacement(DEFAULT_MOCKUPS, 'mug', { x: 0.2, y: -0.1, scale: 0.6, rotate: 10 });
    const turned = setMockupOrientation(placed, 'mug', 'vertical').settings.mug;
    expect(turned.orientation).toBe('vertical');
    expect(turned.placement).toEqual({ x: 0, y: 0, scale: 0.6, rotate: 10 });
  });
});

describe('Orientation in the section (scenario 44)', () => {
  it('turns the logo on one illustration only, and back', () => {
    renderApp();
    uploadLogo();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Logo' }));
    fireEvent.click(screen.getByRole('button', { name: /7\. Mockups/ }));
    const form = screen.getByRole('form', { name: 'Mockups' });
    const page = screen.getByRole('article', { name: 'Mockups' });
    const mug = MOCKUP_PRODUCTS.find((product) => product.id === 'mug')!;
    const mugLogo = () => within(page).getByRole('img', { name: 'Mug mockup' }).querySelector('image')!;
    const turnOf = (image: Element) => image.parentElement!.getAttribute('transform');

    const select = within(form).getByRole('combobox', { name: 'Mug logo orientation' });
    expect(select).toHaveValue('horizontal');
    fireEvent.change(select, { target: { value: 'vertical' } });

    // The box swapped around the same center, then turned a quarter to the left
    const cx = mug.logo.x + mug.logo.width / 2;
    const cy = mug.logo.y + mug.logo.height / 2;
    expect(Number(mugLogo().getAttribute('width'))).toBeCloseTo(mug.logo.height);
    expect(Number(mugLogo().getAttribute('height'))).toBeCloseTo(mug.logo.width);
    expect(turnOf(mugLogo())).toBe(`rotate(${(mug.logo.rotate ?? 0) - 90} ${cx} ${cy})`);
    // The others are not turned
    const card = within(page).getByRole('img', { name: 'Business card mockup' }).querySelector('image')!;
    expect(turnOf(card)).toBeNull();

    fireEvent.change(select, { target: { value: 'horizontal' } });
    expect(Number(mugLogo().getAttribute('width'))).toBeCloseTo(mug.logo.width);
  });
});
