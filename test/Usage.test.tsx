import { fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { getApplyButton, makeLogo } from './coverForm';

// Spec: specs/usage.md

function openUsage() {
  fireEvent.click(screen.getByRole('button', { name: /3\. Usage/ }));
}

// Searched inside the form: label queries over the whole app are slow (see coverForm.ts)
function usageForm() {
  return within(screen.getByRole('form', { name: 'Usage' }));
}

function group(name: 'Correct use' | 'Incorrect use') {
  return within(usageForm().getByRole('group', { name }));
}

function typeDescription(example: string, value: string) {
  fireEvent.change(usageForm().getByLabelText(`${example} description`), { target: { value } });
}

function page(name: 'Correct use' | 'Incorrect use') {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', { name });
}

function grid(name: 'Correct use' | 'Incorrect use') {
  return within(page(name)).getByRole('list', { name });
}

function previewOrder() {
  return within(screen.getByRole('region', { name: 'Manual preview' }))
    .getAllByRole('article')
    .map((article) => article.getAttribute('aria-label'));
}

describe('Usage – form and pages', () => {
  // Scenario 1
  it('starts with four empty examples per group, their suggestions, and both placeholders', () => {
    renderApp();
    openUsage();

    for (const name of ['Correct use', 'Incorrect use'] as const) {
      expect(group(name).getAllByRole('button', { name: new RegExp(`^${name} example \\d$`) })).toHaveLength(4);
    }
    expect(usageForm().getByLabelText('Incorrect use example 1 description')).toHaveAttribute(
      'placeholder',
      "Don't stretch the logo",
    );
    expect(usageForm().getByLabelText('Correct use example 2 description')).toHaveAttribute('placeholder', 'On a dark background');
    expect(page('Correct use')).toHaveTextContent('Your correct uses');
    expect(page('Incorrect use')).toHaveTextContent('Your incorrect uses');
  });

  // Scenario 2
  it("shows a description at once, on its own group's page only", () => {
    renderApp();
    openUsage();

    typeDescription('Incorrect use example 1', "Don't stretch the logo");

    const examples = within(grid('Incorrect use')).getAllByRole('listitem', { name: 'Incorrect use' });
    expect(examples).toHaveLength(4);
    expect(examples[0]).toHaveTextContent("Don't stretch the logo");
    expect(examples[0]).toHaveTextContent('✕');
    expect(page('Correct use')).toHaveTextContent('Your correct uses');
  });

  // Scenario 3
  it('shows a new image after Apply, with its description as text alternative', () => {
    renderApp();
    openUsage();
    typeDescription('Incorrect use example 1', "Don't stretch the logo");
    const apply = () => getApplyButton('Apply Incorrect use example 1 image');
    expect(apply()).toBeDisabled();

    fireEvent.change(usageForm().getByLabelText('Incorrect use example 1 image', { selector: 'input' }), {
      target: { files: [makeLogo('stretched.png')] },
    });

    expect(apply()).toBeEnabled();
    expect(within(page('Incorrect use')).queryByRole('img')).not.toBeInTheDocument();

    fireEvent.click(apply());

    expect(within(page('Incorrect use')).getByRole('img', { name: "Don't stretch the logo" })).toHaveAttribute(
      'src',
      'blob:stretched.png',
    );
    expect(apply()).toBeDisabled();
  });

  // Scenario 4
  it('adds examples up to six, and the grid follows the count', () => {
    renderApp();
    openUsage();
    const add = group('Incorrect use').getByRole('button', { name: 'Add example to Incorrect use' });

    fireEvent.click(add);
    expect(grid('Incorrect use')).toHaveAttribute('data-count', '5');
    fireEvent.click(add);
    expect(grid('Incorrect use')).toHaveAttribute('data-count', '6');

    expect(add).toBeDisabled();
    expect(grid('Incorrect use')).toHaveAttribute('data-orientation', 'portrait');
  });

  // Scenario 5
  it('removes examples down to one, then hides Remove', () => {
    renderApp();
    openUsage();

    for (let i = 0; i < 3; i++) {
      fireEvent.click(group('Correct use').getAllByRole('button', { name: /^Remove Correct use example/, hidden: true })[0]);
    }

    expect(grid('Correct use')).toHaveAttribute('data-count', '1');
    expect(group('Correct use').queryAllByRole('button', { name: /^Remove/, hidden: true })).toHaveLength(0);
    // The other group is untouched
    expect(page('Incorrect use')).toHaveTextContent('Your incorrect uses');
  });

  // Scenario 6
  it('makes the page of the group being worked in the main one', () => {
    renderApp();
    openUsage();
    expect(previewOrder().slice(0, 2)).toEqual(['Correct use', 'Incorrect use']);

    fireEvent.click(usageForm().getByRole('group', { name: 'Incorrect use' }));

    expect(previewOrder().slice(0, 2)).toEqual(['Incorrect use', 'Correct use']);
    // Reopening the section starts again on Correct use
    fireEvent.click(screen.getByRole('button', { name: /3\. Usage/ }));
    openUsage();
    expect(previewOrder()[0]).toBe('Correct use');
  });

  // Scenario 7
  it('tells the grid the orientation, so three examples sit in a row in landscape', () => {
    renderApp();
    openUsage();
    fireEvent.click(group('Correct use').getAllByRole('button', { name: /^Remove Correct use example/, hidden: true })[0]);

    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));

    expect(grid('Correct use')).toHaveAttribute('data-count', '3');
    expect(grid('Correct use')).toHaveAttribute('data-orientation', 'landscape');
  });

  // Scenario 8 (where things sit is CSS, checked in the browser): the same header and grid
  it('keeps the brand name, the heading and the grid in Template 3', () => {
    renderApp();
    const logo = within(screen.getByRole('form', { name: 'Logo' }));
    fireEvent.change(logo.getByLabelText('Brand name'), { target: { value: 'VOLTA' } });
    openUsage();
    typeDescription('Incorrect use example 1', "Don't stretch the logo");

    fireEvent.click(screen.getByRole('radio', { name: 'Template 3' }));

    expect(page('Incorrect use')).toHaveTextContent('VOLTA');
    expect(within(page('Incorrect use')).getByText('Incorrect use', { selector: '.logo-page-heading' })).toBeInTheDocument();
    expect(grid('Incorrect use')).toBeInTheDocument();
  });

  // Scenario 10
  it('flags a wrong file at once and never turns Apply on', () => {
    renderApp();
    openUsage();
    fireEvent.click(group('Correct use').getByRole('button', { name: 'Correct use example 2' }));

    fireEvent.change(usageForm().getByLabelText('Correct use example 2 image', { selector: 'input' }), {
      target: { files: [makeLogo('rules.pdf', 'application/pdf')] },
    });

    expect(usageForm().getByText('Use a PNG, JPG, SVG or WebP image')).toBeInTheDocument();
    expect(getApplyButton('Apply Correct use example 2 image')).toBeDisabled();
  });
});

// Spec: specs/usage.md, "Apply and the PDFs" — each example has its own Apply (ADR 0020)
describe('Usage – one Apply per example', () => {
  it('shows only the image of the example whose Apply is clicked', () => {
    renderApp();
    openUsage();
    typeDescription('Incorrect use example 1', 'Stretched');
    fireEvent.change(usageForm().getByLabelText('Incorrect use example 1 image', { selector: 'input' }), {
      target: { files: [makeLogo('stretched.png')] },
    });
    fireEvent.click(group('Incorrect use').getByRole('button', { name: 'Incorrect use example 2' }));
    typeDescription('Incorrect use example 2', 'Rotated');
    fireEvent.change(usageForm().getByLabelText('Incorrect use example 2 image', { selector: 'input' }), {
      target: { files: [makeLogo('rotated.png')] },
    });

    fireEvent.click(getApplyButton('Apply Incorrect use example 2 image'));

    const images = within(page('Incorrect use')).getAllByRole('img');
    expect(images.map((image) => image.getAttribute('src'))).toEqual(['blob:rotated.png']);
    expect(getApplyButton('Apply Incorrect use example 1 image')).toBeEnabled();
  });
});
