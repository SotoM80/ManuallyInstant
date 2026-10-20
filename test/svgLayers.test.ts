import { cropSvg, inReadingOrder, layerFileName, partLabel, readSvgLayers } from '../src/utils/svgLayers';

// Spec: specs/logolayers.md — reading the layers of an SVG exported from Illustrator

// The structure of a real export (VM032_IDEAS.svg), with shorter drawings: a shared style in
// <defs>, two layers named by Illustrator, and a group inside the second one
const ILLUSTRATOR_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 579.81 132.65">
  <defs><style>.cls-1 { fill-rule: evenodd; }</style></defs>
  <g id="Capa_1" data-name="Capa 1"><path class="cls-1" d="M0,0h500v130h-500z"/></g>
  <g id="Capa_2" data-name="Capa 2"><g><path d="M510,56h70v75h-70z"/><polygon points="1 2 3 4"/></g></g>
</svg>`;

function svg(body: string, root = 'viewBox="0 0 100 100"') {
  return `<svg xmlns="http://www.w3.org/2000/svg" ${root}>${body}</svg>`;
}

function parse(text: string) {
  return new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
}

describe('readSvgLayers', () => {
  it('reads the layers of an Illustrator export, top layer of the panel first', () => {
    const read = readSvgLayers(ILLUSTRATOR_SVG)!;

    expect(read.viewBox).toEqual([0, 0, 579.81, 132.65]);
    expect(read.layers.map((layer) => layer.name)).toEqual(['Capa 2', 'Capa 1']);
  });

  it('keeps the shared styles in every part, and only its own layer', () => {
    const [second, first] = readSvgLayers(ILLUSTRATOR_SVG)!.layers;

    // The evenodd rule keeps the holes of the letters
    expect(first.svg).toContain('fill-rule: evenodd');
    expect(second.svg).toContain('fill-rule: evenodd');
    expect(parse(first.svg).querySelectorAll('path')).toHaveLength(1);
    expect(first.svg).not.toContain('M510');
    expect(second.svg).toContain('M510');
    expect(second.svg).toContain('<polygon');
    expect(second.svg).not.toContain('data-layer-index');
  });

  it('skips hidden layers and layers that draw nothing', () => {
    const read = readSvgLayers(
      svg(`
        <g data-name="Shown"><rect x="1" width="5" height="5"/></g>
        <g data-name="Hidden" display="none"><rect width="5" height="5"/></g>
        <g data-name="Hidden by style" style="display:none;"><rect width="5" height="5"/></g>
        <g data-name="Only a clip path"><clipPath id="c"><rect width="5" height="5"/></clipPath></g>
        <g data-name="Also shown"><circle r="3"/></g>`),
    )!;

    expect(read.layers.map((layer) => layer.name)).toEqual(['Also shown', 'Shown']);
  });

  it('uses the named groups inside a single outer group as the layers', () => {
    const read = readSvgLayers(
      svg(`<g id="Layer_2" data-name="Layer 2" transform="translate(5 5)">
        <g id="Isotipo"><rect width="5" height="5"/></g>
        <g id="Tagline"><rect x="50" width="5" height="5"/></g>
      </g>`),
    )!;

    expect(read.layers.map((layer) => layer.name)).toEqual(['Tagline', 'Isotipo']);
    // The outer group stays, so the layer is drawn where it was
    expect(read.layers[1].svg).toContain('translate(5 5)');
    expect(read.layers[1].svg).not.toContain('Tagline');
  });

  it('leaves shapes outside any layer out of the parts', () => {
    const read = readSvgLayers(
      svg('<rect id="loose" width="100" height="100"/><g data-name="A"><circle r="1"/></g><g data-name="B"><circle r="2"/></g>'),
    )!;

    expect(read.layers[0].svg).not.toContain('loose');
  });

  it('undoes the escapes of Illustrator ids when there is no data-name', () => {
    const read = readSvgLayers(svg('<g id="Logo_x5F_A"><circle r="1"/></g><g id="Layer_1-2"><circle r="1"/></g>'))!;

    expect(read.layers.map((layer) => layer.name)).toEqual(['Layer 1', 'Logo_A']);
  });

  it('removes scripts from the parts', () => {
    const read = readSvgLayers(svg('<script>alert(1)</script><g data-name="A"><script>x()</script><circle r="1"/></g><g data-name="B"><circle r="1"/></g>'))!;

    expect(read.layers.every((layer) => !layer.svg.includes('<script'))).toBe(true);
  });

  it('takes the size as the canvas when there is no viewBox', () => {
    expect(readSvgLayers(svg('<g><circle r="1"/></g>', 'width="200px" height="50"'))!.viewBox).toEqual([0, 0, 200, 50]);
  });

  it('cannot read a file that is not SVG, or has no canvas', () => {
    expect(readSvgLayers('not an svg')).toBeNull();
    expect(readSvgLayers('<html xmlns="http://www.w3.org/1999/xhtml"></html>')).toBeNull();
    expect(readSvgLayers(svg('<g><circle r="1"/></g>', ''))).toBeNull();
  });
});

describe('partLabel', () => {
  it('turns known names into the suggestions, in any case or accent', () => {
    expect(partLabel('Isotipo')).toBe('Isotype / Brandmark');
    expect(partLabel('ISÓTIPO')).toBe('Isotype / Brandmark');
    expect(partLabel('símbolo')).toBe('Isotype / Brandmark');
    expect(partLabel('Logotipo')).toBe('Logotype / Wordmark');
    expect(partLabel('wordmark')).toBe('Logotype / Wordmark');
    expect(partLabel('Eslogan')).toBe('Tagline');
  });

  it("gives no label for Illustrator's default names or no name", () => {
    expect(partLabel('Capa 1')).toBe('');
    expect(partLabel('Layer 12')).toBe('');
    expect(partLabel('Ebene 2')).toBe('');
    expect(partLabel('')).toBe('');
  });

  it('keeps any other name', () => {
    expect(partLabel(' Monogram ')).toBe('Monogram');
  });
});

describe('layerFileName', () => {
  it('names the part after the file and the layer, safe for a file name', () => {
    expect(layerFileName('volta.svg', 'Isotipo', 1)).toBe('volta-Isotipo.svg');
    expect(layerFileName('volta.svg', 'Marca / Ícono', 1)).toBe('volta-Marca-Icono.svg');
    expect(layerFileName('volta.svg', 'Capa 2', 2)).toBe('volta-part-2.svg');
  });
});

describe('cropSvg', () => {
  it('crops the canvas to the drawn box, with a margin of 2% of its longer side', () => {
    const cropped = parse(
      cropSvg(svg('<rect/>', 'viewBox="0 0 200 100"'), [0, 0, 200, 100], { x: 0.5, y: 0.2, width: 0.25, height: 0.5, ratio: 2 }),
    );

    // The box is 50 × 50 at (100, 20); the margin is 1
    expect(cropped.getAttribute('viewBox')).toBe('99 19 52 52');
    expect(cropped.getAttribute('width')).toBe('52');
    expect(cropped.getAttribute('height')).toBe('52');
  });
});

describe('inReadingOrder', () => {
  const at = (name: string, x: number, y = 0) => ({ name, bounds: { x, y, width: 0.1, height: 0.1, ratio: 1 } });

  it('reads from left to right, then from top to bottom', () => {
    const order = inReadingOrder([at('right', 0.8), at('below', 0.1, 0.5), at('left', 0.1, 0.1)]);

    expect(order.map((layer) => layer.name)).toEqual(['left', 'below', 'right']);
  });

  it('puts the layers that could not be measured last', () => {
    const order = inReadingOrder([{ name: 'unknown', bounds: null }, at('known', 0.9)]);

    expect(order.map((layer) => layer.name)).toEqual(['known', 'unknown']);
  });
});
