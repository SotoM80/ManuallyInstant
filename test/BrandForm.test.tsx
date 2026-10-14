import { fireEvent, render, screen } from '@testing-library/react';
import { BrandForm } from '../src/components/BrandForm';
import { DEFAULT_TITLE_STYLE } from '../src/data/titleOptions';
import { typeTitle } from './coverForm';

function getInput() {
  return screen.getByLabelText('Brand manual title');
}

function sentTitle(title: string) {
  return expect.objectContaining({ title, style: DEFAULT_TITLE_STYLE });
}

// Spec: specs/titlefild.md, Section 2 — Interface
describe('BrandForm – interface', () => {
  it('renders an empty, enabled brand title field and no Save button', () => {
    render(<BrandForm />);

    expect(getInput()).toHaveValue('');
    expect(getInput()).toBeEnabled();
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
  });

  it('sends nothing before the user types (the Cover keeps its placeholders)', () => {
    const onChange = jest.fn();
    render(<BrandForm onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });
});

// Spec: specs/titlefild.md, Scenario 1 — Live title (postcondition: clean text)
describe('BrandForm – live title', () => {
  it('sends the trimmed title on every change', () => {
    const onChange = jest.fn();
    render(<BrandForm onChange={onChange} />);

    typeTitle('  My Brand  ');

    expect(onChange).toHaveBeenLastCalledWith(sentTitle('My Brand'));
  });

  it.each([
    ['inner spaces', 'My   Brand'],
    ['accents', 'Café Ñandú'],
    ['symbols and emoji', 'Brand & Co. 🚀'],
  ])('keeps %s untouched', (_, value) => {
    const onChange = jest.fn();
    render(<BrandForm onChange={onChange} />);

    typeTitle(value);

    expect(onChange).toHaveBeenLastCalledWith(sentTitle(value));
  });

  it.each([
    ['empty', ''],
    ['whitespace only', '   '],
  ])('sends an empty title, with no error, when the title is %s', (_, value) => {
    const onChange = jest.fn();
    render(<BrandForm onChange={onChange} />);
    typeTitle('My Brand');

    typeTitle(value);

    expect(onChange).toHaveBeenLastCalledWith(sentTitle(''));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getInput()).toBeEnabled();
  });
});

// Spec: specs/cover.md — a new logo waits for Apply
describe('BrandForm – logo waits for Apply', () => {
  function makeFile(name = 'logo.png', type = 'image/png') {
    return new File([new Uint8Array(1)], name, { type });
  }

  it('reports a pending logo, and sends it only after Apply', () => {
    const onChange = jest.fn();
    const onPendingChange = jest.fn();
    const { rerender } = render(
      <BrandForm onChange={onChange} applyCount={0} onPendingChange={onPendingChange} />,
    );

    fireEvent.change(screen.getByLabelText('Logo', { selector: 'input' }), {
      target: { files: [makeFile('brand.png')] },
    });

    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    expect(onChange).not.toHaveBeenCalled(); // nothing the Cover shows has changed yet

    rerender(<BrandForm onChange={onChange} applyCount={1} onPendingChange={onPendingChange} />);

    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ logo: { url: 'blob:brand.png', name: 'brand.png', size: 'Medium' } }),
    );
  });
});
