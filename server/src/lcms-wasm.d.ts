// The part of lcms-wasm the server uses; the package ships no types (ADR 0019)
declare module 'lcms-wasm' {
  type Handle = number

  export type Lcms = {
    cmsOpenProfileFromMem(data: Uint8Array, size: number): Handle
    cmsCreate_sRGBProfile(): Handle
    cmsCloseProfile(profile: Handle): void
    cmsGetColorSpaceASCII(profile: Handle): string | null
    cmsGetProfileInfoASCII(profile: Handle, info: number, language: string, country: string): string
    cmsCreateTransform(input: Handle, inputFormat: number, output: Handle, outputFormat: number, intent: number, flags: number): Handle
    cmsDoTransform(transform: Handle, input: Uint8Array, pixels: number): Uint8Array
    cmsDeleteTransform(transform: Handle): void
  }

  export function instantiate(): Promise<Lcms>
  export const TYPE_RGB_8: number
  export const TYPE_CMYK_8: number
  export const INTENT_RELATIVE_COLORIMETRIC: number
  export const cmsFLAGS_BLACKPOINTCOMPENSATION: number
  export const cmsInfoDescription: number
}
