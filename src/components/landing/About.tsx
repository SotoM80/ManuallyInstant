import { ABOUT } from '../../data/landing'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

export function About() {
  return (
    <section id="about" className="landing-section landing-about" aria-label="About">
      <h2 className="landing-label reveal">About us</h2>
      {/* Each word lights up as it crosses the screen (motion.md, Landing) */}
      <p className="landing-manifesto">
        {ABOUT.manifesto.split(' ').map((word, index) => (
          <span key={index} className="landing-manifesto-word">
            {word}{' '}
          </span>
        ))}
      </p>

      <dl className="landing-stats">
        {ABOUT.stats.map((stat) => (
          <div key={stat.label} className="landing-stat reveal">
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="landing-label reveal">The team</h3>
      <ul className="landing-team">
        {ABOUT.team.map((member) => (
          <li key={member.name} className="landing-member reveal">
            <span className="landing-member-initials" aria-hidden="true">
              {initials(member.name)}
            </span>
            <span className="landing-member-name">{member.name}</span>
            <span className="landing-member-role">{member.role}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
