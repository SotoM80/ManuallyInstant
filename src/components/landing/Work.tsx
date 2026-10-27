import { PROJECTS } from '../../data/landing'

// An asymmetric grid: the CSS gives each project its size from its position in the list.
export function Work() {
  return (
    <section id="work" className="landing-section landing-work" aria-label="Work">
      <h2 className="landing-label reveal">Selected work</h2>
      <ul className="landing-projects">
        {PROJECTS.map((project) => (
          <li key={project.client} className="landing-project reveal">
            <figure>
              <div className="landing-project-image">
                <img src={project.image} alt={`${project.client}: ${project.title}`} loading="lazy" />
                <span className="landing-project-overlay" aria-hidden="true">
                  {project.title}
                </span>
              </div>
              <figcaption>
                <span className="landing-project-client">{project.client}</span>
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
