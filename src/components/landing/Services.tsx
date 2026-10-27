import { Link } from 'react-router'
import { SERVICES } from '../../data/landing'
import { SectionLabel } from './SectionLabel'

export function Services() {
  return (
    <section id="services" className="landing-section landing-services" aria-label="Services">
      <SectionLabel number={2}>What we do</SectionLabel>
      <ol className="landing-service-list">
        {SERVICES.map((service, index) => {
          const content = (
            <>
              <span className="landing-service-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="landing-service-title">{service.title}</span>
              <span className="landing-service-text">{service.text}</span>
            </>
          )
          return (
            <li key={service.title} className="landing-service reveal">
              {service.to ? (
                <Link className="landing-service-row" to={service.to}>
                  {content}
                  <span className="landing-service-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              ) : (
                <div className="landing-service-row">{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
