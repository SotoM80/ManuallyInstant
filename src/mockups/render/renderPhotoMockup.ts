import { areaGrid, logoMesh, surfaceSize } from '../warp'
import { fitLogo } from '../geometry'
import type { Blend, Placement, PhotoTemplate } from '../types'

// Composes a photo mockup in WebGL and returns it as a PNG data URL (see specs/mockups.md,
// Photo mockups, and ADR 0014): the product tinted inside its mask with the photo's own
// brightness, and the logo in its area, printed (multiplied) or solid with the photo's shading.
// jsdom has no WebGL, so tests mock this module.
export type PhotoMockupInput = {
  template: PhotoTemplate
  color: string // "#RRGGBB"
  logoUrl: string | null
  placement: Placement
  blend: Blend
  width: number // of the image made, in pixels
}

// The logo is drawn twice as big as it is shown, so it stays sharp when the PDF is zoomed in
const LOGO_DETAIL = 2

// The brightness of a white product in a photo: tinting divides by it, so the lit parts of a
// white t-shirt take exactly the chosen color and its folds stay darker
const WHITE_LEVEL = 0.92

// The color of a pixel of the photo with the product tinted: shared by both passes, so where the
// logo is drawn, it is blended with exactly what is under it
const TINT = `
uniform sampler2D uPhoto;
uniform sampler2D uMask;
uniform vec3 uTint;
uniform float uTintable;
uniform float uWhite;
vec3 tinted(vec2 uv, out float shade) {
  vec4 photo = texture2D(uPhoto, uv);
  float brightness = dot(photo.rgb, vec3(0.299, 0.587, 0.114));
  shade = clamp(brightness / uWhite, 0.0, 1.15);
  vec4 mask = texture2D(uMask, uv);
  float inside = mask.a * mask.r * uTintable; // white and opaque where the product is
  return mix(photo.rgb, clamp(uTint * shade, 0.0, 1.0), inside);
}`

// Pass 1: the whole photo, tinted
const PHOTO_VERTEX = `
attribute vec2 aPosition;
varying vec2 vUV;
void main() {
  vUV = vec2((aPosition.x + 1.0) / 2.0, (1.0 - aPosition.y) / 2.0); // (0, 0) at the photo's top left
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const PHOTO_FRAGMENT = `
precision highp float;
${TINT}
varying vec2 vUV;
void main() {
  float shade;
  gl_FragColor = vec4(tinted(vUV, shade), 1.0);
}`

// Pass 2: the logo on its mesh, bent through the area's points (positions in the photo's pixels)
const LOGO_VERTEX = `
attribute vec2 aPosition;
attribute vec2 aLogo;
uniform vec2 uSize;
varying vec2 vLogo;
varying vec2 vUV;
void main() {
  vUV = aPosition / uSize;
  vLogo = aLogo;
  gl_Position = vec4(vUV.x * 2.0 - 1.0, 1.0 - vUV.y * 2.0, 0.0, 1.0);
}`

const LOGO_FRAGMENT = `
precision highp float;
${TINT}
uniform sampler2D uLogo;
uniform float uSolid;
varying vec2 vLogo;
varying vec2 vUV;
void main() {
  float shade;
  vec3 under = tinted(vUV, shade);
  vec4 logo = texture2D(uLogo, vLogo);
  vec3 printed = under * logo.rgb;
  vec3 solid = logo.rgb * mix(1.0, min(shade, 1.0), 0.6);
  gl_FragColor = vec4(mix(under, mix(printed, solid, uSolid), logo.a), 1.0);
}`

const images = new Map<string, Promise<HTMLImageElement>>()

function loadImage(url: string) {
  let image = images.get(url)
  if (!image) {
    image = new Promise((done, fail) => {
      const element = new Image()
      element.onload = () => done(element)
      element.onerror = () => fail(new Error(`Could not load ${url}`))
      element.src = url
    })
    image.catch(() => images.delete(url)) // a failed image can be tried again
    images.set(url, image)
  }
  return image
}

// A 2D canvas of the given size, with something drawn on it
function canvas2d(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No 2D canvas')
  draw(context)
  return canvas
}

function hexToRgb(hex: string) {
  const value = parseInt(hex.slice(1), 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader')
  return shader
}

function program(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const built = gl.createProgram()!
  gl.attachShader(built, compile(gl, gl.VERTEX_SHADER, vertex))
  gl.attachShader(built, compile(gl, gl.FRAGMENT_SHADER, fragment))
  gl.linkProgram(built)
  if (!gl.getProgramParameter(built, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(built) ?? 'Program')
  return built
}

// Feeds an attribute from a list of numbers, two per vertex
function attribute(gl: WebGLRenderingContext, built: WebGLProgram, name: string, values: Float32Array) {
  const location = gl.getAttribLocation(built, name)
  if (location < 0) return
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
}

function texture(gl: WebGLRenderingContext, unit: number, source: TexImageSource) {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  // Photos are rarely a power of two wide: no mipmaps, edges clamped (WebGL 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
}

async function compose(input: PhotoMockupInput) {
  const { template } = input
  const [photoWidth, photoHeight] = template.size
  const width = Math.round(input.width)
  const height = Math.round((width * photoHeight) / photoWidth)
  const toImage = width / photoWidth

  const [photo, logo, maskImage] = await Promise.all([
    loadImage(template.image),
    input.logoUrl ? loadImage(input.logoUrl) : Promise.resolve(null),
    template.maskImage ? loadImage(template.maskImage) : Promise.resolve(null),
  ])

  // The photo, the mask and the logo are drawn at the size they are used: sharp, and within the
  // GPU's limits whatever the size of the files
  const photoCanvas = canvas2d(width, height, (context) => {
    context.imageSmoothingQuality = 'high'
    context.drawImage(photo, 0, 0, width, height)
  })
  const maskCanvas = canvas2d(width, height, (context) => {
    if (maskImage) {
      // A mask from the editor: drawn at this size, its soft edge scales with it
      context.imageSmoothingQuality = 'high'
      context.drawImage(maskImage, 0, 0, width, height)
      return
    }
    context.fillStyle = '#FFFFFF'
    context.beginPath()
    for (const polygon of template.mask) {
      polygon.forEach(([x, y], i) => (i === 0 ? context.moveTo(x * toImage, y * toImage) : context.lineTo(x * toImage, y * toImage)))
      context.closePath()
    }
    context.fill()
  })
  const aspect = logo ? logo.naturalWidth / logo.naturalHeight || 1 : 1
  const grid = areaGrid(template)
  const fitted = fitLogo({ x: 0, y: 0, ...surfaceSize(grid) }, aspect, input.placement.scale)
  const logoCanvas = logo
    ? canvas2d(fitted.width * toImage * LOGO_DETAIL, fitted.height * toImage * LOGO_DETAIL, (context) => {
        context.imageSmoothingQuality = 'high'
        context.drawImage(logo, 0, 0, context.canvas.width, context.canvas.height)
      })
    : canvas2d(1, 1, () => {})

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false })
  if (!gl) throw new Error('No WebGL')
  try {
    texture(gl, 0, photoCanvas)
    texture(gl, 1, maskCanvas)
    texture(gl, 2, logoCanvas)
    const tint = (built: WebGLProgram) => {
      const uniform = (name: string) => gl.getUniformLocation(built, name)
      gl.uniform1i(uniform('uPhoto'), 0)
      gl.uniform1i(uniform('uMask'), 1)
      gl.uniform3fv(uniform('uTint'), hexToRgb(input.color))
      gl.uniform1f(uniform('uTintable'), template.tintable ? 1 : 0)
      gl.uniform1f(uniform('uWhite'), WHITE_LEVEL)
      return uniform
    }
    gl.viewport(0, 0, width, height)

    // Pass 1: the photo, tinted
    const photoProgram = program(gl, PHOTO_VERTEX, PHOTO_FRAGMENT)
    gl.useProgram(photoProgram)
    tint(photoProgram)
    attribute(gl, photoProgram, 'aPosition', new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    // Pass 2: the logo on its mesh
    if (logo) {
      const mesh = logoMesh(grid, aspect, input.placement)
      const logoProgram = program(gl, LOGO_VERTEX, LOGO_FRAGMENT)
      gl.useProgram(logoProgram)
      const uniform = tint(logoProgram)
      gl.uniform1i(uniform('uLogo'), 2)
      gl.uniform1f(uniform('uSolid'), input.blend === 'solid' ? 1 : 0)
      gl.uniform2f(uniform('uSize'), photoWidth, photoHeight)
      attribute(gl, logoProgram, 'aPosition', mesh.positions)
      attribute(gl, logoProgram, 'aLogo', mesh.logoPoints)
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count)
    }
    return canvas.toDataURL('image/png')
  } finally {
    // Browsers keep only a few WebGL contexts alive: free this one at once
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

// The same mockup is drawn in the preview and in the PDF copy: keep the last ones made
const MAX_CACHED = 40
const made = new Map<string, Promise<string>>()

export function renderPhotoMockup(input: PhotoMockupInput): Promise<string> {
  const key = JSON.stringify([input.template.id, input.template.revision ?? 0, input.template.image, input.color, input.logoUrl, input.placement, input.blend, input.width])
  let image = made.get(key)
  if (!image) {
    image = compose(input)
    image.catch(() => made.delete(key))
    made.set(key, image)
    if (made.size > MAX_CACHED) made.delete(made.keys().next().value!)
  }
  return image
}
