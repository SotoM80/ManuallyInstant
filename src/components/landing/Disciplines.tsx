import { MARQUEE_WORDS } from '../../data/landing'

// A still strip of the studio's disciplines between two rules. Decoration only.
export function Disciplines() {
  return (
    <div className="landing-disciplines" aria-hidden="true">
      {MARQUEE_WORDS.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </div>
  )
}
