import { useEffect, useRef } from 'react'
import type { UploadedImage } from '../types'

// An image field whose new file waits for the Apply button of the preview (see docs/adr/0007).
// Everything else in the forms reaches the preview live; only new images wait.
export type PendingImage = {
  file: File | null // last file chosen, valid or not (its name is shown in the field)
  chosenAt: number // Apply count when it was chosen: one Apply later, it is applied
  shown: File | null // the file the manual showed before this one was chosen
}

export const NO_IMAGE: PendingImage = { file: null, chosenAt: 0, shown: null }

// The file the manual shows now: the chosen one once applied (and valid), else the one before.
export function shownFile(image: PendingImage, applyCount: number, error: string) {
  return image.file && !error && applyCount > image.chosenAt ? image.file : image.shown
}

// A valid new file chosen since the last Apply → Apply turns on.
export function isPending(image: PendingImage, applyCount: number, error: string) {
  return Boolean(image.file && !error && image.chosenAt === applyCount && image.file !== image.shown)
}

// `error` is the error of the file chosen before, so a wrong file is never kept as "shown".
export function chooseFile(
  image: PendingImage,
  file: File | null,
  applyCount: number,
  error: string,
): PendingImage {
  return { file, chosenAt: applyCount, shown: shownFile(image, applyCount, error) }
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
// the form started with (compared by value: an Apply alone makes a new, equal object), so the
// manual keeps its placeholders until the section is really touched.
export function useLiveData<T>(data: T, onChange?: (data: T) => void) {
  const initial = useRef(JSON.stringify(data))
  const started = useRef(false)
  useEffect(() => {
    if (!started.current && JSON.stringify(data) === initial.current) return
    started.current = true
    onChange?.(data)
  }, [data, onChange])
}

// Tells the page whether this form has images waiting for Apply.
export function usePendingReport(pending: boolean, onPendingChange?: (pending: boolean) => void) {
  useEffect(() => {
    onPendingChange?.(pending)
  }, [pending, onPendingChange])
}
