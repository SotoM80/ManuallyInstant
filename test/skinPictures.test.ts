import { skinPicturesReady } from '../src/export/skinPictures';

// Spec: specs/skins.md, "Image layers" — the check before the PDF is drawn (ADR 0023).
// jsdom loads no pictures, so each test says how they load.
function page(...urls: string[]) {
  const root = document.createElement('div');
  root.innerHTML = `<svg class="skin-layer">${urls.map((url) => `<g><image href="${url}"/></g>`).join('')}</svg>`;
  return root;
}

let loads: string[] = [];
function picturesThat(fail: (url: string) => boolean) {
  loads = [];
  class FakeImage {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    set src(url: string) {
      loads.push(url);
      setTimeout(() => (fail(url) ? this.onerror() : this.onload()));
    }
  }
  Object.assign(globalThis, { Image: FakeImage });
}

describe('Skin pictures before the PDF', () => {
  const realImage = globalThis.Image;
  afterEach(() => Object.assign(globalThis, { Image: realImage }));

  it('resolves at once for pages with no picture', async () => {
    picturesThat(() => true);
    await expect(skinPicturesReady(page())).resolves.toBeUndefined();
    expect(loads).toEqual([]);
  });

  it('waits for each picture once, however many pages draw it', async () => {
    picturesThat(() => false);
    const root = page('blob:paper.jpg', 'blob:paper.jpg', 'blob:linen.jpg');
    await expect(skinPicturesReady(root)).resolves.toBeUndefined();
    expect(loads).toEqual(['blob:paper.jpg', 'blob:linen.jpg']);
  });

  it('fails when a picture cannot be read', async () => {
    picturesThat((url) => url === 'blob:gone.jpg');
    await expect(skinPicturesReady(page('blob:paper.jpg', 'blob:gone.jpg'))).rejects.toThrow(
      'A picture of the Skin could not be read',
    );
  });

  it('ignores pictures outside the skin, like a mockup or the clear space logo', async () => {
    picturesThat(() => true);
    const root = page();
    root.insertAdjacentHTML('beforeend', '<svg class="clearspace-svg"><image href="blob:logo.png"/></svg>');
    await expect(skinPicturesReady(root)).resolves.toBeUndefined();
  });
});
