import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LogoForm } from '../src/components/LogoForm';
import { makeLogo } from './coverForm';
import type { LogoData } from '../src/types';

// jsdom cannot draw images: a layer is "drawn" where its first shape's x says, on a 100-wide canvas
jest.mock('../src/utils/measureSvg', () => ({
  measureSvg: jest.fn(async (svg: string) => {
    const x = /<(?:rect|circle)[^>]* x="(\d+)"/.exec(svg);
    return x ? { x: Number(x[1]) / 100, y: 0.1, width: 0.1, height: 0.1, ratio: 1 } : null;
  }),
}));

// Spec: specs/logolayers.md — a layered SVG fills the parts of a mark card

function layer(name: string, x: number, extra = '') {
  return `<g id="${name.replace(/ /g, '_')}" data-name="${name}"${extra}><rect x="${x}" y="10" width="10" height="10"/></g>`;
}

// The layers are written in the file's order: the last one is the top layer of the panel
function svgFile(name: string, ...layers: string[]) {
  const text = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${layers.join('')}</svg>`;
  return new File([text], name, { type: 'image/svg+xml' });
}

function renderForm() {
  const onChange = jest.fn();
  let applyCount = 0;
  const view = render(<LogoForm onChange={onChange} applyCount={applyCount} />);
  function apply() {
    applyCount += 1;
    view.rerender(<LogoForm onChange={onChange} applyCount={applyCount} />);
  }
  return { apply, imagotype: () => (onChange.mock.lastCall![0] as LogoData).marks[0] };
}

function getForm() {
  return screen.getByRole('form', { name: 'Logo' });
}

function chooseImagotype(file: File) {
  fireEvent.change(within(getForm()).getByLabelText('Imagotype image (optional)', { selector: 'input' }), {
    target: { files: [file] },
  });
}

function partLabels() {
  return within(getForm())
    .queryAllByLabelText(/^Imagotype part \d+ label$/)
    .map((input) => (input as HTMLInputElement).value);
}

// Reading a file is asynchronous: under the load of the whole suite it can take more than the
// default second
async function waitForParts(count: number) {
  await waitFor(() => expect(partLabels()).toHaveLength(count), { timeout: 5000 });
}

describe('Logo layers from SVG', () => {
  it('fills an empty card with one part per layer, in reading order', async () => {
    renderForm();

    chooseImagotype(svgFile('volta.svg', layer('Logotipo', 0), layer('Tagline', 60)));

    await waitForParts(2);
    expect(partLabels()).toEqual(['Logotype / Wordmark', 'Tagline']);
    expect(screen.getByText('volta-Logotipo.svg')).toBeInTheDocument();
    expect(screen.getByText('volta-Tagline.svg')).toBeInTheDocument();
    expect(within(getForm()).getByLabelText('Imagotype part 1 name')).toHaveValue('');
    expect(within(getForm()).getByLabelText('Imagotype part 1 role')).toHaveValue('');
  });

  it("leaves the label empty for Illustrator's default names, so the page says Part N", async () => {
    const { imagotype } = renderForm();

    chooseImagotype(svgFile('vm032.svg', layer('Capa 1', 0), layer('Capa 2', 80)));

    await waitForParts(2);
    expect(partLabels()).toEqual(['', '']);
    expect(imagotype().parts.map((part) => part.label)).toEqual(['Part 1', 'Part 2']);
  });

  it('orders the parts by where they are drawn, not by the Layers panel', async () => {
    renderForm();

    // "Tagline" is the top layer of the panel, but it is drawn on the right
    chooseImagotype(svgFile('logo.svg', layer('Isotipo', 5), layer('Tagline', 70)));

    await waitForParts(2);
    expect(partLabels()).toEqual(['Isotype / Brandmark', 'Tagline']);
  });

  it('keeps the parts a card already has', async () => {
    renderForm();
    fireEvent.click(within(getForm()).getByRole('button', { name: 'Add part to Imagotype' }));
    fireEvent.change(within(getForm()).getByLabelText('Imagotype part 1 label'), { target: { value: 'Monogram' } });

    chooseImagotype(svgFile('logo.svg', layer('Isotipo', 5), layer('Tagline', 70)));

    expect(await screen.findByText('Remove the parts of this card to use the layers of this SVG.', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(partLabels()).toEqual(['Monogram']);
  });

  it('uses the first four layers when there are more', async () => {
    renderForm();

    chooseImagotype(svgFile('logo.svg', layer('A', 50), layer('B', 40), layer('C', 30), layer('D', 20), layer('E', 10)));

    await waitForParts(4);
    expect(partLabels()).toEqual(['E', 'D', 'C', 'B']);
    expect(screen.getByText('Only the first 4 layers are used.')).toBeInTheDocument();
  });

  it('skips hidden layers and layers that draw nothing', async () => {
    renderForm();

    chooseImagotype(
      svgFile(
        'logo.svg',
        layer('One', 10),
        layer('Hidden', 20, ' display="none"'),
        '<g data-name="Clip only"><clipPath id="c"><rect x="30" width="5" height="5"/></clipPath></g>',
        layer('Two', 40),
      ),
    );

    await waitForParts(2);
    expect(partLabels()).toEqual(['One', 'Two']);
  });

  it('shows the labels at once and the images of the parts after the same Apply', async () => {
    const { apply, imagotype } = renderForm();

    chooseImagotype(svgFile('volta.svg', layer('Logotipo', 0), layer('Tagline', 60)));
    await waitForParts(2);

    expect(imagotype().image).toBeNull();
    expect(imagotype().parts.map((part) => [part.label, part.image])).toEqual([
      ['Logotype / Wordmark', null],
      ['Tagline', null],
    ]);

    apply();

    expect(imagotype().image?.name).toBe('volta.svg');
    expect(imagotype().parts.map((part) => part.image?.name)).toEqual(['volta-Logotipo.svg', 'volta-Tagline.svg']);
  });

  it('shows the parts with that Apply even when it is pressed while the file is read', async () => {
    const { apply, imagotype } = renderForm();

    chooseImagotype(svgFile('volta.svg', layer('Logotipo', 0), layer('Tagline', 60)));
    apply(); // before the layers are read

    await waitForParts(2);
    expect(imagotype().parts.map((part) => part.image?.name)).toEqual(['volta-Logotipo.svg', 'volta-Tagline.svg']);
  });

  it('makes no parts from a PNG or an SVG with one layer', async () => {
    renderForm();

    chooseImagotype(makeLogo('mark.png'));
    chooseImagotype(svgFile('single.svg', layer('Logo', 0)));

    // Give the file time to be read
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(partLabels()).toEqual([]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says so when the layers of an SVG cannot be read', async () => {
    renderForm();

    chooseImagotype(new File(['not an svg'], 'logo.svg', { type: 'image/svg+xml' }));

    expect(await screen.findByText('The layers of this SVG could not be read.', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(partLabels()).toEqual([]);
  });

  it('drops the layers of a file replaced before they were read', async () => {
    renderForm();

    chooseImagotype(svgFile('first.svg', layer('A', 0), layer('B', 50)));
    chooseImagotype(makeLogo('second.png'));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(partLabels()).toEqual([]);
  });
});
