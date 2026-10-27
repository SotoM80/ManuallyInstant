import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { PROJECTS, STUDIO } from '../src/data/landing';
import { openMailto } from '../src/utils/mailto';

// jsdom cannot open a mailto: link, so the tests only check which link would be opened.
jest.mock('../src/utils/mailto', () => ({
  ...jest.requireActual('../src/utils/mailto'),
  openMailto: jest.fn(),
}));

const mockedOpenMailto = openMailto as jest.Mock;

function getMenu() {
  return within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });
}

function getMenuLink(name: string) {
  return within(getMenu()).getByRole('link', { name });
}

// jsdom has no scrollIntoView; each test records which element was scrolled to.
let scrollIntoView: jest.Mock;
beforeEach(() => {
  scrollIntoView = jest.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  mockedOpenMailto.mockClear();
});

function lastScrolledTo() {
  return scrollIntoView.mock.contexts.at(-1);
}

// Spec: specs/landing.md, Scenario 1 — Every Section
describe('Landing – every section', () => {
  it('shows the studio name as the only h1 and every section in order', () => {
    // Given / When
    renderApp('/');

    // Then
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveAccessibleName(STUDIO.name);
    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      'About',
      'Services',
      'Work',
      'ManuallyInstant',
      'Contact',
    ]);
  });
});

// Spec: specs/landing.md, Scenario 2 — Menu to a Section (+ navmenu.md, Scenario 7)
describe('Landing – menu to a section', () => {
  it('opens Home from another page and scrolls to the section', () => {
    // Given
    renderApp('/brand-manual');

    // When
    fireEvent.click(getMenuLink('Work'));

    // Then
    const work = screen.getByRole('region', { name: 'Work' });
    expect(lastScrolledTo()).toBe(work);
    expect(getMenuLink('Home')).toHaveAttribute('aria-current', 'page');
    expect(getMenuLink('Work')).not.toHaveAttribute('aria-current');
  });

  it('gives each section link its anchor', () => {
    renderApp('/');

    expect(getMenuLink('About')).toHaveAttribute('href', '/#about');
    expect(getMenuLink('Services')).toHaveAttribute('href', '/#services');
    expect(getMenuLink('Work')).toHaveAttribute('href', '/#work');
    expect(getMenuLink('Contact')).toHaveAttribute('href', '/#contact');
  });

  it('goes to the top for an unknown section', () => {
    renderApp('/#nope');

    expect(lastScrolledTo()).toHaveAttribute('id', 'top');
  });
});

// Spec: specs/landing.md, Scenario 3 — Projects From the Data File
describe('Landing – projects', () => {
  it('shows every project with its client, category and year', () => {
    renderApp('/');

    const items = within(screen.getByRole('region', { name: 'Work' })).getAllByRole('listitem');
    expect(items).toHaveLength(PROJECTS.length);
    PROJECTS.forEach((project, index) => {
      expect(items[index]).toHaveTextContent(project.client);
      expect(items[index]).toHaveTextContent(`${project.category} · ${project.year}`);
    });
  });
});

// Spec: specs/landing.md, Scenario 4 — Start From the Landing
describe('Landing – start from the landing', () => {
  it('opens the Brand Manual from the Tool section', () => {
    renderApp('/');

    fireEvent.click(screen.getByRole('link', { name: 'Try ManuallyInstant' }));

    expect(screen.getByLabelText('Brand manual title')).toBeInTheDocument();
  });

  it('opens the Brand Manual from the Visual identity manuals service', () => {
    renderApp('/');

    const services = screen.getByRole('region', { name: 'Services' });
    fireEvent.click(within(services).getByRole('link', { name: /Visual identity manuals/ }));

    expect(screen.getByLabelText('Brand manual title')).toBeInTheDocument();
  });
});

describe('Landing – contact form', () => {
  function getContact() {
    return within(screen.getByRole('region', { name: 'Contact' }));
  }

  function fill(name: string, email: string, message: string) {
    fireEvent.change(getContact().getByLabelText('Name'), { target: { value: name } });
    fireEvent.change(getContact().getByLabelText('Email'), { target: { value: email } });
    fireEvent.change(getContact().getByLabelText('Message'), { target: { value: message } });
  }

  // Spec: specs/landing.md, Scenario 5 — Contact With Valid Data
  it('opens a mailto: link with the message already written', () => {
    // Given
    renderApp('/');
    fill('Ana', 'ana@studio.com', 'Hola & gracias');

    // When
    fireEvent.click(getContact().getByRole('button', { name: 'Send' }));

    // Then
    expect(mockedOpenMailto).toHaveBeenCalledTimes(1);
    const url = new URL(mockedOpenMailto.mock.calls[0][0]);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe(STUDIO.email);
    expect(url.searchParams.get('subject')).toBe('New project — Ana');
    expect(url.searchParams.get('body')).toBe('Hola & gracias\n\nAna · ana@studio.com');
    expect(getContact().getByRole('status')).toHaveTextContent(`write to ${STUDIO.email}`);
  });

  // Spec: specs/landing.md, Scenario 6 — Contact With an Invalid Email
  it('does not open the email app with an invalid email', () => {
    // Given
    renderApp('/');
    fill('Ana', 'ana@', 'Hola');

    // When
    fireEvent.click(getContact().getByRole('button', { name: 'Send' }));

    // Then
    expect(mockedOpenMailto).not.toHaveBeenCalled();
    const email = getContact().getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Please enter a valid email');
    expect(email).toHaveFocus();
  });

  it('asks for every empty field', () => {
    renderApp('/');

    fireEvent.click(getContact().getByRole('button', { name: 'Send' }));

    expect(mockedOpenMailto).not.toHaveBeenCalled();
    expect(getContact().getAllByText('Please fill in this field')).toHaveLength(3);
    expect(getContact().getByLabelText('Name')).toHaveFocus();
  });

  it('links to the studio email and opens social networks in a new tab', () => {
    renderApp('/');

    expect(getContact().getByRole('link', { name: STUDIO.email })).toHaveAttribute('href', `mailto:${STUDIO.email}`);
    expect(getContact().getByRole('link', { name: /Instagram/ })).toHaveAttribute('target', '_blank');
  });
});

// Spec: specs/navmenu.md, Scenario 8 — Menu Button on a Narrow Screen
describe('NavMenu – menu button on a narrow screen', () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 768px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  function getList() {
    return getMenu().querySelector('#nav-menu-list');
  }

  it('opens the list, then closes it after choosing a section', () => {
    // Given
    renderApp('/brand-manual');
    const button = within(getMenu()).getByRole('button', { name: 'Menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(getList()).toHaveAttribute('inert');

    // When: the user opens the menu...
    fireEvent.click(button);

    // ...Then it is open and reachable
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(getList()).not.toHaveAttribute('inert');

    // When: the user chooses Work
    fireEvent.click(getMenuLink('Work'));

    // Then: Home scrolls to Work and the list closes
    expect(lastScrolledTo()).toBe(screen.getByRole('region', { name: 'Work' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(getList()).toHaveAttribute('inert');
  });

  it('closes the list with Escape', () => {
    renderApp('/');
    const button = within(getMenu()).getByRole('button', { name: 'Menu' });
    fireEvent.click(button);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
