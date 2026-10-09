import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { NAV_ITEMS } from '../src/data/navItems';
import { clickSave, fillRequiredCoverFields, typeTitle } from './coverForm';

function getMenu() {
  return within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });
}

function getMenuLink(name: string) {
  return within(getMenu()).getByRole('link', { name });
}

function getCover() {
  return within(screen.getByRole('region', { name: 'Manual preview' })).getByRole('article', {
    name: 'Cover',
  });
}

// Spec: specs/navmenu.md, Section 2 — Interface
describe('NavMenu – interface', () => {
  it('shows the Home and Brand Manual links in the header', () => {
    renderApp('/');

    expect(getMenuLink('Home')).toHaveAttribute('href', '/');
    expect(getMenuLink('Brand Manual')).toHaveAttribute('href', '/brand-manual');
  });
});

// Spec: specs/navmenu.md, Section 4 — Invariants (the menu grows from the list)
describe('NavMenu – built from the sections list', () => {
  it('shows exactly the sections in NAV_ITEMS, in the same order', () => {
    renderApp('/');

    const links = within(getMenu()).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual(
      NAV_ITEMS.map((item) => [item.label, item.path]),
    );
  });
});

// Spec: specs/navmenu.md, Scenario 1 — Opening the App
describe('NavMenu – opening the app', () => {
  it('shows Home and marks it as the current page', () => {
    // Given / When
    renderApp('/');

    // Then
    expect(screen.getByRole('heading', { name: 'ManuallyInstant' })).toBeInTheDocument();
    expect(getMenuLink('Home')).toHaveAttribute('aria-current', 'page');
    expect(getMenuLink('Brand Manual')).not.toHaveAttribute('aria-current');
  });
});

// Spec: specs/navmenu.md, Scenario 2 — Going to the Brand Manual
describe('NavMenu – going to the Brand Manual', () => {
  it('shows the title form and moves the highlight', () => {
    // Given
    renderApp('/');

    // When
    fireEvent.click(getMenuLink('Brand Manual'));

    // Then
    expect(screen.getByLabelText('Brand manual title')).toBeInTheDocument();
    expect(getMenuLink('Brand Manual')).toHaveAttribute('aria-current', 'page');
    expect(getMenuLink('Home')).not.toHaveAttribute('aria-current');
  });
});

// Spec: specs/navmenu.md, Scenario 3 — Starting from Home
describe('NavMenu – starting from Home', () => {
  it('opens the Brand Manual from the welcome link', () => {
    // Given
    renderApp('/');

    // When
    fireEvent.click(screen.getByRole('link', { name: 'Start your brand manual' }));

    // Then
    expect(screen.getByLabelText('Brand manual title')).toBeInTheDocument();
  });
});

// Spec: specs/navmenu.md, Scenario 4 — Title Is Kept Between Pages
describe('NavMenu – title is kept between pages', () => {
  it('keeps the saved title when going to Home and back', () => {
    // Given: a saved title
    renderApp('/brand-manual');
    typeTitle('My Brand');
    fillRequiredCoverFields();
    clickSave();

    // When: on Home the Brand Manual page is gone...
    fireEvent.click(getMenuLink('Home'));
    expect(screen.queryByLabelText('Brand manual title')).not.toBeInTheDocument();

    // ...Then: back on Brand Manual, the Cover still shows the title
    fireEvent.click(getMenuLink('Brand Manual'));
    expect(getCover()).toHaveTextContent('My Brand');
  });
});

// Spec: specs/navmenu.md, Section 2 — Interface (Logo) + Scenario 6 — Logo Goes Home
describe('Header – logo', () => {
  function getLogoLink() {
    const logo = within(screen.getByRole('banner')).getByRole('img', { name: 'ManuallyInstant' });
    return logo.closest('a') as HTMLElement;
  }

  it('shows the logo in the header, outside the menu, linking to Home', () => {
    renderApp('/brand-manual');

    expect(getLogoLink()).toHaveAttribute('href', '/');
    expect(getMenu()).not.toContainElement(getLogoLink());
  });

  it('goes to Home when the logo is clicked', () => {
    // Given
    renderApp('/brand-manual');

    // When
    fireEvent.click(getLogoLink());

    // Then
    expect(screen.getByRole('heading', { name: 'ManuallyInstant' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Brand manual title')).not.toBeInTheDocument();
  });
});

// Spec: specs/navmenu.md, Scenario 5 — Unknown URL
describe('NavMenu – unknown URL', () => {
  it('redirects to Home', () => {
    renderApp('/does-not-exist');

    expect(screen.getByRole('heading', { name: 'ManuallyInstant' })).toBeInTheDocument();
    expect(getMenuLink('Home')).toHaveAttribute('aria-current', 'page');
  });
});
