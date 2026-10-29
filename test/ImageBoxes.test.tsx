import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { createPdf } from '../src/export/createPdf';

// Spec: specs/imageboxes.md. The export is mocked (jsdom cannot draw pages, ADR 0012).
jest.mock('../src/export/createPdf', () => ({ createPdf: jest.fn(async () => {}), createCmykPdf: jest.fn() }));
jest.setTimeout(20000);

function openSkin() {
  const sections = screen.getByRole('region', { name: 'Manual sections' });
  fireEvent.click(within(sections).getByRole('button', { name: /6\. Skin/ }));
  return within(screen.getByRole('group', { name: 'Image boxes' }));
}

function preview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function variable(page: HTMLElement, name: string) {
  return page.style.getPropertyValue(name);
}

function slide(boxes: ReturnType<typeof openSkin>, label: string, value: number) {
  fireEvent.change(boxes.getByLabelText(label), { target: { value: String(value) } });
}

describe('Image boxes – the Skin group', () => {
  // Scenario 1
  it('starts with today\'s look', () => {
    renderApp();
    const boxes = openSkin();

    expect(boxes.getByLabelText('Corner radius')).toHaveValue('4');
    expect(boxes.getByLabelText('Inner margin')).toHaveValue('8');
    expect(boxes.getByRole('checkbox', { name: 'Outline' })).toBeChecked();
    expect(boxes.getByLabelText('Thickness')).toHaveValue('1');
    expect(boxes.getByText('4 px')).toBeInTheDocument();
    expect(boxes.getByText('8%')).toBeInTheDocument();
  });

  // Scenarios 2, 3, 4 and 6
  it('sets the same variables on every inner page, at once', () => {
    renderApp();
    const boxes = openSkin();

    slide(boxes, 'Corner radius', 12);
    slide(boxes, 'Inner margin', 15);
    slide(boxes, 'Thickness', 3);

    const inner = within(preview())
      .getAllByRole('article')
      .filter((page) => page.getAttribute('aria-label') !== 'Cover');
    expect(inner.length).toBeGreaterThan(5);
    for (const page of inner) {
      expect(variable(page, '--box-radius')).toBe('12px');
      expect(variable(page, '--box-margin')).toBe('15%');
      expect(variable(page, '--box-outline')).toContain('inset 0 0 0 3px');
    }

    slide(boxes, 'Corner radius', 0);
    expect(variable(within(preview()).getByRole('article', { name: 'Logo versions' }), '--box-radius')).toBe('0px');
  });

  // Scenario 5
  it('removes the outline and turns Thickness off, keeping its value', () => {
    renderApp();
    const boxes = openSkin();
    slide(boxes, 'Thickness', 2);

    fireEvent.click(boxes.getByRole('checkbox', { name: 'Outline' }));

    expect(variable(within(preview()).getByRole('article', { name: 'Anatomy' }), '--box-outline')).toBe('none');
    expect(boxes.getByLabelText('Thickness')).toBeDisabled();
    expect(boxes.getByLabelText('Thickness')).toHaveValue('2');

    fireEvent.click(boxes.getByRole('checkbox', { name: 'Outline' }));
    expect(variable(within(preview()).getByRole('article', { name: 'Anatomy' }), '--box-outline')).toContain('2px');
  });

  it('leaves the Cover alone', () => {
    renderApp();
    slide(openSkin(), 'Corner radius', 20);

    expect(variable(within(preview()).getByRole('article', { name: 'Cover' }), '--box-radius')).toBe('');
  });
});

describe('Image boxes – templates and the PDF', () => {
  // Scenario 10
  it('keeps the boxes in every template and in the PDF', async () => {
    let versions: HTMLElement | undefined;
    (createPdf as jest.Mock).mockImplementation(async (pages: HTMLElement[]) => {
      versions = pages.find((page) => page.getAttribute('aria-label') === 'Logo versions');
    });
    renderApp();
    const boxes = openSkin();
    slide(boxes, 'Corner radius', 12);
    fireEvent.click(boxes.getByRole('checkbox', { name: 'Outline' }));

    fireEvent.click(within(preview()).getByRole('radio', { name: 'Template 3' }));
    const page = within(preview()).getByRole('article', { name: 'Logo versions' });
    expect(variable(page, '--box-radius')).toBe('12px');
    expect(variable(page, '--box-outline')).toBe('none');

    fireEvent.click(screen.getByRole('button', { name: 'Download web PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download anyway' }));
    await waitFor(() => expect(versions).toBeDefined(), { timeout: 8000 });
    expect(variable(versions!, '--box-radius')).toBe('12px');
    expect(variable(versions!, '--box-outline')).toBe('none');
  });
});
