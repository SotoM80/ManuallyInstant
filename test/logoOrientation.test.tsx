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
  it('keeps the size it has horizontal, turned a quarter to the left', () => {
    expect(orientedLogo(WIDE_AREA, 2, 1)).toEqual({ width: 400, height: 200, turn: 0 });
    expect(orientedLogo(WIDE_AREA, 2, 1, 'vertical')).toEqual({ width: 400, height: 200, turn: -90 });
    expect(orientedLogo(WIDE_AREA, 2, 1.5, 'vertical')).toMatchObject({ width: 600, height: 300 });
  });

  it('moves as far as the area allows, measured turned', () => {
    // Vertical at 50 %, the logo is 100 across turned: it can move 150 px each way, 0.375 of the width
    const moved = clampPlacement(WIDE_AREA, 2, { ...DEFAULT_PLACEMENT, scale: 0.5, x: 1, orientation: 'vertical' });
    expect(moved.x).toBeCloseTo(0.375);
    expect(moved).not.toHaveProperty('orientation');
    // Horizontal at 100 % it fills the width and cannot move
    expect(clampPlacement(WIDE_AREA, 2, { ...DEFAULT_PLACEMENT, x: 1 }).x).toBe(0);
  });

  it('centers the logo again when the orientation changes, keeping Size and Rotation', () => {
    const placed = setMockupPlacement(DEFAULT_MOCKUPS, 'mug', { x: 0.2, y: -0.1, scale: 0.6, rotate: 10 });
    const turned = setMockupOrientation(placed, 'mug', 'vertical').settings.mug;
    expect(turned.orientation).toBe('vertical');
    expect(turned.placement).toEqual({ x: 0, y: 0, scale: 0.6, rotate: 10 });
  });
});

describe('Orientation and Size in the section (scenario 44)', () => {
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

    // The same size, turned a quarter to the left around the box's center
    const cx = mug.logo.x + mug.logo.width / 2;
    const cy = mug.logo.y + mug.logo.height / 2;
    expect(Number(mugLogo().getAttribute('width'))).toBeCloseTo(mug.logo.width);
    expect(Number(mugLogo().getAttribute('height'))).toBeCloseTo(mug.logo.height);
    expect(turnOf(mugLogo())).toBe(`rotate(${(mug.logo.rotate ?? 0) - 90} ${cx} ${cy})`);
    // Size 150 %: larger around the same center
    fireEvent.change(within(form).getByRole('slider', { name: 'Mug logo size' }), { target: { value: '150' } });
    expect(Number(mugLogo().getAttribute('width'))).toBeCloseTo(mug.logo.width * 1.5);
    expect(Number(mugLogo().getAttribute('x'))).toBeCloseTo(cx - (mug.logo.width * 1.5) / 2);
    // The others are not turned
    const card = within(page).getByRole('img', { name: 'Business card mockup' }).querySelector('image')!;
    expect(turnOf(card)).toBeNull();

    fireEvent.change(select, { target: { value: 'horizontal' } });
    expect(turnOf(mugLogo())).toBe(mug.logo.rotate ? `rotate(${mug.logo.rotate} ${cx} ${cy})` : null);
  });
});
