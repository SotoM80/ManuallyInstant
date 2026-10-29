// Every picture of the Skin's Image layers must load before the pages are drawn. html-to-image
// leaves a picture it cannot read blank, with no error, so the PDF would come out without it:
// one that fails stops the export instead (specs/skins.md, ADR 0023). Pages with no picture
// resolve at once.
export async function skinPicturesReady(root: HTMLElement) {
  const urls = new Set(
    Array.from(root.querySelectorAll('svg.skin-layer image'))
      .map((image) => image.getAttribute('href'))
      .filter((url): url is string => Boolean(url)),
  )
  await Promise.all(
    [...urls].map(
      (url) =>
        new Promise<void>((done, fail) => {
          const picture = new Image()
          picture.onload = () => done()
          picture.onerror = () => fail(new Error('A picture of the Skin could not be read'))
          picture.src = url
        }),
    ),
  )
}
