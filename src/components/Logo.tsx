import { Link } from 'react-router'
import logo from '../assets/logo.svg'
import '../css/Logo.css'

// App logo, left side of the header. Replace src/assets/logo.svg to change it.
export function Logo() {
  return (
    <Link className="app-logo" to="/">
      <img src={logo} alt="ManuallyInstant" />
    </Link>
  )
}
