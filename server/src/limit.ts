// How many pages are converted at the same time; past it the server answers 503 busy instead of
// waiting, so its memory stays bounded (specs/cmykserver.md). `take` gives a release function,
// or null when every slot is in use.
export function createLimit(max: number) {
  let busy = 0
  return {
    take() {
      if (busy >= max) return null
      busy++
      let released = false
      return () => {
        if (released) return
        released = true
        busy--
      }
    },
  }
}
