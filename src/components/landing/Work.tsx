import { PROJECTS } from '../../data/landing'
import { SectionLabel } from './SectionLabel'

export function Work() {
  return (
    <section id="work" className="landing-section landing-work" aria-label="Work">
      <SectionLabel number={3}>Selected work</SectionLabel>
      <ul className="landing-projects">
        {PROJECTS.map((project) => (
          <li key={project.client} className="landing-project reveal">
            <figure>
              <div className="landing-project-image">
                <img src={project.image} alt={`${project.client}: ${project.title}`} loading="lazy" />
              </div>
              <figcaption>
                <span className="landing-project-client">{project.client}</span>
                <span className="landing-project-title">{project.title}</span>
                <span className="landing-project-meta">
                  {project.category} · {project.year}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
