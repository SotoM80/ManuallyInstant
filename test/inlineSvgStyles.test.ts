import { inlineSvgStyles } from '../src/export/inlineSvgStyles';

// Spec: specs/export.md — the construction grid and the clear space in the PDF (ADR 0012)
// A computed style with only these properties, like the browser's (a list of names and values)
function styles(values: Record<string, string>) {
  const names = Object.keys(values);
  return {
    length: names.length,
    item: (i: number) => names[i],
    getPropertyValue: (property: string) => values[property] ?? '',
    getPropertyPriority: () => '',
  } as unknown as CSSStyleDeclaration;
}

describe('inlineSvgStyles', () => {
  function grid() {
    const root = document.createElement('article');
    root.innerHTML =
      '<div class="title">My Brand</div>' +
      '<svg class="construction-grid"><rect class="logo"></rect><text class="measure">X</text></svg>';
    return root;
  }

  it('writes the computed style of every SVG shape and text on itself', () => {
    const root = grid();
    const computed = new Map([
      [
        'rect',
        styles({
          fill: 'none',
          stroke: 'rgb(26, 35, 126)',
          'stroke-width': '1.2px',
          'vector-effect': 'non-scaling-stroke',
          opacity: '0.9',
        }),
      ],
      ['text', styles({ fill: 'rgb(26, 35, 126)', 'font-size': '0.7px', 'text-anchor': 'middle' })],
    ]);
    inlineSvgStyles(root, (element) => computed.get(element.tagName.toLowerCase()) ?? styles({}));

    const rect = root.querySelector('rect')!;
    expect(rect.style.getPropertyValue('fill')).toBe('none');
    expect(rect.style.getPropertyValue('stroke')).toBe('rgb(26, 35, 126)');
    expect(rect.style.getPropertyValue('opacity')).toBe('0.9');
    // Thin lines whatever the size of the grid's units
    expect(rect.style.getPropertyValue('vector-effect')).toBe('non-scaling-stroke');
    const text = root.querySelector('text')!;
    expect(text.style.getPropertyValue('font-size')).toBe('0.7px');
    expect(text.style.getPropertyValue('text-anchor')).toBe('middle');
  });

  it('keeps hidden what the CSS hides, and leaves the HTML around the SVG alone', () => {
    const root = grid();
    inlineSvgStyles(root, (element) => (element.tagName === 'rect' ? styles({ display: 'none' }) : styles({})));
    expect(root.querySelector('rect')!.style.display).toBe('none');
    expect(root.querySelector('text')!.getAttribute('style')).toBeNull();
    expect((root.querySelector('.title') as HTMLElement).getAttribute('style')).toBeNull();
  });
});
