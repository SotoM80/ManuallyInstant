import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { clickSave, fillRequiredCoverFields, typeTitle } from './coverForm';

function getPreview() {
  return screen.getByRole('region', { name: 'Manual preview' });
}

function getCover() {
  return within(getPreview()).getByRole('article', { name: 'Cover' });
}

function getTemplateGroup() {
  return within(getPreview()).getByRole('group', { name: 'Template' });
}

function selectTemplate(name: string) {
  fireEvent.click(within(getTemplateGroup()).getByRole('radio', { name }));
}

function saveCover() {
  typeTitle('My Brand');
  fillRequiredCoverFields();
  clickSave();
}

// Spec: specs/templates.md, Scenario 1 — Template 1 by Default
describe('Templates – default', () => {
  it('offers Template 1, 2 and 3, with Template 1 selected', () => {
    renderApp();

    const options = within(getTemplateGroup()).getAllByRole('radio');
    expect(options.map((option) => option.getAttribute('value'))).toEqual([
      'template1',
      'template2',
      'template3',
    ]);
    expect(within(getTemplateGroup()).getByRole('radio', { name: 'Template 1' })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-template', 'template1');
  });
});

// Spec: specs/templates.md, Scenario 2 — Changing the Template
describe('Templates – changing the template', () => {
  it.each([
    ['Template 2', 'template2'],
    ['Template 3', 'template3'],
  ])('switches to %s without Save and keeps the saved content', (name, id) => {
    // Given: a saved Cover
    renderApp();
    saveCover();

    // When
    selectTemplate(name);

    // Then
    expect(within(getTemplateGroup()).getByRole('radio', { name })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-template', id);
    expect(within(getCover()).getByText('My Brand')).toBeInTheDocument();
    expect(within(getCover()).getByRole('img', { name: 'Logo' })).toBeInTheDocument();
    expect(within(getCover()).getByText('Designed by Studio X')).toBeInTheDocument();
  });
});

// Spec: specs/templates.md, Scenario 3 — Template Is Kept Between Pages
describe('Templates – kept between pages', () => {
  it('keeps Template 3 after going to Home and back', () => {
    // Given
    renderApp();
    selectTemplate('Template 3');
    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });

    // When
    fireEvent.click(within(menu).getByRole('link', { name: 'Home' }));
    fireEvent.click(within(menu).getByRole('link', { name: 'Brand Manual' }));

    // Then
    expect(within(getTemplateGroup()).getByRole('radio', { name: 'Template 3' })).toBeChecked();
    expect(getPreview()).toHaveAttribute('data-template', 'template3');
  });
});

// Spec: specs/templates.md, Scenario 4 — Template, Orientation and View Combine
describe('Templates – combine with orientation and view', () => {
  it('keeps the template when orientation and view change', () => {
    renderApp();
    selectTemplate('Template 2');

    fireEvent.click(screen.getByRole('radio', { name: 'Landscape' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Pages' }));

    expect(getPreview()).toHaveAttribute('data-template', 'template2');
    expect(getPreview()).toHaveAttribute('data-view', 'pages');
    expect(getCover()).toHaveAttribute('data-orientation', 'landscape');
  });
});
