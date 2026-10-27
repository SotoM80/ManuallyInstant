import { ABOUT } from '../../data/landing'
import { SectionLabel } from './SectionLabel'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

export function About() {
  return (
    <section id="about" className="landing-section landing-about" aria-label="About">
      <SectionLabel number={1}>About us</SectionLabel>
      <div className="landing-about-body">
        <p className="landing-manifesto reveal">{ABOUT.manifesto}</p>

        <dl className="landing-stats">
          {ABOUT.stats.map((stat) => (
            <div key={stat.label} className="landing-stat reveal">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="landing-subtitle reveal">The team</h3>
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
      </div>
    </section>
  )
}
