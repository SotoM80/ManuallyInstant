import { MARQUEE_WORDS } from '../../data/landing'

// Two copies of the words side by side; sliding the track by half its width loops seamlessly.
// Decoration only, so it is hidden from screen readers.
export function Marquee() {
  return (
    <div className="landing-marquee" aria-hidden="true">
      <div className="landing-marquee-track">
        {[0, 1].map((copy) => (
          <span key={copy} className="landing-marquee-group">
            {MARQUEE_WORDS.map((word) => (
              <span key={word} className="landing-marquee-word">
                {word}
                <span className="landing-marquee-star">✺</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
