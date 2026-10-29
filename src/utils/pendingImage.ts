import { useEffect, useRef } from 'react'
import type { UploadedImage } from '../types'

// An image field whose new file waits for the Apply button next to it (see docs/adr/0007 and
// 0020). Everything else in the forms reaches the preview live; only new images wait.
export type PendingImage = {
  file: File | null // last file chosen, valid or not (its name is shown in the field)
  shown: File | null // the file the manual shows: the one applied last
}

export const NO_IMAGE: PendingImage = { file: null, shown: null }

// The file the manual shows now.
export function shownFile(image: PendingImage) {
  return image.shown
}

// A valid new file, not shown yet → the field's Apply turns on.
export function isPending(image: PendingImage, error: string) {
  return Boolean(image.file && !error && image.file !== image.shown)
}

// Choosing a file never changes what the manual shows: that waits for Apply.
export function chooseFile(image: PendingImage, file: File | null): PendingImage {
  return { file, shown: image.shown }
}

// The field's Apply: its valid new file becomes the one shown. A wrong file is never shown.
export function applyImage(image: PendingImage, error: string): PendingImage {
  return isPending(image, error) ? { ...image, shown: image.file } : image
}

// One object URL per file, so redrawing the preview on every key does not make new ones.
const urls = new WeakMap<File, string>()

export function toImage(file: File): UploadedImage {
  let url = urls.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    urls.set(file, url)
  }
  return { url, name: file.name }
}

// Sends the form's data to the preview each time it changes. Not while it still equals what
// the form started with (compared by value: re-rendering alone makes a new, equal object), so
// the manual keeps its placeholders until the section is really touched.
export function useLiveData<T>(data: T, onChange?: (data: T) => void) {
  const initial = useRef(JSON.stringify(data))
  const started = useRef(false)
  useEffect(() => {
    if (!started.current && JSON.stringify(data) === initial.current) return
    started.current = true
    onChange?.(data)
  }, [data, onChange])
}
