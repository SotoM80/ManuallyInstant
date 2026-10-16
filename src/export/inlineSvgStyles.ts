// html-to-image copies the styles of every HTML element, but copies an <svg> in one piece, so its
// shapes keep only their attributes: what the CSS gave them is lost (fill: none, stroke:
// currentColor, vector-effect, the opacity of the logo, the size of the measures…), and an SVG
// shape with no style is filled in black (see ADR 0012). This writes every computed property of
// each shape on the shape itself (currentColor already resolved), as html-to-image does for HTML,
// so the copy looks like the page. Only for the off-screen copy of the PDF: never the preview.
export function inlineSvgStyles(root: Element, getStyle: (element: Element) => CSSStyleDeclaration = getComputedStyle) {
  for (const element of root.querySelectorAll<SVGElement>('svg *')) {
    const computed = getStyle(element)
    for (let i = 0; i < computed.length; i++) {
      const property = computed.item(i)
      element.style.setProperty(property, computed.getPropertyValue(property), computed.getPropertyPriority(property))
    }
  }
}
