import { act, fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { clickApply, makeLogo, uploadLogo } from './coverForm';
import { MANUAL_PAGES } from '../src/data/manualSections';
import { a4 } from '../src/export/exportSettings';
import { fitScale } from '../src/utils/fullscreen';

// A photo mockup that is still being composed (scenario 9); the others never need it
jest.mock('../src/mockups/render/renderPhotoMockup', () => ({ renderPhotoMockup: jest.fn(() => new Promise(() => {})) }));

// Spec: specs/fullscreen.md

function fullscreenButton() {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('button', { name: 'Full screen' });
}

function open() {
  fireEvent.click(fullscreenButton());
  return screen.getByRole('dialog', { name: 'Full screen view' });
}

function articles(view: HTMLElement) {
  return within(view).getAllByRole('article');
}

function resize(width: number, height: number) {
  Object.assign(window, { innerWidth: width, innerHeight: height });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

// jsdom has no Fullscreen API: a browser that grants it, and can leave it
function grantFullscreen() {
  let element: Element | null = null;
  const change = () => document.dispatchEvent(new Event('fullscreenchange'));
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
  const request = jest.fn(async () => {
    element = document.documentElement;
    act(change);
  });
  const exit = jest.fn(async () => {
    element = null;
    act(change);
  });
  document.documentElement.requestFullscreen = request;
  document.exitFullscreen = exit;
  return {
    request,
    exit,
    leave: () => {
      element = null;
      act(change);
    },
  };
}

afterEach(() => {
  delete (document.documentElement as Partial<HTMLElement>).requestFullscreen;
  delete (document as Partial<Document>).exitFullscreen;
  delete (document as { fullscreenElement?: unknown }).fullscreenElement;
  resize(1024, 768);
});

describe('Full screen view', () => {
  // Scenario 1
  it('shows every page in order, with its caption, and puts the focus on Exit', () => {
    renderApp();

    const view = open();

    expect(articles(view).map((page) => page.getAttribute('aria-label'))).toEqual(MANUAL_PAGES);
    expect(view).toHaveTextContent('1. Cover');
    expect(view).toHaveTextContent('10. Mockups');
    expect(within(view).getByRole('button', { name: 'Exit full screen' })).toHaveFocus();
  });

  // Scenario 2
  it('keeps the natural order while a section has moved its pages first', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /5\. Typography/ }));

    const view = open();

    expect(articles(view)[0]).toHaveAccessibleName('Cover');
    expect(articles(view)[8]).toHaveAccessibleName('Typography');
  });

  // Scenario 3
  it('uses the chosen template and orientation', () => {
    renderApp();
    fireEvent.click(screen.getByRole('radio', { name: 'Template 3' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));

    const view = open();

    expect(view).toHaveAttribute('data-template', 'template3');
    expect(view).toHaveAttribute('data-view', 'pages');
    expect(articles(view).every((page) => page.dataset.orientation === 'landscape')).toBe(true);
  });

  // Scenario 4
  it("closes when the browser leaves full screen, and gives the focus back", async () => {
    const browser = grantFullscreen();
    renderApp();

    open();
    expect(browser.request).toHaveBeenCalledTimes(1);
    await act(async () => {}); // the browser grants it

    browser.leave(); // the user pressed Esc: the browser keeps it for itself

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fullscreenButton()).toHaveFocus();
  });

  // Scenario 5
  it('closes with Exit full screen, leaving the browser full screen too', async () => {
    const browser = grantFullscreen();
    renderApp();
    const view = open();
    await act(async () => {});

    fireEvent.click(within(view).getByRole('button', { name: 'Exit full screen' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(browser.exit).toHaveBeenCalled();
    expect(fullscreenButton()).toHaveFocus();
  });

  // Scenario 6
  it('fills the window when full screen is not available, keeps the page behind out of reach, and closes with Esc', () => {
    const { container } = renderApp();

    open();
    expect(container).toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container).not.toHaveAttribute('inert');
    expect(document.body.style.overflow).toBe('');
  });

  // Scenario 7
  it('shows only the images already applied', () => {
    renderApp();
    uploadLogo(makeLogo('first.png'));
    clickApply();
    uploadLogo(makeLogo('waiting.png'));

    const cover = articles(open())[0];

    expect(within(cover).getByRole('img', { name: 'Logo' })).toHaveAttribute('src', 'blob:first.png');
  });

  // Scenario 8
  it('fits each page and its caption whole to any window, and fits again when it changes', () => {
    const page = a4('portrait').px;
    renderApp();
    resize(1440, 900);
    const view = open();
    const box = () => view.querySelector<HTMLElement>('.fullscreen-page')!;

    expect(parseFloat(box().style.width)).toBeCloseTo(page.width * fitScale({ width: 1440, height: 900 }, page));

    resize(800, 1200);

    const width = parseFloat(box().style.width);
    const height = parseFloat(box().style.height);
    expect(width).toBeCloseTo(page.width * fitScale({ width: 800, height: 1200 }, page));
    expect(width + 2 * 24).toBeLessThanOrEqual(800); // no horizontal scroll
    expect(height + 28 + 2 * 24).toBeLessThanOrEqual(1200); // the page and its caption fit
  });

  // Scenario 9
  it('opens at once, with a photo mockup still being composed showing Preparing…', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /7\. Mockups/ }));
    const mockups = within(screen.getByRole('form', { name: 'Mockups' }));
    fireEvent.click(mockups.getByRole('checkbox', { name: /^Business card \(photo\)/ }));

    const page = articles(open())[9];

    expect(within(page).getAllByText('Preparing…').length).toBeGreaterThan(0);
  });
});

describe('fitScale', () => {
  it('takes the smaller of the width and height fits', () => {
    const page = { width: 794, height: 1123 };
    // Wide screen: the height decides
    expect(fitScale({ width: 1920, height: 1080 }, page)).toBeCloseTo((1080 - 48 - 28) / 1123);
    // Narrow screen: the width decides
    expect(fitScale({ width: 400, height: 1080 }, page)).toBeCloseTo((400 - 48) / 794);
  });
});
