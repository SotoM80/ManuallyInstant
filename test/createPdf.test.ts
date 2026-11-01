import { getFontEmbedCSS, toJpeg } from 'html-to-image';
import { createPdf } from '../src/export/createPdf';

// Spec: specs/export.md ("In the code"). jsdom cannot draw, so html-to-image and jsPDF are
// mocked; the test checks which element the fonts are taken from.
jest.mock('html-to-image', () => ({
  getFontEmbedCSS: jest.fn(async () => '@font-face {}'),
  toJpeg: jest.fn(async () => 'data:image/jpeg;base64,'),
  toPng: jest.fn(async () => 'data:image/png;base64,'),
}));
jest.mock('jspdf', () => ({
  jsPDF: jest.fn(() => ({ addPage: jest.fn(), addImage: jest.fn(), save: jest.fn() })),
}));

it('embeds the fonts of every page, not only the first one\'s', async () => {
  const list = document.createElement('ol');
  list.className = 'manual-pages';
  const pages = ['Cover', 'Typography'].map((name) => {
    const page = document.createElement('li');
    page.textContent = name;
    list.append(page);
    return page;
  });

  await createPdf(pages, 'web', 'portrait', 'my-brand-web.pdf');

  expect(getFontEmbedCSS).toHaveBeenCalledWith(list);
  expect(toJpeg).toHaveBeenCalledTimes(2);
  expect(toJpeg).toHaveBeenCalledWith(pages[1], expect.objectContaining({ fontEmbedCSS: '@font-face {}' }));
});
