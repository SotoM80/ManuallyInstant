// "01 — About us": the number and label over a thin rule that open each section.
export function SectionLabel({ number, children }: { number: number; children: string }) {
  return (
    <h2 className="landing-label reveal">
      <span className="landing-label-number" aria-hidden="true">
        {String(number).padStart(2, '0')} —
      </span>{' '}
      {children}
    </h2>
  )
}
