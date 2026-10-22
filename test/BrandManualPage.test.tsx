import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { orderPages } from '../src/data/manualSections';
import { fillRequiredCoverFields, getApplyButton, pickSwatch, typeTitle } from './coverForm';

// The manual's pages, in order (the Logo section fills pages 2 to 5, Usage pages 6 and 7)
const ALL_PAGES = [
  'Cover',
  'Brand concept',
  'Anatomy',
  'Logo versions',
  'Clear space',
  'Correct use',
  'Incorrect use',
  'Color palette',
  'Typography',
  'Mockups',
];

function getPreview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function getSections() {
  return screen.getByRole('region', { name: 'Manual sections' });
}

function getCover() {
  return within(getPreview()).getByRole('article', { name: 'Cover' });
}

// Spec: specs/brandmanual.md, Scenario 1 — Page Layout
describe('Brand Manual – layout', () => {
  it('shows the preview first (left) and the sections second (right)', () => {
    renderApp('/brand-manual');

    const isPreviewFirst =
      getPreview().compareDocumentPosition(getSections()) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(isPreviewFirst).toBeTruthy();
  });
});

// Spec: specs/brandmanual.md, Scenario 2 — All Sections Listed
describe('Brand Manual – sections column', () => {
  it('lists every section in order, all of them built', () => {
    renderApp('/brand-manual');

    const items = within(getSections()).getAllByRole('listitem');
    const headings = items.map((item) => within(item).getByRole('heading').textContent);
    expect(headings).toEqual(['1. Cover', '2. Logo', '3. Usage', '4. Colors', '5. Typography', '6. Skin', '7. Mockups']);

    // Built sections open with a click on their title (unbuilt ones have no button)
    for (const [index, item] of items.entries()) {
      expect(within(item).getByRole('button', { name: headings[index] as string })).toBeInTheDocument();
    }
  });

  it('puts the cover form inside the Cover section', () => {
    renderApp('/brand-manual');

    const [coverSection] = within(getSections()).getAllByRole('listitem');
    expect(within(coverSection).getByLabelText('Brand manual title')).toBeInTheDocument();
    expect(within(coverSection).getByLabelText('Designed by')).toBeInTheDocument();
    expect(within(coverSection).getByLabelText('Logo')).toBeInTheDocument();
  });
});

// Spec: specs/brandmanual.md, Scenario 3 — All Pages Previewed
describe('Brand Manual – preview column', () => {
  it('shows the eight manual pages in order', () => {
    renderApp('/brand-manual');

    const pages = within(getPreview()).getAllByRole('article');
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(ALL_PAGES);
  });
});

// Spec: specs/brandmanual.md, Scenario 4 — Cover Shows the Title Live
describe('Brand Manual – cover preview', () => {
  it('shows the title with its style on the Cover as it is typed', () => {
    // Given
    renderApp('/brand-manual');
    expect(getCover()).toHaveTextContent('Your brand manual title');

    // When
    typeTitle('My Brand');
    pickSwatch('Title color', 'Blue');

    // Then
    const title = within(getCover()).getByText('My Brand');
    expect(title).toHaveStyle({ color: '#1E88E5' });
    expect(getCover()).not.toHaveTextContent('Your brand manual title');
  });

  // Spec: specs/brandmanual.md, Scenario 5 — Only new images wait for Apply
  it('puts Apply above the Cover section, disabled until an image is chosen', () => {
    renderApp('/brand-manual');

    const apply = within(getSections()).getByRole('button', { name: 'Apply' });
    const cover = within(getSections()).getByRole('button', { name: '1. Cover' });
    expect(apply.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(getPreview()).queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    expect(apply).toBeDisabled();

    fillRequiredCoverFields();
    expect(apply).toBeEnabled();
  });
});

// Spec: specs/brandmanual.md, Section 2 — Page Orientation
describe('Brand Manual – page orientation', () => {
  function getOrientationGroup() {
    return within(getPreview()).getByRole('group', { name: 'Page orientation' });
  }

  function getPageOrientations() {
    return within(getPreview())
      .getAllByRole('article')
      .map((page) => page.getAttribute('data-orientation'));
  }

  it('starts in Portrait', () => {
    renderApp('/brand-manual');

    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Portrait' })).toBeChecked();
    expect(getPageOrientations()).toEqual(Array(ALL_PAGES.length).fill('portrait'));
  });

  // Spec: specs/brandmanual.md, Scenario 6 — Changing the Page Orientation
  it('turns every page landscape when Landscape is selected, without Save', () => {
    // Given
    renderApp('/brand-manual');

    // When
    fireEvent.click(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' }));

    // Then
    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' })).toBeChecked();
    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Portrait' })).not.toBeChecked();
    expect(getPageOrientations()).toEqual(Array(ALL_PAGES.length).fill('landscape'));
  });

  // Spec: specs/brandmanual.md, Scenario 7 — Orientation Is Kept Between Pages
  it('keeps Landscape after going to Home and back', () => {
    // Given
    renderApp('/brand-manual');
    fireEvent.click(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' }));
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    // When
    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    // Then
    expect(within(getOrientationGroup()).getByRole('radio', { name: 'Landscape' })).toBeChecked();
    expect(getPageOrientations()).toEqual(Array(ALL_PAGES.length).fill('landscape'));
  });
});

// Spec: specs/brandmanual.md, Section 2 — Preview View
describe('Brand Manual – preview view', () => {
  function getViewGroup() {
    return within(getPreview()).getByRole('group', { name: 'Preview view' });
  }

  function selectView(name: 'Grid' | 'Overview' | 'Pages') {
    fireEvent.click(within(getViewGroup()).getByRole('radio', { name }));
  }

  it('starts in Grid', () => {
    renderApp('/brand-manual');

    expect(within(getViewGroup()).getByRole('radio', { name: 'Grid' })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'grid');
  });

  // Spec: specs/brandmanual.md, Scenario 8 — Changing the Preview View
  it('shows the pages one below the other when Pages is selected, without Save', () => {
    // Given
    renderApp('/brand-manual');
    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));

    // When
    selectView('Pages');

    // Then
    expect(within(getViewGroup()).getByRole('radio', { name: 'Pages' })).toBeChecked();
    expect(within(getViewGroup()).getByRole('radio', { name: 'Grid' })).not.toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'pages');

    const pages = within(getPreview()).getAllByRole('article');
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(ALL_PAGES);
    expect(pages.map((page) => page.getAttribute('data-orientation'))).toEqual(Array(ALL_PAGES.length).fill('landscape'));
  });

  // Spec: specs/brandmanual.md, Scenario 8b — Overview Shows Four Pages Per Row
  it('shows every page in the Overview when it is selected, without Save', () => {
    // Given
    renderApp('/brand-manual');

    // When
    selectView('Overview');

    // Then
    expect(within(getViewGroup()).getByRole('radio', { name: 'Overview' })).toBeChecked();
    expect(within(getViewGroup()).getByRole('radio', { name: 'Grid' })).not.toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'overview');
    expect(
      within(getPreview())
        .getAllByRole('article')
        .map((page) => page.getAttribute('aria-label')),
    ).toEqual(ALL_PAGES);
  });

  // Spec: specs/brandmanual.md, Scenario 9 — Preview View Is Kept Between Pages
  it('keeps Pages after going to Home and back', () => {
    // Given
    renderApp('/brand-manual');
    selectView('Pages');
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    // When
    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    // Then
    expect(within(getViewGroup()).getByRole('radio', { name: 'Pages' })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-view', 'pages');
  });
});

// Spec: specs/brandmanual.md, Section 2 — Opening and Folding Sections (Scenarios 10 to 12)
describe('Brand Manual – sections accordion', () => {
  function getToggle(name: string) {
    return within(getSections()).getByRole('button', { name });
  }

  function expanded() {
    return ['1. Cover', '2. Logo', '3. Usage', '4. Colors', '5. Typography', '6. Skin', '7. Mockups'].map((name) =>
      getToggle(name).getAttribute('aria-expanded'),
    );
  }

  it('starts with only Cover open', () => {
    renderApp('/brand-manual');

    expect(expanded()).toEqual(['true', 'false', 'false', 'false', 'false', 'false', 'false']);
  });

  it('opens a section with a click on its title and folds the open one', () => {
    renderApp('/brand-manual');

    fireEvent.click(getToggle('4. Colors'));

    expect(expanded()).toEqual(['false', 'false', 'false', 'true', 'false', 'false', 'false']);
    const colorsBody = document.getElementById(getToggle('4. Colors').getAttribute('aria-controls') as string);
    expect(colorsBody).not.toHaveAttribute('inert');
    const coverBody = document.getElementById(getToggle('1. Cover').getAttribute('aria-controls') as string);
    expect(coverBody).toHaveAttribute('inert');
  });

  it('folds every section when the open one is clicked', () => {
    renderApp('/brand-manual');

    fireEvent.click(getToggle('1. Cover'));

    expect(expanded()).toEqual(['false', 'false', 'false', 'false', 'false', 'false', 'false']);
  });

  it('keeps what was typed in a section while it is folded', () => {
    renderApp('/brand-manual');
    typeTitle('My Brand');

    fireEvent.click(getToggle('5. Typography'));
    fireEvent.click(getToggle('1. Cover'));

    expect(screen.getByLabelText('Brand manual title')).toHaveValue('My Brand');
  });
});

// Spec: specs/brandmanual.md, Section 2 — The open section's pages come first
describe('Brand Manual – open section first', () => {
  function openSection(name: string) {
    fireEvent.click(within(getSections()).getByRole('button', { name }));
  }

  function pageOrder() {
    return within(getPreview())
      .getAllByRole('article')
      .map((page) => page.getAttribute('aria-label'));
  }

  it('puts the featured pages first in the order given, then the rest in their natural order', () => {
    expect(orderPages(['Anatomy', 'Brand concept'])).toEqual([
      'Anatomy',
      'Brand concept',
      'Cover',
      'Logo versions',
      'Clear space',
      'Correct use',
      'Incorrect use',
      'Color palette',
      'Typography',
      'Mockups',
    ]);
    expect(orderPages([])).toEqual(ALL_PAGES);
  });

  it('starts in the natural order with Cover open, and Apply disabled', () => {
    renderApp('/brand-manual');

    expect(pageOrder()).toEqual(ALL_PAGES);
    expect(getApplyButton()).toBeDisabled();
  });

  it('moves the Typography page to the top when its section opens, keeping its number', () => {
    renderApp('/brand-manual');

    openSection('5. Typography');

    expect(pageOrder()[0]).toBe('Typography');
    const first = within(getPreview()).getAllByRole('listitem')[0];
    expect(first).toHaveAttribute('data-featured', 'true');
    expect(first).toHaveTextContent('9. Typography');
  });

  it('moves the four Logo pages to the top, in their order', () => {
    renderApp('/brand-manual');

    openSection('2. Logo');

    expect(pageOrder().slice(0, 4)).toEqual(['Brand concept', 'Anatomy', 'Logo versions', 'Clear space']);
    expect(pageOrder()[4]).toBe('Cover');
  });

  it('puts every page back in its natural order when the section is folded', () => {
    renderApp('/brand-manual');
    openSection('4. Colors');

    openSection('4. Colors'); // fold it

    expect(pageOrder()).toEqual(ALL_PAGES);
  });

  it('swaps the pages at the top when another section opens', () => {
    renderApp('/brand-manual');
    openSection('4. Colors');

    openSection('5. Typography');

    expect(pageOrder().slice(0, 2)).toEqual(['Typography', 'Cover']);
  });

  it('does not use Apply to reorder: Apply stays off while a section is open', () => {
    renderApp('/brand-manual');

    openSection('5. Typography');

    expect(getApplyButton()).toBeDisabled();
  });

  it('makes the pages glide to their new places when the order changes', () => {
    // jsdom has no layout: each item is placed 100px below the one before it
    const animate = jest.fn();
    Element.prototype.animate = animate;
    const rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const index = this.parentElement ? Array.from(this.parentElement.children).indexOf(this) : 0;
      return { left: 0, top: index * 100 } as DOMRect;
    });
    renderApp('/brand-manual');

    openSection('5. Typography');

    // Typography went from 9th to 1st: it starts 800px lower and glides up
    const typography = within(getPreview()).getAllByRole('listitem')[0];
    const call = animate.mock.calls.find((_, i) => animate.mock.contexts[i] === typography);
    expect(call?.[0][0]).toEqual({ transform: 'translate(0px, 800px)' });
    expect(call?.[1]).toEqual(expect.objectContaining({ duration: 500 }));

    rect.mockRestore();
    delete (Element.prototype as Partial<Element>).animate;
  });
});

// Spec: specs/brandmanual.md, Section 2 — The open section moves up beside its page
describe('Brand Manual – open section beside its page', () => {
  function openSection(name: string) {
    fireEvent.click(within(getSections()).getByRole('button', { name }));
  }

  function sectionOrder() {
    return within(getSections())
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent);
  }

  function offset() {
    return (document.querySelector('.brand-manual-page') as HTMLElement).style.getPropertyValue(
      '--sections-offset',
    );
  }

  it('moves the open section to the top of its column, keeping its number', () => {
    renderApp('/brand-manual');

    openSection('5. Typography');

    expect(sectionOrder()).toEqual(['5. Typography', '1. Cover', '2. Logo', '3. Usage', '4. Colors', '6. Skin', '7. Mockups']);
  });

  it('puts every section back in order when it is folded', () => {
    renderApp('/brand-manual');
    openSection('5. Typography');

    openSection('5. Typography');

    expect(sectionOrder()).toEqual(['1. Cover', '2. Logo', '3. Usage', '4. Colors', '5. Typography', '6. Skin', '7. Mockups']);
  });

  it('keeps what was typed when its section moves', () => {
    renderApp('/brand-manual');
    typeTitle('My Brand');

    openSection('4. Colors');
    openSection('1. Cover');

    expect(screen.getByLabelText('Brand manual title')).toHaveValue('My Brand');
  });

  describe('alignment', () => {
    // jsdom has no layout: the page list starts at 140px and the section list at 60px
    let rect: jest.SpyInstance;
    beforeEach(() => {
      rect = jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element,
      ) {
        if (this.classList.contains('manual-pages')) return { top: 140, left: 0 } as DOMRect;
        if (this.parentElement?.classList.contains('manual-sections')) return { top: 60, left: 0 } as DOMRect;
        return { top: 0, left: 0 } as DOMRect;
      });
    });
    afterEach(() => rect.mockRestore());

    it('pushes the sections down so the open one starts at the height of its page', () => {
      renderApp('/brand-manual');

      openSection('5. Typography');

      expect(offset()).toBe('80px');
    });

    it('keeps the same offset when the page is scrolled and the preview is stuck', () => {
      rect.mockImplementation(function (this: Element) {
        if (this.classList.contains('manual-preview')) return { top: 16, left: 0 } as DOMRect;
        if (this.classList.contains('manual-pages')) return { top: 156, left: 0 } as DOMRect;
        if (this.classList.contains('manual-sections')) return { top: -2000, left: 0 } as DOMRect;
        if (this.parentElement?.classList.contains('manual-sections')) return { top: -1940, left: 0 } as DOMRect;
        return { top: 0, left: 0 } as DOMRect;
      });
      window.scrollBy = jest.fn(); // opening a section scrolled out of view brings it back (jsdom has no scrolling)
      renderApp('/brand-manual');

      openSection('6. Skin');

      expect(offset()).toBe('80px');
    });

    it('does not align when every section is folded', () => {
      renderApp('/brand-manual');

      openSection('1. Cover'); // Cover starts open: fold it

      expect(offset()).toBe('');
    });
  });
});

// Spec: specs/brandmanual.md, Section 2 — The area being worked in decides the main Logo page
describe('Brand Manual – Logo areas', () => {
  function openLogo() {
    fireEvent.click(within(getSections()).getByRole('button', { name: '2. Logo' }));
  }

  function pageOrder() {
    return within(getPreview())
      .getAllByRole('article')
      .map((page) => page.getAttribute('aria-label'));
  }

  function featuredPages() {
    return within(getPreview())
      .getAllByRole('listitem')
      .filter((item) => item.getAttribute('data-featured') === 'true')
      .map((item) => item.querySelector('article')?.getAttribute('aria-label'));
  }

  it('starts with Brand concept as the main page when Logo opens', () => {
    renderApp('/brand-manual');

    openLogo();

    expect(pageOrder().slice(0, 4)).toEqual(['Brand concept', 'Anatomy', 'Logo versions', 'Clear space']);
    expect(featuredPages()).toEqual(['Brand concept']);
  });

  it('makes Logo versions the main page when the user types in Versions', () => {
    renderApp('/brand-manual');
    openLogo();

    fireEvent.focus(screen.getByLabelText('Version 1 name'));

    expect(pageOrder().slice(0, 4)).toEqual(['Logo versions', 'Brand concept', 'Anatomy', 'Clear space']);
    expect(featuredPages()).toEqual(['Logo versions']);
  });

  it('makes Anatomy the main page when the user clicks anywhere in its area', () => {
    renderApp('/brand-manual');
    openLogo();

    fireEvent.click(within(screen.getByRole('form', { name: 'Logo' })).getByRole('group', { name: 'Anatomy' }));

    expect(featuredPages()).toEqual(['Anatomy']);
    expect(pageOrder()[0]).toBe('Anatomy');
  });

  it('does not change the main page when the user only scrolls inside Logo', () => {
    renderApp('/brand-manual');
    openLogo();

    fireEvent.scroll(screen.getByRole('form', { name: 'Logo' }).parentElement as HTMLElement);

    expect(featuredPages()).toEqual(['Brand concept']);
  });
});
