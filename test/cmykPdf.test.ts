import { deflateSync } from 'zlib';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { cmykPdfBytes } from '../src/export/createPdf';

// Spec: specs/export.md, Scenario 12 — the PDF itself, built with the real pdf-lib (ADR 0019).
// The server's pages are stood in for by tiny CMYK images compressed the same way.
function cmykPage(width: number, height: number, ink: [number, number, number, number]) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) pixels.set(ink, i * 4);
  return { width, height, bytes: new Uint8Array(deflateSync(pixels)) };
}

function images(pdf: PDFDocument) {
  return pdf.context
    .enumerateIndirectObjects()
    .map(([, object]) => object)
    .filter((object): object is PDFRawStream => object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
}

describe('Export – the CMYK print PDF', () => {
  it('has one A4 page per page, each one filled by a DeviceCMYK image', async () => {
    const pages = [cmykPage(2, 3, [0, 0, 0, 0]), cmykPage(2, 3, [10, 20, 30, 40])];
    const pdf = await PDFDocument.load(await cmykPdfBytes(pages, 'portrait'));

    expect(pdf.getPageCount()).toBe(2);
    for (const page of pdf.getPages()) {
      expect(page.getWidth()).toBeCloseTo(595.28, 1);
      expect(page.getHeight()).toBeCloseTo(841.89, 1);
    }
    const [first, second] = images(pdf);
    expect(images(pdf)).toHaveLength(2);
    expect(first.dict.get(PDFName.of('ColorSpace'))).toBe(PDFName.of('DeviceCMYK'));
    expect(first.dict.get(PDFName.of('Filter'))).toBe(PDFName.of('FlateDecode'));
    expect(first.dict.get(PDFName.of('Width'))?.toString()).toBe('2');
    expect(first.dict.get(PDFName.of('Height'))?.toString()).toBe('3');
    expect(first.dict.get(PDFName.of('BitsPerComponent'))?.toString()).toBe('8');
    // The server's bytes go in as they are, not compressed again
    expect([...second.getContents()]).toEqual([...pages[1].bytes]);
  });

  it('lies down in Landscape', async () => {
    const pdf = await PDFDocument.load(await cmykPdfBytes([cmykPage(3, 2, [0, 0, 0, 0])], 'landscape'));
    const [page] = pdf.getPages();
    expect(page.getWidth()).toBeCloseTo(841.89, 1);
    expect(page.getHeight()).toBeCloseTo(595.28, 1);
  });
});
